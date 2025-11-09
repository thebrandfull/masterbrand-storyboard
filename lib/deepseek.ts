import type { BrandSuggestions } from "@/types/brand"
import type { BrandBrainContext } from "@/lib/brand-brain"
import type { Database } from "@/types/database"
import type { ScriptUpgradeRequest, ScriptUpgrade } from "@/types/youtube"

type BrandRow = Database["public"]["Tables"]["brands"]["Row"]
type PromptBrand = Pick<
  BrandRow,
  "name" | "mission" | "voice_tone" | "target_audience" | "visual_lexicon" | "dos" | "donts" | "negative_prompts"
>

export interface PromptGenerationRequest {
  brand: PromptBrand
  topic: string
  platform: string
  visualKeywords?: string[]
  negativePrompts?: string[]
  cameos?: Array<{ name: string; description: string; visualDescription: string }>
}

export interface GeneratedContent {
  prompts: string[]
  title: string
  description: string
  tags: string[]
  thumbnailBrief: string
  voiceoverScript?: string
}

interface BrandSuggestionInput {
  name: string
  mission: string
}

export interface BrandChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface BrandChatRequest {
  brandName: string
  contextSummary: string
  history: BrandChatMessage[]
  prompt: string
  vectorInsights?: BrandBrainContext["vectors"]
}

const MAX_ATTEMPTS = 3
const RETRY_DELAYS = [600, 1500, 3000]

export class DeepSeekError extends Error {
  constructor(
    message: string,
    public code: "rate_limit" | "server" | "network" | "invalid",
    public status: number = 500
  ) {
    super(message)
    this.name = "DeepSeekError"
  }
}

export async function generateContent(
  request: PromptGenerationRequest
): Promise<GeneratedContent> {
  const { brand, topic, platform, visualKeywords, negativePrompts, cameos } = request

  const cameoSection = cameos?.length
    ? cameos
        .map(
          (cameo) =>
            `- ${cameo.name}: ${cameo.description} (visuals: ${cameo.visualDescription})`
        )
        .join("\n")
    : "(none specified)"

  const systemPrompt = `You are an expert content creator and prompt engineer specializing in creating video content prompts for social media. Your task is to generate creative, platform-specific content based on brand guidelines.`

  const userPrompt = `
Generate content for a ${platform} video about: ${topic}

BRAND CONTEXT:
- Name: ${brand.name}
- Mission: ${brand.mission}
- Target Audience: ${brand.target_audience}
- Voice/Tone: ${brand.voice_tone}
- Visual Style: ${visualKeywords?.join(", ") || brand.visual_lexicon}

BRAND RULES:
DO: ${brand.dos?.join(", ")}
DON'T: ${brand.donts?.join(", ")}

VISUAL GUIDELINES:
Positive: ${visualKeywords?.join(", ") || brand.visual_lexicon}
Negative (avoid): ${negativePrompts?.join(", ") || brand.negative_prompts?.join(", ")}

CAMEO CHARACTERS TO FEATURE:
${cameoSection}

PLATFORM CONSTRAINTS:
${getPlatformConstraints(platform)}

Generate the following in JSON format:
{
  "prompts": [
    "prompt_variation_1",
    "prompt_variation_2",
    "prompt_variation_3"
  ],
  "title": "Catchy, platform-appropriate title",
  "description": "Engaging description with CTA",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnailBrief": "Description of an attention-grabbing thumbnail"
}

IMPORTANT:
1. Each prompt should be detailed, specific, and optimized for text-to-video generation
2. Include camera angles, lighting, mood, and visual elements
3. Incorporate brand visual keywords naturally
4. Follow all brand do's and don'ts
5. Title should be under ${getTitleLimit(platform)} characters
6. Description should be under ${getDescLimit(platform)} characters
7. Use ${getHashtagCount(platform)} relevant hashtags
`

  let lastError: DeepSeekError | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const data = await callDeepSeek(systemPrompt, userPrompt)
      const contentString = data?.choices?.[0]?.message?.content

      if (!contentString) {
        throw new DeepSeekError("DeepSeek response was empty.", "server")
      }

      const content = JSON.parse(contentString)

      return {
        prompts: content.prompts || [],
        title: content.title || "",
        description: content.description || "",
        tags: content.tags || [],
        thumbnailBrief: content.thumbnailBrief || "",
        voiceoverScript: content.voiceoverScript || content.description || "",
      }
    } catch (error) {
      lastError = normalizeDeepSeekError(error)
      const shouldRetry = canRetry(lastError.code) && attempt < MAX_ATTEMPTS

      if (!shouldRetry) {
        throw lastError
      }

      const delayMs = RETRY_DELAYS[attempt - 1] ?? 2000
      await delay(delayMs)
    }
  }

  throw lastError ?? new DeepSeekError("DeepSeek generation failed.", "server")
}

export async function generateBrandSuggestions(
  input: BrandSuggestionInput
): Promise<BrandSuggestions> {
  const { name, mission } = input

  const systemPrompt =
    "You are a brand strategist who generates concise suggestion lists to help founders define their brand foundations."

  const userPrompt = `
BRAND NAME: ${name}
MISSION: ${mission}

Provide JSON with arrays of 3-5 concise suggestions for each field:
{
  "targetAudience": ["..."],
  "voiceTone": ["..."],
  "languageStyle": ["..."],
  "coreValues": ["..."],
  "visualKeywords": ["..."],
  "aestheticReferences": ["..."],
  "negativePrompts": ["..."],
  "dos": ["..."],
  "donts": ["..."],
  "proofPoints": ["..."],
  "ctaLibrary": ["..."],
  "legalClaims": ["..."]
}

Guidelines:
- Keep entries short (under 12 words)
- Tailor recommendations to the mission statement
- Use diverse vocabulary
- Legal claims should focus on risky statements to avoid
`

  const baseResult: BrandSuggestions = {
    targetAudience: [],
    voiceTone: [],
    languageStyle: [],
    coreValues: [],
    visualKeywords: [],
    aestheticReferences: [],
    negativePrompts: [],
    dos: [],
    donts: [],
    proofPoints: [],
    ctaLibrary: [],
    legalClaims: [],
  }

  let lastError: DeepSeekError | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const data = await callDeepSeek(systemPrompt, userPrompt)
      const contentString = data?.choices?.[0]?.message?.content
      if (!contentString) {
        throw new DeepSeekError("DeepSeek response was empty.", "server")
      }

      const parsed = JSON.parse(contentString)
      const result: BrandSuggestions = { ...baseResult };

      (Object.keys(baseResult) as (keyof BrandSuggestions)[]).forEach((key) => {
        const value = parsed?.[key]
        result[key] = normalizeSuggestionArray(value)
      })

      return result
    } catch (error) {
      lastError = normalizeDeepSeekError(error)
      const shouldRetry = canRetry(lastError.code) && attempt < MAX_ATTEMPTS
      if (!shouldRetry) {
        throw lastError
      }
      const delayMs = RETRY_DELAYS[attempt - 1] ?? 2000
      await delay(delayMs)
    }
  }

  throw lastError ?? new DeepSeekError("Suggestion generation failed.", "server")
}

export async function generateScriptUpgrade(
  request: ScriptUpgradeRequest
): Promise<ScriptUpgrade> {
  const {
    transcriptText,
    videoTitle,
    durationSeconds,
    channelName,
    goal,
    issues,
    audience,
    tone,
    callToAction,
  } = request

  const systemPrompt =
    "You are a senior YouTube script showrunner. You tighten pacing, craft stronger hooks, and rewrite scripts into concise outlines while respecting the creator's voice."

  const metaBlock = `TITLE: ${videoTitle}
CHANNEL: ${channelName || "Unknown"}
DURATION: ${durationSeconds ?? "Unknown"} seconds
GOAL: ${goal || "Increase retention"}
ISSUES TO FIX: ${issues || "None provided"}
INTENDED AUDIENCE: ${audience || "General"}
TONE: ${tone || "Energetic"}
CTA FOCUS: ${callToAction || "Encourage viewers to subscribe"}`

  const userPrompt = `Refine the following YouTube script transcript. Keep the creator's expertise but remove repetition, tighten pacing, and reframe it around a bold hook.

${metaBlock}

ORIGINAL TRANSCRIPT:
"""
${transcriptText}
"""

Return JSON with this exact shape:
{
  "hook": "single captivating opening line",
  "refinedIdea": "core premise tightened into one sentence",
  "outline": [
    {
      "label": "Beat label",
      "summary": "one sentence beat summary",
      "detail": "two to three sentences elaborating the beat",
      "upgrade": "specific change vs original"
    }
  ],
  "improvements": ["list of concrete upgrade bullet points"],
  "ctas": ["2-3 short CTA variations"],
  "risks": ["call out any claims, compliance or retention risks"],
  "closing": "one sentence closing line"
}

Rules:
- Outline must be chronological, 4-8 beats.
- Keep language concise (<= 20 words per sentence when possible).
- Improvements should be specific ("Cut redundant anecdote in minute 4" etc.).
- If transcript lacks detail, propose creative fills but label them as suggestions.
`

  let lastError: DeepSeekError | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const data = await callDeepSeek(systemPrompt, userPrompt)
      const raw = data?.choices?.[0]?.message?.content

      if (!raw) {
        throw new DeepSeekError("DeepSeek returned an empty script upgrade.", "server")
      }

      const parsed = JSON.parse(raw)

      return {
        hook: parsed.hook || "",
        refinedIdea: parsed.refinedIdea || "",
        outline: Array.isArray(parsed.outline) ? parsed.outline : [],
        improvements: parsed.improvements || [],
        ctas: parsed.ctas || [],
        risks: parsed.risks || [],
        closing: parsed.closing || "",
      }
    } catch (error) {
      lastError = normalizeDeepSeekError(error)
      const shouldRetry = canRetry(lastError.code) && attempt < MAX_ATTEMPTS

      if (!shouldRetry) {
        throw lastError
      }

      const delayMs = RETRY_DELAYS[attempt - 1] ?? 2000
      await delay(delayMs)
    }
  }

  throw lastError ?? new DeepSeekError("Failed to upgrade script with DeepSeek.", "server")
}

function getPlatformConstraints(platform: string): string {
  const constraints: Record<string, string> = {
    tiktok: "Vertical 9:16 format, 15-60 seconds, hook in first 3 seconds, trending audio-friendly",
    instagram: "9:16 Reels format, 15-90 seconds, aesthetic-focused, shareable",
    youtube: "16:9 or 9:16 Shorts, 15-60 seconds for Shorts, engaging thumbnail needed",
  }
  return constraints[platform.toLowerCase()] || "Vertical video, short-form content"
}

function getTitleLimit(platform: string): number {
  const limits: Record<string, number> = {
    tiktok: 150,
    instagram: 125,
    youtube: 100,
  }
  return limits[platform.toLowerCase()] || 100
}

function getDescLimit(platform: string): number {
  const limits: Record<string, number> = {
    tiktok: 2200,
    instagram: 2200,
    youtube: 5000,
  }
  return limits[platform.toLowerCase()] || 500
}

function getHashtagCount(platform: string): number {
  const counts: Record<string, number> = {
    tiktok: 5,
    instagram: 10,
    youtube: 5,
  }
  return counts[platform.toLowerCase()] || 5
}

async function callDeepSeek(systemPrompt: string, userPrompt: string) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new DeepSeekError(
        "DeepSeek API key missing. Set DEEPSEEK_API_KEY in your environment.",
        "invalid",
        500
      )
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : null

    if (response.status === 429) {
      throw new DeepSeekError(
        "DeepSeek rate limit reached. Please retry in a few seconds.",
        "rate_limit",
        429
      )
    }

    if (!response.ok) {
      const apiMessage = data?.error?.message || response.statusText
      const code = response.status >= 500 ? "server" : "invalid"
      throw new DeepSeekError(`DeepSeek API error: ${apiMessage}`, code, response.status)
    }

    return data
  } catch (error) {
    if (error instanceof DeepSeekError) {
      throw error
    }
    throw new DeepSeekError(
      "Unable to reach DeepSeek. Check your network connection or API key.",
      "network"
    )
  }
}

async function callDeepSeekWithMessages(messages: { role: string; content: string }[]) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new DeepSeekError(
        "DeepSeek API key missing. Set DEEPSEEK_API_KEY in your environment.",
        "invalid",
        500
      )
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.7,
        max_tokens: 1200,
      }),
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : null

    if (response.status === 429) {
      throw new DeepSeekError(
        "DeepSeek rate limit reached. Please retry in a few seconds.",
        "rate_limit",
        429
      )
    }

    if (!response.ok) {
      const apiMessage = data?.error?.message || response.statusText
      const code = response.status >= 500 ? "server" : "invalid"
      throw new DeepSeekError(`DeepSeek API error: ${apiMessage}`, code, response.status)
    }

    return data
  } catch (error) {
    if (error instanceof DeepSeekError) {
      throw error
    }
    throw new DeepSeekError(
      "Unable to reach DeepSeek. Check your network connection or API key.",
      "network"
    )
  }
}

function normalizeDeepSeekError(error: unknown): DeepSeekError {
  if (error instanceof DeepSeekError) {
    return error
  }
  return new DeepSeekError(
    "DeepSeek request failed unexpectedly. Please try again.",
    "server"
  )
}

function canRetry(code: DeepSeekError["code"]) {
  return code === "network" || code === "server" || code === "rate_limit"
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeSuggestionArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean)
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()]
  }
  return []
}
export async function generateBrandChatResponse(request: BrandChatRequest) {
  const { brandName, contextSummary, history, prompt, vectorInsights } = request
  const systemPrompt = `You are ${brandName}'s internal operating brain. Respond like the founder chatting with their team—never with customers. Sound natural, candid, and human. Use first-person plural ("we") with a confident but conversational tone. Offer clear takeaways, but avoid rigid templates or section headers. Keep replies under 220 words and cite references with [number] only when you quote them directly.`

  const referenceList = (vectorInsights || [])
    .slice(0, 5)
    .map((item, index) => {
      const label = item.metadata?.label ? ` ${item.metadata.label}` : ""
      const contentSnippet =
        item.content.length > 240 ? `${item.content.slice(0, 237)}…` : item.content
      return `[${index + 1}] (${item.type}${label}) ${contentSnippet}`
    })
    .join("\n")

  const referenceBlock = referenceList
    ? `REFERENCE LIBRARY (cite with [number] when referencing specific lines):\n${referenceList}\n`
    : ""

  const replyGuidance = `Guidelines:
- Start with a quick acknowledgement in plain language (e.g., "Hey, got it" or similar).
- Share insights or decisions in one to two short paragraphs.
- If actions are needed, list up to two short bullets prefixed with "•".
- Skip headers like SNAPSHOT/NEXT MOVES; just talk like a person.`.trim()

  const userPrompt = `TEAM CONTEXT (confidential):\n${contextSummary}\n\n${referenceBlock}${replyGuidance}\n\nREQUEST FROM TEAM:\n${prompt}`

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userPrompt },
  ]

  if (!process.env.DEEPSEEK_API_KEY) {
    return {
      response: `(${brandName}) ${prompt}\n\nContext used:\n${contextSummary}`,
      fallback: true,
    }
  }

  let lastError: DeepSeekError | null = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const data = await callDeepSeekWithMessages(messages)
      const text = data?.choices?.[0]?.message?.content?.trim()
      if (!text) {
        throw new DeepSeekError("Empty chat response", "server")
      }
      return { response: text, fallback: false }
    } catch (error) {
      lastError = normalizeDeepSeekError(error)
      const shouldRetry = canRetry(lastError.code) && attempt < MAX_ATTEMPTS
      if (!shouldRetry) {
        break
      }
      await delay(RETRY_DELAYS[attempt - 1] ?? 1500)
    }
  }

  const fallbackResponse = `(${brandName}) ${prompt}\n\nContext used:\n${contextSummary}`
  return { response: fallbackResponse, fallback: true, error: lastError?.message }
}
