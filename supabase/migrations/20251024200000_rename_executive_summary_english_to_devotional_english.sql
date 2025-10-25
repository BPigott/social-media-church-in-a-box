-- Rename executive_summary_english to devotional_english
-- This completes the migration from executive_summary to devotional
-- Safe version that handles cases where column might already be renamed or not exist

DO $$
BEGIN
    -- Check if executive_summary_english exists
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'generated_content'
        AND column_name = 'executive_summary_english'
    ) THEN
        -- Rename it to devotional_english
        ALTER TABLE generated_content
        RENAME COLUMN executive_summary_english TO devotional_english;

        RAISE NOTICE 'Renamed executive_summary_english to devotional_english';
    ELSIF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'generated_content'
        AND column_name = 'devotional_english'
    ) THEN
        RAISE NOTICE 'devotional_english column already exists, skipping rename';
    ELSE
        RAISE NOTICE 'Neither executive_summary_english nor devotional_english exists, skipping rename';
    END IF;
END $$;

-- Update comment to reflect the change (idempotent)
COMMENT ON COLUMN generated_content.devotional_english IS
  'Original English version of devotional when generated in a non-English language';
