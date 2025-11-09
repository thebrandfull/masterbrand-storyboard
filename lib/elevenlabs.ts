import { randomUUID } from "crypto"

const API_BASE = "https://api.elevenlabs.io/v1"
const DEFAULT_TTS_MODEL = "eleven_multilingual_v2"
const DEFAULT_S2S_MODEL = "eleven_turbo_v2"
const DEFAULT_STT_MODEL = "scribe_v1"

export type ElevenLabsVoice = {
  voice_id: string
  name: string
  description?: string
  category?: string
  labels?: Record<string, string>
  preview_url?: string
}

export type ElevenLabsVoiceSettings = {
  stability?: number
  similarity_boost?: number
  style?: number
  use_speaker_boost?: boolean
}

export type GenerateSpeechInput = {
  text: string
  voiceId: string
  modelId?: string
  voiceSettings?: ElevenLabsVoiceSettings
}

export type AlignmentCharacter = {
  character: string
  start: number
  end: number
}

export type GenerateSpeechResult = {
  audioBase64: string
  alignment?: AlignmentCharacter[]
  model_id?: string
}

function getApiKey() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }
  return key
}

async function elevenLabsFetch(path: string, init?: RequestInit) {
  const key = getApiKey()
  const headers = new Headers(init?.headers)
  headers.set("xi-api-key", key)
  const body = init?.body as any
  const bodyIsFormData =
    body &&
    typeof body === "object" &&
    typeof body.append === "function" &&
    typeof body.entries === "function"
  if (!headers.has("Content-Type") && init?.body && !bodyIsFormData) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const detail = await safeParseError(response)
    throw new Error(detail ?? `ElevenLabs request failed with ${response.status}`)
  }

  return response
}

async function safeParseError(response: Response) {
  try {
    const text = await response.text()
    return text
  } catch {
    return null
  }
}

export async function fetchVoices() {
  const response = await elevenLabsFetch("/voices", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })
  const payload = await response.json()
  return (payload.voices ?? []) as ElevenLabsVoice[]
}

export async function generateSpeech({
  text,
  voiceId,
  modelId = DEFAULT_TTS_MODEL,
  voiceSettings,
}: GenerateSpeechInput): Promise<GenerateSpeechResult> {
  const body = {
    text,
    model_id: modelId,
    voice_settings: voiceSettings,
  }

  try {
    const response = await elevenLabsFetch(`/text-to-speech/${voiceId}`, {
      method: "POST",
      body: JSON.stringify({
        ...body,
        output_format: "json",
        alignment: true,
      }),
      headers: {
        Accept: "application/json",
      },
    })

    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const data = await response.json()
      const alignment = (data?.alignment?.characters ?? []) as AlignmentCharacter[]
      const audioBase64 = data?.audio ?? data?.audio_base64 ?? ""
      if (!audioBase64) {
        throw new Error("ElevenLabs did not return audio data")
      }
      return {
        audioBase64,
        alignment,
        model_id: data?.model_id ?? modelId,
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      audioBase64: buffer.toString("base64"),
      alignment: undefined,
      model_id: modelId,
    }
  } catch {
    const fallbackResponse = await elevenLabsFetch(`/text-to-speech/${voiceId}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        Accept: "audio/mpeg",
      },
    })

    const buffer = Buffer.from(await fallbackResponse.arrayBuffer())
    return {
      audioBase64: buffer.toString("base64"),
      alignment: undefined,
      model_id: modelId,
    }
  }
}

export type SpeechToSpeechInput = {
  audioFile: Blob
  voiceId: string
  modelId?: string
  voiceSettings?: ElevenLabsVoiceSettings
  removeBackgroundNoise?: boolean
}

export type SpeechToSpeechResult = {
  audioBase64: string
  model_id?: string
}

export async function speechToSpeech({
  audioFile,
  voiceId,
  modelId = DEFAULT_S2S_MODEL,
  voiceSettings,
  removeBackgroundNoise = true,
}: SpeechToSpeechInput): Promise<SpeechToSpeechResult> {
  const formData = new FormData()
  const buffer = await audioFile.arrayBuffer()
  const file = new File([buffer], "input-audio.webm", {
    type: audioFile.type || "audio/webm",
  })
  formData.append("audio", file)
  formData.append("model_id", modelId)
  if (voiceSettings) {
    formData.append("voice_settings", JSON.stringify(voiceSettings))
  }
  formData.append("remove_background_noise", String(removeBackgroundNoise))

  const response = await elevenLabsFetch(`/speech-to-speech/${voiceId}`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "audio/mpeg",
    },
  })

  const outputBuffer = Buffer.from(await response.arrayBuffer())
  return {
    audioBase64: outputBuffer.toString("base64"),
    model_id: modelId,
  }
}

export type TranscriptWord = {
  id: string
  text: string
  start: number
  end: number
  confidence?: number
}

type TranscriptionOptions = {
  languageCode?: string
  timestampsGranularity?: "word" | "character"
}

type TranscriptionResult = {
  text: string
  words: TranscriptWord[]
  language_code: string
}

export async function transcribeAudio(
  audio: Blob,
  options: TranscriptionOptions = {},
): Promise<TranscriptionResult> {
  const formData = new FormData()
  const arrayBuffer = await audio.arrayBuffer()
  const file = new File([arrayBuffer], "audio.mp3", {
    type: audio.type || "audio/mpeg",
  })
  formData.append("file", file)
  formData.append("model_id", DEFAULT_STT_MODEL)
  formData.append("response_format", "json")
  if (options.languageCode) {
    formData.append("language_code", options.languageCode)
  }
  if (options.timestampsGranularity) {
    formData.append("timestamps", options.timestampsGranularity)
  }

  const response = await elevenLabsFetch("/speech-to-text", {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  })

  const payload = await response.json()
  const transcriptText = payload.text ?? payload.transcript ?? ""
  const language = payload.language_code ?? options.languageCode ?? "en"
  const sourceWords = payload.words ?? payload.timestamps ?? payload.segments ?? []
  const words = normalizeTranscriptWords(sourceWords, transcriptText)

  return {
    text: transcriptText,
    words,
    language_code: language,
  }
}

function normalizeTranscriptWords(raw: any[], fallbackText: string): TranscriptWord[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return approximateWords(fallbackText)
  }

  const mapped = raw
    .map((item) => {
      const text = (item.text ?? item.word ?? "").trim()
      if (!text) return null
      const start = typeof item.start === "number" ? item.start : typeof item.offset === "number" ? item.offset : 0
      const end = typeof item.end === "number" ? item.end : typeof item.offset === "number" ? item.offset + (item.duration ?? 0.3) : start + 0.3
      return {
        id: item.id ?? randomUUID(),
        text,
        start: Number(start),
        end: Number(end),
        confidence: typeof item.confidence === "number" ? item.confidence : undefined,
      } as TranscriptWord
    })
    .filter(Boolean) as TranscriptWord[]

  if (mapped.length === 0) {
    return approximateWords(fallbackText)
  }

  return mapped
}

export function buildWordsFromAlignment(alignment: AlignmentCharacter[] | undefined, fallbackText: string): TranscriptWord[] {
  if (!alignment || alignment.length === 0) {
    return approximateWords(fallbackText)
  }

  const words: TranscriptWord[] = []
  let current = ""
  let start = 0
  let end = 0

  for (const item of alignment) {
    const char = item.character

    if (!char || char.trim() === "" || /[\n\r]/.test(char)) {
      if (current.trim()) {
        const safeStart = Number(start.toFixed(3))
        const safeEnd = Number((end || start).toFixed(3))
        words.push({
          id: randomUUID(),
          text: current,
          start: safeStart,
          end: safeEnd,
        })
      }
      current = ""
      start = 0
      end = 0
      continue
    }

    if (!current) {
      start = item.start ?? start
    }

    current += char
    end = item.end ?? end
  }

  if (current.trim()) {
    const safeStart = Number(start.toFixed(3))
    const safeEnd = Number((end || start).toFixed(3))
    words.push({
      id: randomUUID(),
      text: current,
      start: safeStart,
      end: safeEnd,
    })
  }

  return words.length > 0 ? words : approximateWords(fallbackText)
}

function approximateWords(text: string): TranscriptWord[] {
  const sanitized = text.trim()
  if (!sanitized) return []

  const tokens = sanitized.split(/\s+/)
  const baseDuration = 0.35

  return tokens.map((token, index) => {
    const start = Number((index * baseDuration).toFixed(3))
    const end = Number((start + baseDuration).toFixed(3))
    return {
      id: randomUUID(),
      text: token,
      start,
      end,
    }
  })
}
