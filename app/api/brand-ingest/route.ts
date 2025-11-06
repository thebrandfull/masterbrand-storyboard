import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ingestBrandProfile } from "@/lib/brand-brain-ingest"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { brandId } = await request.json()
    const { data: brand, error } = await supabase.from("brands").select("*").eq("id", brandId).single()

    if (error || !brand) {
      return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 })
    }

    await ingestBrandProfile(brand)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Brand ingest error", error)
    return NextResponse.json({ success: false, error: "Failed to ingest brand" }, { status: 500 })
  }
}
