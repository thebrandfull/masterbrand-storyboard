import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  SUPPORTED_PLATFORMS,
  generateAndStoreContent,
  isDeepSeekError,
  loadGenerationContext,
  type SupportedPlatform,
} from "@/lib/generation-runner"

export async function POST(request: NextRequest) {
  const db = supabase as SupabaseClient<Database>
  try {
    const body = await request.json()
    const { brandId, topic, platform, dateTarget } = body ?? {}
    const sanitizedTopic = typeof topic === "string" ? topic.trim() : ""
    const normalizedPlatform = (typeof platform === "string"
      ? platform.toLowerCase()
      : "") as SupportedPlatform

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

    const context = await loadGenerationContext(db, brandId)
    const { contentItem, generated } = await generateAndStoreContent({
      db,
      context,
      topic: sanitizedTopic,
      platform: normalizedPlatform,
      dateTarget,
    })

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
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error("[API /generate]", JSON.stringify(errorDetails))

    if (isDeepSeekError(error)) {
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
