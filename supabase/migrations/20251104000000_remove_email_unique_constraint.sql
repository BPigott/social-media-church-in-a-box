-- Remove UNIQUE constraint from churches.email column
-- This allows multiple churches to use the same email address
-- Rationale: Multiple accounts per church = more revenue, simpler UX

-- Drop the existing unique constraint on email
ALTER TABLE public.churches
DROP CONSTRAINT IF EXISTS churches_email_key;

-- Add a comment explaining why email is not unique
COMMENT ON COLUMN public.churches.email IS 'Church email address. Not unique - multiple churches can share the same email.';
