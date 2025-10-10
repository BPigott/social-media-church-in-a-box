-- Make sermon_transcript_id nullable in generated_content table
-- This allows generated content to exist without storing the actual sermon transcript
ALTER TABLE generated_content 
ALTER COLUMN sermon_transcript_id DROP NOT NULL;

-- Add comment to clarify the new behavior
COMMENT ON COLUMN generated_content.sermon_transcript_id IS 'Legacy field - now nullable as sermon transcripts are no longer stored after generation';