import { NextRequest, NextResponse } from "next/server"
import { generateCaptions, formatAsSRT, formatAsVTT, formatAsJSON, generateWordCaptions } from "@/lib/caption-generator"
import type { AlignmentCharacter } from "@/lib/elevenlabs"

interface CaptionRequest {
  alignment: AlignmentCharacter[]
  format?: "srt" | "vtt" | "json" | "word-by-word"
  maxWordsPerCaption?: number
  maxCharsPerCaption?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CaptionRequest
    const { alignment, format = "vtt", maxWordsPerCaption, maxCharsPerCaption } = body

    if (!alignment || !Array.isArray(alignment) || alignment.length === 0) {
      return NextResponse.json(
        { error: "Alignment data is required and must be a non-empty array" },
        { status: 400 }
      )
    }

    // Generate captions based on format
    let captions
    let formattedOutput

    if (format === "word-by-word") {
      captions = generateWordCaptions(alignment)
      formattedOutput = formatAsJSON(captions)
    } else {
      captions = generateCaptions(alignment, {
        maxWordsPerCaption,
        maxCharsPerCaption,
      })

      switch (format) {
        case "srt":
          formattedOutput = formatAsSRT(captions)
          break
        case "json":
          formattedOutput = formatAsJSON(captions)
          break
        case "vtt":
        default:
          formattedOutput = formatAsVTT(captions)
      }
    }

    return NextResponse.json({
      success: true,
      captions,
      formatted: formattedOutput,
      count: captions.length,
    })
  } catch (error) {
    console.error("Error generating captions:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate captions",
      },
      { status: 500 }
    )
  }
}
