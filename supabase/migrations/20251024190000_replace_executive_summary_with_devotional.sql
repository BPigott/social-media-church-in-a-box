-- Migration: Replace executive_summary with devotional field
-- This migration renames the executive_summary column to devotional in the generated_content table

-- Step 1: Rename the column
ALTER TABLE generated_content
  RENAME COLUMN executive_summary TO devotional;

-- Step 2: Add comment to describe the new column
COMMENT ON COLUMN generated_content.devotional IS 'Daily devotional content following the Blended Approach style guide, designed to move people from information to encounter with Jesus';
