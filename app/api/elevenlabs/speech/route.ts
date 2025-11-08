import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { generateSpeech } from "@/lib/elevenlabs"
import type { AlignmentCharacter } from "@/lib/elevenlabs"
import type { CaptionWord } from "@/types/captions"

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

function buildWordsFromAlignment(alignment: AlignmentCharacter[] | undefined, fallbackText: string): CaptionWord[] {
  if (!alignment || alignment.length === 0) {
    return approximateWords(fallbackText)
  }

  const words: CaptionWord[] = []
  let current = ""
  let start = 0
  let end = 0

  for (const item of alignment) {
    const char = item.character

    if (!char || char.trim() === "" || /[\n\r]/.test(char)) {
      if (current.trim()) {
        words.push({
          id: randomUUID(),
          text: current,
          start: Number((start ?? 0).toFixed(3)),
          end: Number((end ?? start ?? 0).toFixed(3)),
        })
      }
      current = ""
      start = 0
      end = 0
      continue
    }

    if (!current) {
      start = item.start ?? start
    }

    current += char
    end = item.end ?? end
  }

  if (current.trim()) {
    words.push({
      id: randomUUID(),
      text: current,
      start: Number((start ?? 0).toFixed(3)),
      end: Number((end ?? start ?? 0).toFixed(3)),
    })
  }

  if (words.length === 0) {
    return approximateWords(fallbackText)
  }

  return words
}

function approximateWords(text: string): CaptionWord[] {
  const sanitized = text.trim()
  if (!sanitized) return []

  const tokens = sanitized.split(/\s+/)
  const baseDuration = 0.38

  return tokens.map((token, index) => {
    const start = Number((index * baseDuration).toFixed(3))
    const end = Number((start + baseDuration).toFixed(3))
    return {
      id: randomUUID(),
      text: token,
      start,
      end,
    }
  })
}
