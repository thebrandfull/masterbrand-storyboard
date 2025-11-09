import { NextResponse } from "next/server"
import { DeepSeekError, generateScriptUpgrade } from "@/lib/deepseek"
import type { ScriptUpgradeRequest } from "@/types/youtube"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ScriptUpgradeRequest>
    if (!body?.transcriptText || !body.videoTitle) {
      return NextResponse.json(
        { error: "Transcript text and video title are required." },
        { status: 400 },
      )
    }

    const payload: ScriptUpgradeRequest = {
      transcriptText: body.transcriptText,
      videoTitle: body.videoTitle,
      durationSeconds: body.durationSeconds,
      channelName: body.channelName,
      goal: body.goal,
      issues: body.issues,
      audience: body.audience,
      tone: body.tone,
      callToAction: body.callToAction,
    }

    const result = await generateScriptUpgrade(payload)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof DeepSeekError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Script refinement failed", error)
    return NextResponse.json(
      { error: "Failed to generate the upgraded script." },
      { status: 500 },
    )
  }
}
