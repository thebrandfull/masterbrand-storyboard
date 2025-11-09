import { NextRequest, NextResponse } from "next/server"

const ALLOWED_HOSTS = new Set(["tempfile.aiquickdraw.com"])

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url")
  if (!targetUrl) {
    return NextResponse.json({ error: "url query parameter is required" }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 })
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https protocols are supported" }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "Host is not allowed for proxying" }, { status: 403 })
  }

  const upstreamHeaders: Record<string, string> = {}
  const range = request.headers.get("range")
  if (range) {
    upstreamHeaders.Range = range
  }

  const upstream = await fetch(parsed.toString(), {
    headers: upstreamHeaders,
    cache: "no-store",
  })

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      {
        error: `Failed to fetch upstream resource (${upstream.status})`,
      },
      { status: upstream.status }
    )
  }

  const headers = new Headers()
  const contentType = upstream.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)
  const contentLength = upstream.headers.get("content-length")
  if (contentLength) headers.set("Content-Length", contentLength)
  const acceptRanges = upstream.headers.get("accept-ranges")
  if (acceptRanges) headers.set("Accept-Ranges", acceptRanges)
  const contentRange = upstream.headers.get("content-range")
  if (contentRange) headers.set("Content-Range", contentRange)

  headers.set("Cache-Control", "private, max-age=86400, immutable")

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  })
}
