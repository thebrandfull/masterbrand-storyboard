import { NextRequest, NextResponse } from "next/server"
import { createSoraTask, type CreateSoraTaskInput } from "@/lib/kie"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio, nFrames, removeWatermark, callBackUrl } = body as CreateSoraTaskInput

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      )
    }

    const taskId = await createSoraTask({
      prompt: prompt.trim(),
      aspectRatio,
      nFrames,
      removeWatermark,
      callBackUrl,
    })

    return NextResponse.json({
      success: true,
      taskId,
    })
  } catch (error) {
    console.error("Error creating Sora task:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create Sora video task",
      },
      { status: 500 }
    )
  }
}
