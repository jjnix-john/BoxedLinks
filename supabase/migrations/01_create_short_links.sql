-- Create short_links table
CREATE TABLE IF NOT EXISTS short_links (
  id BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(8) NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on short_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(short_code);

-- Create index on file_path for deduplication checks
CREATE INDEX IF NOT EXISTS idx_short_links_path ON short_links(file_path);

-- Enable RLS (Row Level Security)
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read short links (they're public URLs)
CREATE POLICY "short_links_select" ON short_links
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert short links
CREATE POLICY "short_links_insert" ON short_links
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can only delete their own short links
CREATE POLICY "short_links_delete" ON short_links
  FOR DELETE
  USING (created_by = auth.uid());