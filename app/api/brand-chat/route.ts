import { NextRequest, NextResponse } from "next/server"
import { getBrandBrainContext, getBrandInsights } from "@/lib/brand-brain"
import { generateBrandChatResponse, BrandChatMessage } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const { brandId, history = [], prompt } = await request.json()

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

    const conversationHistory: BrandChatMessage[] = Array.isArray(history)
      ? history.slice(-5).map((msg: BrandChatMessage) => ({
          role: msg.role,
          content: msg.content,
        }))
      : []

    const vectorInsights = await getBrandInsights(brandId, prompt, 6)

    const { response, fallback, error } = await generateBrandChatResponse({
      brandName: context.brand.name,
      contextSummary: context.summary,
      history: conversationHistory,
      prompt,
      vectorInsights,
    })

    return NextResponse.json({ success: true, response, fallback, error, insights: vectorInsights })
  } catch (error) {
    console.error("Brand chat error:", error)
    return NextResponse.json({ success: false, error: "Failed to chat with brand" }, { status: 500 })
  }
}
