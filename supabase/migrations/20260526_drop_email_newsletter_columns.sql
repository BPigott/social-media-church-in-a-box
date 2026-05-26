-- Drop the dormant email_newsletter columns from generated_content.
-- The feature was half-removed in earlier cleanup; the orchestrator and
-- specialists no longer touch these columns, and the UI has now been stripped.

ALTER TABLE public.generated_content
  DROP COLUMN IF EXISTS email_newsletter,
  DROP COLUMN IF EXISTS email_newsletter_english;
