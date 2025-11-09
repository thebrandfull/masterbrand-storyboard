export type TranscriptSegment = {
  id: string
  text: string
  offset: number
  duration: number
}

export type TranscriptLanguage = {
  languageCode: string
  name: string
  kind?: string
}

export type TranscriptPayload = {
  videoId: string
  title: string
  channelName: string
  description?: string
  durationSeconds: number
  thumbnailUrl?: string
  languageCode: string
  languages: TranscriptLanguage[]
  segments: TranscriptSegment[]
}

export type ScriptUpgradeRequest = {
  transcriptText: string
  videoTitle: string
  durationSeconds?: number
  channelName?: string
  goal?: string
  issues?: string
  audience?: string
  tone?: string
  callToAction?: string
}

export type ScriptOutlineBeat = {
  label: string
  summary: string
  detail: string
  upgrade?: string
}

export type ScriptUpgrade = {
  hook: string
  refinedIdea: string
  outline: ScriptOutlineBeat[]
  improvements: string[]
  ctas: string[]
  risks: string[]
  closing: string
}
