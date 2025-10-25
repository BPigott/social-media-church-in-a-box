-- Add multi-language support to generated_content table
-- This supports up to 3 languages with parallel translation

-- Add output_languages column to store array of selected languages
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS output_languages TEXT[] DEFAULT ARRAY['en'];

-- Add multi_language_versions column to store content in all selected languages
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS multi_language_versions JSONB;

-- Add comments for documentation
COMMENT ON COLUMN generated_content.output_languages IS
  'Array of language codes for content generation (max 3 languages, e.g., ["en", "es", "fr"])';

COMMENT ON COLUMN generated_content.multi_language_versions IS
  'JSON object containing content versions in all non-English languages, keyed by language code';

-- Update existing records to have default values
UPDATE generated_content
SET output_languages = ARRAY['en']
WHERE output_languages IS NULL;

UPDATE generated_content
SET multi_language_versions = '{}'::jsonb
WHERE multi_language_versions IS NULL;
