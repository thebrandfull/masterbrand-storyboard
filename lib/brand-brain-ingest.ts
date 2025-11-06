import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"
import { generateEmbedding } from "./embeddings"
import { supabase as publicClient } from "./supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const adminClient =
  serviceKey && supabaseUrl ? createClient<Database>(supabaseUrl, serviceKey) : publicClient

type BrandRow = Database["public"]["Tables"]["brands"]["Row"]
type TopicRecord = Database["public"]["Tables"]["topics"]["Row"]

type TopicInput = {
  label: string
  weight?: number | null
  minFrequency?: number | null
  maxFrequency?: number | null
  min_frequency?: number | null
  max_frequency?: number | null
  examples?: string[] | null
}

type TopicLike = TopicRecord | TopicInput

export type IngestableBrand = Pick<
  BrandRow,
  | "id"
  | "name"
  | "mission"
  | "voice_tone"
  | "target_audience"
  | "visual_lexicon"
  | "dos"
  | "donts"
  | "proof_points"
  | "cta_library"
  | "negative_prompts"
>

interface BrandVectorPayload {
  brand_id: string
  type: string
  source_key: string
  content: string
  metadata?: Record<string, unknown> | null
}

const TOPIC_SOURCE_PREFIX = "topic::"

async function upsertBrandVector(payload: BrandVectorPayload) {
  const { brand_id, type, source_key, content, metadata } = payload
  const embedding = await generateEmbedding(content)

  // Type workaround for Supabase upsert type inference issue
  await (adminClient.from("brand_vectors") as any).upsert(
    {
      brand_id,
      type,
      source_key,
      content,
      metadata: metadata ?? null,
      embedding,
    },
    { onConflict: "brand_id,source_key" }
  )
}

async function pruneTopicVectors(brandId: string, keepKeys: string[]) {
  try {
    const query = adminClient
      .from("brand_vectors")
      .delete()
      .eq("brand_id", brandId)
      .like("source_key", `${TOPIC_SOURCE_PREFIX}%`)

    if (keepKeys.length > 0) {
      const filterList = `(${keepKeys.map((key) => `"${key}"`).join(",")})`
      query.not("source_key", "in", filterList)
    }

    await query
  } catch (error) {
    console.warn("Failed to prune topic vectors", error)
  }
}

interface NormalizedTopic {
  label: string
  weight: number | null
  minFrequency: number | null
  maxFrequency: number | null
  examples: string[] | null
}

function normalizeTopic(topic: TopicLike): NormalizedTopic {
  let minFrequency: number | null = null
  if ("minFrequency" in topic && topic.minFrequency !== undefined) {
    minFrequency = topic.minFrequency ?? null
  } else if ("min_frequency" in topic && topic.min_frequency !== undefined) {
    minFrequency = topic.min_frequency ?? null
  }

  let maxFrequency: number | null = null
  if ("maxFrequency" in topic && topic.maxFrequency !== undefined) {
    maxFrequency = topic.maxFrequency ?? null
  } else if ("max_frequency" in topic && topic.max_frequency !== undefined) {
    maxFrequency = topic.max_frequency ?? null
  }

  return {
    label: (topic.label || "").trim(),
    weight: typeof topic.weight === "number" ? topic.weight : topic.weight ?? null,
    minFrequency,
    maxFrequency,
    examples: topic.examples ?? null,
  }
}

function sanitizeSourceKey(input: string, fallback: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized || fallback
}

export async function ingestBrandProfile(brand: IngestableBrand, topics: TopicLike[] = []) {
  if (!brand?.id) return

  const positioningParts = [
    `Brand: ${brand.name}`,
    brand.mission ? `Mission: ${brand.mission}` : null,
    brand.voice_tone ? `Voice: ${brand.voice_tone}` : null,
    brand.target_audience ? `Audience: ${brand.target_audience}` : null,
    brand.visual_lexicon ? `Visuals: ${brand.visual_lexicon}` : null,
  ].filter(Boolean)

  const guardrailParts = [
    brand.dos && brand.dos.length ? `Do:\n- ${brand.dos.join("\n- ")}` : null,
    brand.donts && brand.donts.length ? `Don't:\n- ${brand.donts.join("\n- ")}` : null,
    brand.negative_prompts && brand.negative_prompts.length
      ? `Avoid visuals:\n- ${brand.negative_prompts.join("\n- ")}`
      : null,
  ].filter(Boolean)

  const proofParts = [
    brand.proof_points && brand.proof_points.length
      ? `Proof points:\n- ${brand.proof_points.join("\n- ")}`
      : null,
    brand.cta_library && brand.cta_library.length ? `CTAs:\n- ${brand.cta_library.join("\n- ")}` : null,
  ].filter(Boolean)

  const entries: BrandVectorPayload[] = []

  if (positioningParts.length) {
    entries.push({
      brand_id: brand.id,
      type: "positioning",
      source_key: "profile::positioning",
      content: positioningParts.join("\n"),
      metadata: { name: brand.name },
    })
  }

  if (guardrailParts.length) {
    entries.push({
      brand_id: brand.id,
      type: "guardrails",
      source_key: "profile::guardrails",
      content: guardrailParts.join("\n\n"),
      metadata: { name: brand.name },
    })
  }

  if (proofParts.length) {
    entries.push({
      brand_id: brand.id,
      type: "social-proof",
      source_key: "profile::proof",
      content: proofParts.join("\n\n"),
      metadata: { name: brand.name },
    })
  }

  const normalizedTopics = topics
    .map(normalizeTopic)
    .filter((topic) => Boolean(topic.label))

  const topicKeys: string[] = []
  normalizedTopics.forEach((topic, index) => {
    const slug = sanitizeSourceKey(topic.label || "", `topic-${index}`)
    const source_key = `${TOPIC_SOURCE_PREFIX}${slug}`
    topicKeys.push(source_key)

    const parts = [
      `Topic: ${topic.label}`,
      topic.weight ? `Weight: ${topic.weight}` : null,
      topic.minFrequency ? `Min frequency: ${topic.minFrequency}` : null,
      topic.maxFrequency ? `Max frequency: ${topic.maxFrequency}` : null,
      topic.examples && topic.examples.length
        ? `Examples:\n- ${topic.examples.join("\n- ")}`
        : null,
    ].filter(Boolean)

    entries.push({
      brand_id: brand.id,
      type: "topic",
      source_key,
      content: parts.join("\n"),
      metadata: {
        label: topic.label,
        weight: topic.weight,
        minFrequency: topic.minFrequency,
        maxFrequency: topic.maxFrequency,
      },
    })
  })

  await pruneTopicVectors(brand.id, topicKeys)

  for (const entry of entries) {
    await upsertBrandVector(entry)
  }
}
