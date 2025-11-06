import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { generateEmbedding } from "@/lib/embeddings"
import { searchBrandVectors } from "@/lib/brand-brain-retrieval"
import type { BrandVectorMatch } from "@/lib/brand-brain-retrieval"
import type { Database } from "@/types/database"

export interface BrandVectorInsight {
  id: string
  type: string
  source_key: string
  content: string
  metadata: Record<string, unknown> | null
  similarity?: number
}

export async function getBrandInsights(brandId: string, text: string, limit = 5): Promise<BrandVectorInsight[]> {
  if (!text?.trim()) return []
  try {
    const embedding = await generateEmbedding(text)
    const vectorResults = await searchBrandVectors({ brandId, queryEmbedding: embedding, limit })
    return vectorResults.map((result: BrandVectorMatch) => ({
      id: result.id,
      type: result.type,
      source_key: result.source_key,
      content: result.content,
      metadata: (result.metadata as Record<string, unknown> | null) ?? null,
      similarity: result.similarity,
    }))
  } catch (error) {
    console.warn("Brand insights lookup failed", error)
    return []
  }
}

type TopicRow = Database["public"]["Tables"]["topics"]["Row"]
type ContentSummary = Pick<
  Database["public"]["Tables"]["content_items"]["Row"],
  "id" | "platform" | "status" | "date_target" | "notes" | "blocker_reason" | "files"
>

interface RawBrand {
  id: string
  name: string
  mission: string | null
  voice_tone: string | null
  target_audience: string | null
  visual_lexicon: string | null
  dos: string[] | null
  donts: string[] | null
  proof_points: string[] | null
  cta_library: string[] | null
  negative_prompts: string[] | null
  platform_constraints: Record<string, unknown> | null
}

export interface BrandBrainContext {
  brand: RawBrand | null
  topics: TopicRow[]
  recentContent: ContentSummary[]
  summary: string
  vectors: BrandVectorInsight[]
}

function stringifyList(label: string, values?: string[] | null) {
  if (!values || values.length === 0) return ""
  return `${label}: ${values.join(", ")}`
}

export async function getBrandBrainContext(brandId: string): Promise<BrandBrainContext> {
  const [brandResult, topicsResult, contentResult] = await Promise.all([
    supabase.from("brands").select("*").eq("id", brandId).single(),
    supabase
      .from("topics")
      .select("*")
      .eq("brand_id", brandId)
      .order("weight", { ascending: false })
      .limit(20),
    supabase
      .from("content_items")
      .select("id, platform, status, date_target, notes, blocker_reason, files")
      .eq("brand_id", brandId)
      .order("date_target", { ascending: false })
      .limit(10),
  ])

  const brand = brandResult.data as any
  const topics = topicsResult.data as any
  const recentContent = contentResult.data as any

  const summaryPieces: string[] = []
  if (brand) {
    summaryPieces.push(`Brand name: ${brand.name}`)
    if (brand.mission) summaryPieces.push(`Mission: ${brand.mission}`)
    if (brand.voice_tone) summaryPieces.push(`Voice: ${brand.voice_tone}`)
    if (brand.target_audience) summaryPieces.push(`Audience: ${brand.target_audience}`)
    if (brand.visual_lexicon) summaryPieces.push(`Visual lexicon: ${brand.visual_lexicon}`)
    summaryPieces.push(stringifyList("Do", brand.dos))
    summaryPieces.push(stringifyList("Don't", brand.donts))
    summaryPieces.push(stringifyList("Proof points", brand.proof_points))
    summaryPieces.push(stringifyList("CTA library", brand.cta_library))
  }

  if (topics && topics.length > 0) {
    const topTopics = topics.slice(0, 5).map((topic: any) => `${topic.label} (weight ${topic.weight})`).join("; ")
    summaryPieces.push(`Top topics: ${topTopics}`)
  }

  if (recentContent && recentContent.length > 0) {
    const items = recentContent
      .slice(0, 3)
      .map((item: any) => `${formatDate(item.date_target)} • ${item.platform} • ${item.status}`)
      .join(" | ")
    summaryPieces.push(`Recent content: ${items}`)
  }

  const summary = summaryPieces.filter(Boolean).join("\n")

  return {
    brand: brand as RawBrand,
    topics: (topics as TopicRow[] | null) || [],
    recentContent: (recentContent as ContentSummary[] | null) || [],
    summary,
    vectors: [],
  }
}
