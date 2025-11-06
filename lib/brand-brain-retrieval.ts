import { supabase } from "@/lib/supabase"

export interface BrandVectorMatch {
  id: string
  type: string
  source_key: string
  content: string
  metadata: Record<string, unknown> | null
  similarity: number
}

export async function searchBrandVectors(params: {
  brandId: string
  queryEmbedding: number[]
  limit?: number
}): Promise<BrandVectorMatch[]> {
  const { brandId, queryEmbedding, limit = 5 } = params
  // Type workaround for Supabase RPC type inference issue
  const { data, error } = await (supabase.rpc as any)("match_brand_vectors", {
    brand_id: brandId,
    match_count: limit,
    query_embedding: queryEmbedding,
  })

  if (error) {
    console.error("[searchBrandVectors] Vector search error:", error)
    return []
  }

  return (data || []) as BrandVectorMatch[]
}
