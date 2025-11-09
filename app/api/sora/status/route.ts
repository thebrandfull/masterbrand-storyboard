import { NextRequest, NextResponse } from "next/server"
import { queryTaskStatus, parseResultUrls } from "@/lib/kie"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId parameter is required" },
        { status: 400 }
      )
    }

    const status = await queryTaskStatus(taskId)
    const resultUrls = status.resultJson ? parseResultUrls(status.resultJson) : null

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        parsedResults: resultUrls,
      },
    })
  } catch (error) {
    console.error("Error querying Sora task status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to query task status",
      },
      { status: 500 }
    )
  }
}
