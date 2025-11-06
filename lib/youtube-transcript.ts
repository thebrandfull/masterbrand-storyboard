import type { TranscriptLanguage, TranscriptPayload, TranscriptSegment } from "@/types/youtube"

const YT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)"
const YT_ID_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/i

export class YoutubeTranscriptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "YoutubeTranscriptError"
  }
}

export async function fetchYoutubeTranscript(
  input: string,
  preferredLanguage?: string
): Promise<TranscriptPayload> {
  const videoId = extractVideoId(input)
  const watchResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: buildHeaders(preferredLanguage),
    redirect: "follow",
  })

  if (!watchResponse.ok) {
    throw new YoutubeTranscriptError("Unable to load the YouTube watch page.")
  }

  const watchHtml = await watchResponse.text()
  const playerResponse = parsePlayerResponse(watchHtml)
  const captionSource = playerResponse?.captions?.playerCaptionsTracklistRenderer

  if (!captionSource?.captionTracks?.length) {
    throw new YoutubeTranscriptError("No transcripts are available for this video.")
  }

  const languages: TranscriptLanguage[] = captionSource.captionTracks.map((track: CaptionTrack) => ({
    languageCode: track.languageCode,
    name: track.name?.simpleText || track.languageCode,
    kind: track.kind,
  }))

  const selectedTrack =
    (preferredLanguage &&
      captionSource.captionTracks.find((track: CaptionTrack) => track.languageCode === preferredLanguage)) ||
    captionSource.captionTracks[0]

  if (!selectedTrack?.baseUrl) {
    throw new YoutubeTranscriptError("No transcript source was found for this language.")
  }

  const transcriptResponse = await fetch(`${selectedTrack.baseUrl}&fmt=vtt`, {
    headers: buildHeaders(preferredLanguage ?? selectedTrack.languageCode),
  })

  if (!transcriptResponse.ok) {
    throw new YoutubeTranscriptError("Failed to download the transcript from YouTube.")
  }

  const transcriptBody = await transcriptResponse.text()
  const segments = parseTranscript(transcriptBody)

  if (!segments.length) {
    throw new YoutubeTranscriptError("The transcript is empty or could not be parsed.")
  }

  const videoDetails = playerResponse.videoDetails ?? {}
  const thumbnail =
    videoDetails.thumbnail?.thumbnails?.[videoDetails.thumbnail?.thumbnails?.length - 1]?.url

  return {
    videoId,
    title: videoDetails.title ?? "Untitled video",
    channelName: videoDetails.author ?? "Unknown creator",
    description: videoDetails.shortDescription,
    durationSeconds: Number(videoDetails.lengthSeconds ?? 0),
    thumbnailUrl: thumbnail,
    languageCode: selectedTrack.languageCode ?? captionSource.captionTracks[0].languageCode,
    languages,
    segments,
  }
}

type CaptionTrack = {
  baseUrl: string
  languageCode: string
  name?: { simpleText?: string }
  kind?: string
}

function extractVideoId(input: string): string {
  const value = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value
  }

  try {
    const asUrl = new URL(value)
    if (asUrl.hostname.includes("youtu.be")) {
      return asUrl.pathname.replace(/\//g, "").slice(0, 11)
    }
    if (asUrl.searchParams.get("v")) {
      return asUrl.searchParams.get("v")!.slice(0, 11)
    }
  } catch {
    // ignore parsing failure
  }

  const regexMatch = value.match(YT_ID_REGEX)
  if (regexMatch && regexMatch[1]) {
    return regexMatch[1]
  }

  throw new YoutubeTranscriptError("Could not figure out the YouTube video ID from the input.")
}

function parsePlayerResponse(html: string) {
  const marker = "ytInitialPlayerResponse = "
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) {
    throw new YoutubeTranscriptError("The YouTube player payload was not found.")
  }

  const jsonStart = html.indexOf("{", markerIndex)
  if (jsonStart === -1) {
    throw new YoutubeTranscriptError("The YouTube player payload is malformed.")
  }

  let depth = 0
  let inString = false
  let prev = ""

  for (let index = jsonStart; index < html.length; index++) {
    const char = html[index]

    if (char === '"' && prev !== "\\") {
      inString = !inString
    }

    if (!inString) {
      if (char === "{") {
        depth += 1
      } else if (char === "}") {
        depth -= 1
        if (depth === 0) {
          const json = html.slice(jsonStart, index + 1)
          try {
            return JSON.parse(json)
          } catch {
            throw new YoutubeTranscriptError("Failed to parse the YouTube player payload.")
          }
        }
      }
    }

    prev = char
  }

  throw new YoutubeTranscriptError("The YouTube player payload was truncated.")
}

function parseTranscript(xml: string): TranscriptSegment[] {
  const regex = /<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g
  const segments: TranscriptSegment[] = []

  let match: RegExpExecArray | null
  let index = 0

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(xml)) !== null) {
    const offset = Number.parseFloat(match[1])
    const duration = Number.parseFloat(match[2])
    const rawText = match[3]
    const decoded = decodeHtml(rawText)
      .replace(/\s+/g, " ")
      .trim()

    if (!decoded) {
      continue
    }

    segments.push({
      id: `${Math.round(offset * 1000)}-${index}`,
      text: decoded,
      offset,
      duration,
    })
    index += 1
  }

  return segments
}

function decodeHtml(value: string): string {
  const replacements: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  }

  return value
    .replace(/&(#\d+);/g, (_, group) => {
      const codePoint = Number.parseInt(group.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCharCode(codePoint) : group
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (entity) => replacements[entity] ?? entity)
    .replace(/<br\s*\/?>/gi, " ")
}

function buildHeaders(language?: string) {
  return {
    "User-Agent": YT_USER_AGENT,
    ...(language ? { "Accept-Language": language } : {}),
  }
}
