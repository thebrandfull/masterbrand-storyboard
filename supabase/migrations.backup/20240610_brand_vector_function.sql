CREATE OR REPLACE FUNCTION match_brand_vectors(brand_id uuid, match_count integer, query_embedding vector(1536))
RETURNS TABLE(
  id uuid,
  type text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT bv.id, bv.type, bv.content, bv.metadata,
         1 - (bv.embedding <=> query_embedding) AS similarity
  FROM brand_vectors bv
  WHERE bv.brand_id = brand_id
  ORDER BY bv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
