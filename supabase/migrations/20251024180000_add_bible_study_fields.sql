-- Add Bible Study Guide and enhanced content fields to generated_content table
ALTER TABLE generated_content 
ADD COLUMN bible_study_guide TEXT,
ADD COLUMN output_language TEXT DEFAULT 'en',
ADD COLUMN content_types JSONB DEFAULT '["social_media"]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN generated_content.bible_study_guide IS 'Complete Bible study guide content with scripture references and discussion questions';
COMMENT ON COLUMN generated_content.output_language IS 'Language code for generated content (e.g., en, es, fr)';
COMMENT ON COLUMN generated_content.content_types IS 'Array of content types generated: social_media, bible_study';
