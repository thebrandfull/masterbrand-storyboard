import { NextRequest, NextResponse } from "next/server"
import { DeepSeekError, generateContent } from "@/lib/deepseek"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"
import type { PromptGenerationRequest } from "@/lib/deepseek"
import type { SupabaseClient } from "@supabase/supabase-js"

const SUPPORTED_PLATFORMS = ["tiktok", "instagram", "youtube"]

export async function POST(request: NextRequest) {
  const db = supabase as SupabaseClient<Database>
  try {
    const body = await request.json()
    const { brandId, topic, platform, dateTarget } = body ?? {}
    const sanitizedTopic = typeof topic === "string" ? topic.trim() : ""
    const normalizedPlatform = typeof platform === "string" ? platform.toLowerCase() : ""

    if (!brandId || !sanitizedTopic || !SUPPORTED_PLATFORMS.includes(normalizedPlatform)) {
      return NextResponse.json(
        { error: "Brand, topic, and supported platform are required." },
        { status: 400 }
      )
    }

    if (!dateTarget || Number.isNaN(new Date(dateTarget).getTime())) {
      return NextResponse.json(
        { error: "A valid target date is required." },
        { status: 400 }
      )
    }

    // Fetch brand data
    const { data: brand, error: brandError } = await db
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    const brandRecord = brand as Database["public"]["Tables"]["brands"]["Row"]
    const visualKeywords = parseVisualKeywords(brandRecord.visual_lexicon)
    const negativePrompts = Array.isArray(brandRecord.negative_prompts)
      ? brandRecord.negative_prompts
      : []

    const generated = await generateContent({
      brand: brandRecord as PromptGenerationRequest["brand"],
      topic: sanitizedTopic,
      platform: normalizedPlatform,
      visualKeywords,
      negativePrompts,
    })

    // Create content item
    const newContentItem: Database["public"]["Tables"]["content_items"]["Insert"] = {
      brand_id: brandId,
      date_target: dateTarget,
      platform: normalizedPlatform,
      status: "prompted",
      notes: sanitizedTopic,
    }

    const contentItemsQuery = db.from("content_items") as any
    const { data: contentItem, error: contentError } = await contentItemsQuery
      .insert(newContentItem)
      .select()
      .single()

    if (contentError || !contentItem) {
      return NextResponse.json(
        { error: `Failed to create content item: ${contentError?.message || "Unknown error"}` },
        { status: 500 }
      )
    }

    const contentRecord = contentItem as Database["public"]["Tables"]["content_items"]["Row"]

    // Store generations
    const generationInserts: Database["public"]["Tables"]["generations"]["Insert"][] = generated.prompts.map((prompt, index) => ({
      content_item_id: contentRecord.id,
      prompt_text: prompt,
      title: index === 0 ? generated.title : `${generated.title} (v${index + 1})`,
      description: generated.description,
      tags: generated.tags,
      thumbnail_brief: generated.thumbnailBrief,
      model_params: { platform: normalizedPlatform, topic: sanitizedTopic },
    }))

    const generationsQuery = db.from("generations") as any
    const { error: genError } = await generationsQuery.insert(generationInserts)

    if (genError) {
      // Rollback: delete the content item if generations fail
      await db.from("content_items").delete().eq("id", contentRecord.id)
      return NextResponse.json(
        { error: `Failed to store generated content: ${genError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contentItem: contentRecord,
      generated,
      topic: sanitizedTopic,
    })
  } catch (error) {
    // Log error with context for debugging
    const errorDetails = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error("[API /generate]", JSON.stringify(errorDetails))

    if (error instanceof DeepSeekError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status ?? 500 }
      )
    }

    const message = error instanceof Error ? error.message : "Failed to generate content"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

function parseVisualKeywords(value: string | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}
