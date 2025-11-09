import { NextRequest, NextResponse } from "next/server"
import { getBrandBrainContext, getBrandInsights } from "@/lib/brand-brain"
import { generateBrandChatResponse, BrandChatMessage } from "@/lib/deepseek"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get("brandId")

  if (!brandId) {
    return NextResponse.json({ success: false, error: "brandId is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("brand_chat_messages")
    .select("id, role, content, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    console.error("Failed to load brand chat history:", error)
    return NextResponse.json(
      { success: false, error: "Unable to load chat history" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    messages: data || [],
  })
}

export async function POST(request: NextRequest) {
  try {
    const { brandId, prompt } = await request.json()

    if (!brandId || !prompt) {
      return NextResponse.json(
        { success: false, error: "brandId and prompt are required" },
        { status: 400 }
      )
    }

    const context = await getBrandBrainContext(brandId)
    if (!context.brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      )
    }

    const { data: storedHistory } = await supabase
      .from("brand_chat_messages")
      .select("role, content")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(8)

    const conversationHistory: BrandChatMessage[] = (storedHistory || [])
      .reverse()
      .map((msg) => ({
        role: msg.role as BrandChatMessage["role"],
        content: msg.content,
      }))

    const vectorInsights = await getBrandInsights(brandId, prompt, 6)

    const { response, fallback, error } = await generateBrandChatResponse({
      brandName: context.brand.name,
      contextSummary: context.summary,
      history: conversationHistory,
      prompt,
      vectorInsights,
    })

    const trimmedPrompt = prompt.trim()

    if (trimmedPrompt) {
      const inserts = [
        { brand_id: brandId, role: "user", content: trimmedPrompt },
        { brand_id: brandId, role: "assistant", content: response },
      ]

      const { error: insertError } = await supabase
        .from("brand_chat_messages")
        .insert(inserts)

      if (insertError) {
        console.error("Failed to persist chat messages:", insertError)
      }
    }

    return NextResponse.json({
      success: true,
      response,
      fallback,
      error,
      insights: vectorInsights,
    })
  } catch (error) {
    console.error("Brand chat error:", error)
    return NextResponse.json({ success: false, error: "Failed to chat with brand" }, { status: 500 })
  }
}
