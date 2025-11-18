import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandId, durationMinutes, startedAt, endedAt } = body ?? {}

    const normalizedDuration = Number(durationMinutes)
    if (!normalizedDuration || normalizedDuration <= 0) {
      return NextResponse.json({ error: "Duration must be greater than zero." }, { status: 400 })
    }

    const insertPayload = {
      brand_id: typeof brandId === "string" ? brandId : null,
      duration_minutes: Math.round(normalizedDuration),
      started_at: startedAt ?? new Date().toISOString(),
      ended_at: endedAt ?? new Date().toISOString(),
    }

    const { error } = await supabase.from("focus_sessions").insert(insertPayload)
    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log focus session."
    console.error("[API focus-sessions][POST]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")

    let query = supabase.from("focus_sessions").select("duration_minutes, started_at").order("started_at", { ascending: false })
    if (brandId) {
      query = query.eq("brand_id", brandId)
    }

    const { data, error } = await query
    if (error) {
      throw new Error(error.message)
    }

    const totalMinutes = (data || []).reduce((sum, session) => sum + (session.duration_minutes || 0), 0)

    return NextResponse.json({
      success: true,
      sessions: data ?? [],
      totalMinutes,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch focus sessions."
    console.error("[API focus-sessions][GET]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
