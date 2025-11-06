import { NextRequest, NextResponse } from "next/server"
import { DeepSeekError, generateContent } from "@/lib/deepseek"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"
import type { PromptGenerationRequest } from "@/lib/deepseek"

const SUPPORTED_PLATFORMS = ["tiktok", "instagram", "youtube"]

export async function POST(request: NextRequest) {
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
    const { data, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single()

    if (brandError || !data) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    const brand = data as Database["public"]["Tables"]["brands"]["Row"]
    const visualKeywords = parseVisualKeywords(brand.visual_lexicon)
    const negativePrompts = Array.isArray(brand.negative_prompts) ? brand.negative_prompts : []

    const generated = await generateContent({
      brand: brand as PromptGenerationRequest["brand"],
      topic: sanitizedTopic,
      platform: normalizedPlatform,
      visualKeywords,
      negativePrompts,
    })

    // Create content item
    const contentInsert: Database["public"]["Tables"]["content_items"]["Insert"] = {
      brand_id: brandId,
      date_target: dateTarget,
      platform: normalizedPlatform,
      status: "prompted",
      notes: sanitizedTopic,
    }

    // Type workaround for Supabase insert type inference issue
    const contentResult = await (supabase.from("content_items") as any)
      .insert(contentInsert)
      .select()
      .single()

    if (contentResult.error || !contentResult.data) {
      return NextResponse.json(
        { error: `Failed to create content item: ${contentResult.error?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const contentItem = contentResult.data as Database["public"]["Tables"]["content_items"]["Row"]

    // Store generations
    const generationInserts: Database["public"]["Tables"]["generations"]["Insert"][] = generated.prompts.map((prompt, index) => ({
      content_item_id: contentItem.id,
      prompt_text: prompt,
      title: index === 0 ? generated.title : `${generated.title} (v${index + 1})`,
      description: generated.description,
      tags: generated.tags,
      thumbnail_brief: generated.thumbnailBrief,
      model_params: { platform: normalizedPlatform, topic: sanitizedTopic },
    }))

    // Type workaround for Supabase insert type inference issue
    const genResult = await (supabase.from("generations") as any)
      .insert(generationInserts)

    if (genResult.error) {
      // Rollback: delete the content item if generations fail
      await supabase.from("content_items").delete().eq("id", contentItem.id)
      return NextResponse.json(
        { error: `Failed to store generated content: ${genResult.error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contentItem,
      generated,
      topic: sanitizedTopic,
    })
  } catch (error) {
    // Log error with context for debugging
    const errorDetails = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
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
