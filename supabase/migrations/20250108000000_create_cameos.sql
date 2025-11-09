-- Cameos table for Sora 2 character consistency
CREATE TABLE IF NOT EXISTS cameos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  visual_description TEXT NOT NULL,
  reference_images TEXT[],
  usage_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cameos_brand_id ON cameos(brand_id);

-- Add comment
COMMENT ON TABLE cameos IS 'Character cameos that can be referenced with @name in Sora 2 prompts for consistent character generation';
