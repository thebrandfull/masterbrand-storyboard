-- Storyboard Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Grant permissions (adjust as needed)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

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
