import { NextResponse } from "next/server"
import { fetchYoutubeTranscript, YoutubeTranscriptError } from "@/lib/youtube-transcript"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; language?: string }
    if (!body?.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "A valid YouTube URL or ID is required." }, { status: 400 })
    }

    const transcript = await fetchYoutubeTranscript(body.url, body.language)
    return NextResponse.json(transcript)
  } catch (error) {
    if (error instanceof YoutubeTranscriptError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Transcript fetch failed", error)
    return NextResponse.json({ error: "Failed to fetch the YouTube transcript." }, { status: 500 })
  }
}
