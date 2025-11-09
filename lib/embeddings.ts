import { DeepSeekError } from "@/lib/deepseek"

const EMBEDDING_MODEL = process.env.DEEPSEEK_EMBEDDING_MODEL || "deepseek-embedding"

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return fallbackEmbedding(text, "Missing DEEPSEEK_API_KEY")
  }

  const trimmed = text.length > 4000 ? text.slice(0, 4000) : text

  try {
    const response = await fetch("https://api.deepseek.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: trimmed,
      }),
    })

    if (!response.ok) {
      throw new DeepSeekError(
        `Embedding generation failed: ${response.statusText}`,
        response.status >= 500 ? "server" : "invalid",
        response.status
      )
    }

    const data = await response.json()
    const embedding = data?.data?.[0]?.embedding
    if (!embedding) {
      throw new DeepSeekError("DeepSeek returned an empty embedding", "server")
    }
    return embedding
  } catch (error) {
    console.warn("Embedding generation failed, falling back to deterministic hash:", error)
    return fallbackEmbedding(text)
  }
}

function fallbackEmbedding(text: string, reason?: string) {
  if (reason) {
    console.warn("Embedding fallback reason:", reason)
  }
  return hashedEmbedding(text)
}

function hashedEmbedding(text: string) {
  const dims = 1536
  const vector = new Float64Array(dims)
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text || "")

  if (bytes.length === 0) {
    return new Array(dims).fill(0)
  }

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]
    const idx = (byte + i * 31) % dims
    const value = (byte / 255) * 2 - 1
    vector[idx] += value
  }

  for (let i = 0; i < bytes.length - 1; i++) {
    const combined = (bytes[i] << 8) | bytes[i + 1]
    const idx = (combined + i * 17) % dims
    const value = ((combined % 1024) / 512) - 1
    vector[idx] += value
  }

  let magnitude = 0
  for (let i = 0; i < dims; i++) {
    magnitude += vector[i] * vector[i]
  }
  magnitude = Math.sqrt(Math.max(magnitude, 1e-9))

  return Array.from(vector, (value) => Number((value / magnitude).toFixed(6)))
}
