import { NextRequest, NextResponse } from "next/server"
import { formatISO, addDays, isValid } from "date-fns"
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

type TopicRow = Database["public"]["Tables"]["topics"]["Row"]

interface BulkGenerationRequestBody {
  brandId?: string
  days?: number
  platform?: string
  startDate?: string
}

export async function POST(request: NextRequest) {
  const db = supabase as SupabaseClient<Database>

  try {
    const body = (await request.json()) as BulkGenerationRequestBody | null
    const brandId = typeof body?.brandId === "string" ? body.brandId : ""
    const normalizedPlatform = (typeof body?.platform === "string"
      ? body.platform.toLowerCase()
      : "") as SupportedPlatform
    const totalDays = Number.isFinite(body?.days) ? Number(body?.days) : 0
    const startDate = parseStartDate(body?.startDate)

    if (!brandId || !SUPPORTED_PLATFORMS.includes(normalizedPlatform)) {
      return NextResponse.json(
        { success: false, error: "Brand and supported platform are required." },
        { status: 400 }
      )
    }

    if (totalDays <= 0 || totalDays > 31) {
      return NextResponse.json(
        { success: false, error: "Days must be between 1 and 31." },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { success: false, error: "A valid start date is required." },
        { status: 400 }
      )
    }

    const context = await loadGenerationContext(db, brandId)
    const topics = await fetchTopics(db, brandId)

    if (topics.length === 0) {
      return NextResponse.json(
        { success: false, error: "No topics configured for this brand." },
        { status: 400 }
      )
    }

    const results: Array<{
      date: string
      topic: string
      platform: SupportedPlatform
      status: "success" | "failed"
      error?: string
    }> = []

    for (let index = 0; index < totalDays; index += 1) {
      const scheduledDate = addDays(startDate, index)
      const topic = selectTopicByWeight(topics)

      try {
        await generateAndStoreContent({
          db,
          context,
          topic: topic.label,
          platform: normalizedPlatform,
          dateTarget: formatISO(scheduledDate, { representation: "date" }),
        })

        results.push({
          date: formatISO(scheduledDate, { representation: "date" }),
          topic: topic.label,
          platform: normalizedPlatform,
          status: "success",
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        results.push({
          date: formatISO(scheduledDate, { representation: "date" }),
          topic: topic.label,
          platform: normalizedPlatform,
          status: "failed",
          error: message,
        })
      }
    }

    const successCount = results.filter((item) => item.status === "success").length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        requested: totalDays,
        successes: successCount,
        failures: results.length - successCount,
      },
    })
  } catch (error) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error("[API /bulk]", JSON.stringify(errorDetails))

    if (isDeepSeekError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status ?? 500 }
      )
    }

    const message = error instanceof Error ? error.message : "Failed to run bulk generation"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

async function fetchTopics(db: SupabaseClient<Database>, brandId: string): Promise<TopicRow[]> {
  const { data, error } = await db
    .from("topics")
    .select("*")
    .eq("brand_id", brandId)
    .order("weight", { ascending: false })

  if (error) {
    throw new Error(`Failed to load topics: ${error.message}`)
  }

  return (data as TopicRow[] | null) ?? []
}

function selectTopicByWeight(topics: TopicRow[]): TopicRow {
  const weights = topics.map((topic) => Math.max(topic.weight || 0, 0))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  if (totalWeight <= 0) {
    return topics[0]
  }

  let cursor = Math.random() * totalWeight

  for (let index = 0; index < topics.length; index += 1) {
    cursor -= weights[index]
    if (cursor <= 0) {
      return topics[index]
    }
  }

  return topics[topics.length - 1]
}

function parseStartDate(raw: string | undefined): Date | null {
  if (!raw) {
    return new Date()
  }

  const candidate = new Date(raw)
  return isValid(candidate) ? candidate : null
}
