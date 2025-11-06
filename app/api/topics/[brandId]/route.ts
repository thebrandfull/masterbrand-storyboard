import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("brand_id", params.brandId)
      .order("weight", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, topics: data })
  } catch (error: any) {
    console.error("Error fetching topics:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
