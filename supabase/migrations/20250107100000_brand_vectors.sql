-- Brand brain vector storage
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS brand_vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  source_key TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_vectors_source_key ON brand_vectors(brand_id, source_key);
CREATE INDEX IF NOT EXISTS idx_brand_vectors_type ON brand_vectors(brand_id, type);
CREATE INDEX IF NOT EXISTS idx_brand_vectors_embedding ON brand_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

DROP FUNCTION IF EXISTS match_brand_vectors(uuid, integer, vector(1536));

CREATE OR REPLACE FUNCTION match_brand_vectors(brand_id uuid, match_count integer, query_embedding vector(1536))
RETURNS TABLE(
  id uuid,
  type text,
  source_key text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bv.id,
    bv.type,
    bv.source_key,
    bv.content,
    bv.metadata,
    1 - (bv.embedding <=> query_embedding) AS similarity
  FROM brand_vectors bv
  WHERE bv.brand_id = brand_id
  ORDER BY bv.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
END;
$$;
