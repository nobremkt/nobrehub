-- Add Batch Metadata to Gallery
-- Used for Roteiro Pipeline grouping

ALTER TABLE gallery_images 
ADD COLUMN IF NOT EXISTS batch_id TEXT,
ADD COLUMN IF NOT EXISTS scene_number INTEGER,
ADD COLUMN IF NOT EXISTS narration TEXT;

-- Index for querying by batch
CREATE INDEX IF NOT EXISTS idx_gallery_images_batch_id ON gallery_images(batch_id);
