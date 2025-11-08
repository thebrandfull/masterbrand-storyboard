import { NextResponse } from "next/server"
import { fetchVoices } from "@/lib/elevenlabs"

export const runtime = "nodejs"

export async function GET() {
  try {
    const voices = await fetchVoices()
    return NextResponse.json({ voices })
  } catch (error) {
    console.error("Failed to fetch ElevenLabs voices", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch voices" },
      { status: 500 }
    )
  }
}
