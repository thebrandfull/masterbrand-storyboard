const API_BASE = "https://api.elevenlabs.io/v1"

export type ElevenLabsVoice = {
  voice_id: string
  name: string
  description?: string
  category?: string
  labels?: Record<string, string>
  preview_url?: string
}

export type ElevenLabsVoiceSettings = {
  stability?: number
  similarity_boost?: number
  style?: number
  use_speaker_boost?: boolean
}

export type GenerateSpeechInput = {
  text: string
  voiceId: string
  modelId?: string
  voiceSettings?: ElevenLabsVoiceSettings
}

export type AlignmentCharacter = {
  character: string
  start: number
  end: number
}

export type GenerateSpeechResult = {
  audioBase64: string
  alignment?: AlignmentCharacter[]
  model_id?: string
}

function getApiKey() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }
  return key
}

async function elevenLabsFetch(path: string, init?: RequestInit) {
  const key = getApiKey()
  const headers = new Headers(init?.headers)
  headers.set("xi-api-key", key)
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const detail = await safeParseError(response)
    throw new Error(detail ?? `ElevenLabs request failed with ${response.status}`)
  }

  return response
}

async function safeParseError(response: Response) {
  try {
    const text = await response.text()
    return text
  } catch {
    return null
  }
}

export async function fetchVoices() {
  const response = await elevenLabsFetch("/voices", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })
  const payload = await response.json()
  return (payload.voices ?? []) as ElevenLabsVoice[]
}

export async function generateSpeech({
  text,
  voiceId,
  modelId = "eleven_multilingual_v2",
  voiceSettings,
}: GenerateSpeechInput): Promise<GenerateSpeechResult> {
  const body = {
    text,
    model_id: modelId,
    voice_settings: voiceSettings,
  }

  try {
    const response = await elevenLabsFetch(`/text-to-speech/${voiceId}`, {
      method: "POST",
      body: JSON.stringify({
        ...body,
        output_format: "json",
        alignment: true,
      }),
      headers: {
        Accept: "application/json",
      },
    })

    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const data = await response.json()
      const alignment = (data?.alignment?.characters ?? []) as AlignmentCharacter[]
      const audioBase64 = data?.audio ?? data?.audio_base64 ?? ""
      if (!audioBase64) {
        throw new Error("ElevenLabs did not return audio data")
      }
      return {
        audioBase64,
        alignment,
        model_id: data?.model_id ?? modelId,
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      audioBase64: buffer.toString("base64"),
      alignment: undefined,
      model_id: modelId,
    }
  } catch {
    const fallbackResponse = await elevenLabsFetch(`/text-to-speech/${voiceId}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        Accept: "audio/mpeg",
      },
    })

    const buffer = Buffer.from(await fallbackResponse.arrayBuffer())
    return {
      audioBase64: buffer.toString("base64"),
      alignment: undefined,
      model_id: modelId,
    }
  }
}
