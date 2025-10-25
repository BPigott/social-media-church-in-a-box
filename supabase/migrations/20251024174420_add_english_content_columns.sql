-- Add English version columns for all content types
-- This enables dual-language display and editing functionality

ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS bible_study_guide_english TEXT,
ADD COLUMN IF NOT EXISTS facebook_post_english JSONB,
ADD COLUMN IF NOT EXISTS instagram_post_english JSONB,
ADD COLUMN IF NOT EXISTS tiktok_post_english JSONB,
ADD COLUMN IF NOT EXISTS twitter_post_english JSONB,
ADD COLUMN IF NOT EXISTS executive_summary_english TEXT;

-- Add comments for documentation
COMMENT ON COLUMN generated_content.bible_study_guide_english IS
  'Original English version of Bible study guide when generated in a non-English language';

COMMENT ON COLUMN generated_content.facebook_post_english IS
  'Original English versions of Facebook posts when generated in a non-English language';

COMMENT ON COLUMN generated_content.instagram_post_english IS
  'Original English versions of Instagram posts when generated in a non-English language';

COMMENT ON COLUMN generated_content.tiktok_post_english IS
  'Original English versions of TikTok posts when generated in a non-English language';

COMMENT ON COLUMN generated_content.twitter_post_english IS
  'Original English versions of Twitter posts when generated in a non-English language';

COMMENT ON COLUMN generated_content.executive_summary_english IS
  'Original English version of executive summary when generated in a non-English language';
