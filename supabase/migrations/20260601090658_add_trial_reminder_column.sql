ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMPTZ;
