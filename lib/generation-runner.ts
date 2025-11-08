import { DeepSeekError, generateContent } from "@/lib/deepseek"
import type { PromptGenerationRequest } from "@/lib/deepseek"
import type { Database } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

export const SUPPORTED_PLATFORMS = ["tiktok", "instagram", "youtube"] as const

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number]

type BrandRow = Database["public"]["Tables"]["brands"]["Row"]
type ContentItemInsert = Database["public"]["Tables"]["content_items"]["Insert"]
type ContentItemRow = Database["public"]["Tables"]["content_items"]["Row"]
type GenerationInsert = Database["public"]["Tables"]["generations"]["Insert"]

export interface GenerationContext {
  brand: BrandRow
  visualKeywords: string[]
  negativePrompts: string[]
}

export interface GenerateAndStoreContentParams {
  db: SupabaseClient<Database>
  context: GenerationContext
  topic: string
  platform: SupportedPlatform
  dateTarget: string
}

export interface GenerateAndStoreContentResult {
  contentItem: ContentItemRow
  generated: Awaited<ReturnType<typeof generateContent>>
  topic: string
}

export async function loadGenerationContext(
  db: SupabaseClient<Database>,
  brandId: string
): Promise<GenerationContext> {
  const { data: brand, error: brandError } = await db
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single()

  if (brandError || !brand) {
    throw new Error("Brand not found")
  }

  const brandRecord = brand as BrandRow

  return {
    brand: brandRecord,
    visualKeywords: parseVisualKeywords(brandRecord.visual_lexicon),
    negativePrompts: Array.isArray(brandRecord.negative_prompts)
      ? brandRecord.negative_prompts
      : [],
  }
}

export async function generateAndStoreContent({
  db,
  context,
  topic,
  platform,
  dateTarget,
}: GenerateAndStoreContentParams): Promise<GenerateAndStoreContentResult> {
  const sanitizedTopic = topic.trim()
  if (!sanitizedTopic) {
    throw new Error("Topic is required")
  }

  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw new Error("Unsupported platform")
  }

  const generated = await generateContent({
    brand: context.brand as PromptGenerationRequest["brand"],
    topic: sanitizedTopic,
    platform,
    visualKeywords: context.visualKeywords,
    negativePrompts: context.negativePrompts,
  })

  const contentInsert: ContentItemInsert = {
    brand_id: context.brand.id,
    date_target: dateTarget,
    platform,
    status: "prompted",
    notes: sanitizedTopic,
  }

  const contentItemsQuery = db.from("content_items") as any
  const { data: contentItem, error: contentError } = await contentItemsQuery
    .insert(contentInsert)
    .select()
    .single()

  if (contentError || !contentItem) {
    throw new Error(
      `Failed to create content item: ${contentError?.message || "Unknown error"}`
    )
  }

  const contentRecord = contentItem as ContentItemRow

  const generationsToInsert: GenerationInsert[] = generated.prompts.map(
    (prompt, index) => ({
      content_item_id: contentRecord.id,
      prompt_text: prompt,
      title: index === 0 ? generated.title : `${generated.title} (v${index + 1})`,
      description: generated.description,
      tags: generated.tags,
      thumbnail_brief: generated.thumbnailBrief,
      model_params: { platform, topic: sanitizedTopic },
    })
  )

  const generationsQuery = db.from("generations") as any
  const { error: generationError } = await generationsQuery.insert(generationsToInsert)

  if (generationError) {
    await db.from("content_items").delete().eq("id", contentRecord.id)
    throw new Error(`Failed to store generated content: ${generationError.message}`)
  }

  return {
    contentItem: contentRecord,
    generated,
    topic: sanitizedTopic,
  }
}

export function isDeepSeekError(error: unknown): error is DeepSeekError {
  return error instanceof DeepSeekError
}

function parseVisualKeywords(value: string | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}
