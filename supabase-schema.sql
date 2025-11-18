-- Storyboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  mission TEXT,
  voice_tone TEXT,
  target_audience TEXT,
  visual_lexicon TEXT,
  dos TEXT[],
  donts TEXT[],
  proof_points TEXT[],
  cta_library TEXT[],
  negative_prompts TEXT[],
  platform_constraints JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  min_frequency INTEGER,
  max_frequency INTEGER,
  examples TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  date_target DATE NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'prompted', 'generated', 'enhanced', 'qc', 'scheduled', 'published')),
  notes TEXT,
  attachments JSONB,
  blocker_reason TEXT,
  files JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[],
  thumbnail_brief TEXT,
  model_params JSONB,
  critique_score NUMERIC(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'thumbnail')),
  url TEXT NOT NULL,
  provider_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  prompt_template TEXT NOT NULL,
  title_template TEXT NOT NULL,
  desc_template TEXT NOT NULL,
  tag_template TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_brand_id ON topics(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_brand_id ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_date_target ON content_items(date_target);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_generations_content_item_id ON generations(content_item_id);
CREATE INDEX IF NOT EXISTS idx_assets_content_item_id ON assets(content_item_id);
CREATE INDEX IF NOT EXISTS idx_templates_brand_id ON templates(brand_id);

-- Focus sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_brand_id ON focus_sessions(brand_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at);

-- Brand chat history table
CREATE TABLE IF NOT EXISTS brand_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_chat_messages_brand_created
  ON brand_chat_messages(brand_id, created_at);

-- Brand vectors table for brain memory
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for content_items updated_at
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vector similarity helper
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
  WHERE bv.brand_id = match_brand_vectors.brand_id
  ORDER BY bv.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
END;
$$;

-- Grant permissions (adjust as needed)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for single-user app (allow all operations)
DROP POLICY IF EXISTS "Allow all operations on brands" ON brands;
CREATE POLICY "Allow all operations on brands" ON brands FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all operations on topics" ON topics;
CREATE POLICY "Allow all operations on topics" ON topics FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all operations on content_items" ON content_items;
CREATE POLICY "Allow all operations on content_items" ON content_items FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all operations on generations" ON generations;
CREATE POLICY "Allow all operations on generations" ON generations FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all operations on assets" ON assets;
CREATE POLICY "Allow all operations on assets" ON assets FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all operations on templates" ON templates;
CREATE POLICY "Allow all operations on templates" ON templates FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all operations on brand_chat_messages" ON brand_chat_messages;
CREATE POLICY "Allow all operations on brand_chat_messages" ON brand_chat_messages FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all operations on focus_sessions" ON focus_sessions;
CREATE POLICY "Allow all operations on focus_sessions" ON focus_sessions FOR ALL USING (true) WITH CHECK (true);
