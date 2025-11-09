import { NextResponse } from "next/server"
import { generateSpeech, buildWordsFromAlignment } from "@/lib/elevenlabs"

export const runtime = "nodejs"

type RequestPayload = {
  text: string
  voiceId: string
  modelId?: string
  voiceSettings?: {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestPayload

    if (!body.text || !body.voiceId) {
      return NextResponse.json({ error: "text and voiceId are required" }, { status: 400 })
    }

    const result = await generateSpeech(body)
    const words = buildWordsFromAlignment(result.alignment, body.text)

    return NextResponse.json({
      audioBase64: result.audioBase64,
      words,
      modelId: result.model_id,
    })
  } catch (error) {
    console.error("Failed to generate speech", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate speech" },
      { status: 500 }
    )
  }
}
