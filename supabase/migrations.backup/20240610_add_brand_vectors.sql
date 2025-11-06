CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS brand_vectors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_vectors_brand_type ON brand_vectors(brand_id, type);
CREATE INDEX IF NOT EXISTS idx_brand_vectors_embedding ON brand_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
