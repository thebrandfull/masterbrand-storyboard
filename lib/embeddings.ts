import { DeepSeekError } from "@/lib/deepseek"

const EMBEDDING_MODEL = process.env.DEEPSEEK_EMBEDDING_MODEL || "deepseek-embedding"

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return fallbackEmbedding("Missing DEEPSEEK_API_KEY")
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
    console.warn("Embedding generation failed, falling back to zeros:", error)
    return fallbackEmbedding()
  }
}

function fallbackEmbedding(reason?: string) {
  if (reason) {
    console.warn("Embedding fallback reason:", reason)
  }
  return new Array(1536).fill(0)
}
