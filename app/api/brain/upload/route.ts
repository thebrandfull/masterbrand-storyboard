import { NextRequest, NextResponse } from "next/server"
import { getBrandBrainContext, getBrandInsights } from "@/lib/brand-brain"
import { generateBrandChatResponse } from "@/lib/deepseek"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { brandId, files } = await request.json()
    if (!brandId || !files) {
      return NextResponse.json({ success: false, error: "Missing brandId or files" }, { status: 400 })
    }

    const context = await getBrandBrainContext(brandId)
    const summary = context.summary
    const insights = await getBrandInsights(brandId, summary, 5)

    const prompt = `Review these files and summarize next steps: ${JSON.stringify(files).slice(0, 2000)}`
    const { response } = await generateBrandChatResponse({
      brandName: context.brand?.name || "Brand",
      contextSummary: `${summary}\n(Uploaded files processed)`,
      history: [],
      prompt,
      vectorInsights: insights,
    })

    return NextResponse.json({ success: true, summary: response })
  } catch (error) {
    console.error("Brain upload error", error)
    return NextResponse.json({ success: false, error: "Failed to process files" }, { status: 500 })
  }
}
