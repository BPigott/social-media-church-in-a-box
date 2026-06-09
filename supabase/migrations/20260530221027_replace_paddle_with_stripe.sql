-- Replace Paddle (and legacy LemonSqueezy) with Stripe on the subscriptions table.
--
-- Neither Paddle nor LemonSqueezy was ever activated, so all of these columns are
-- empty — dropping them is non-destructive. Stripe is now the sole payment provider.

-- 1. Add Stripe identifiers.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Drop the unused Paddle columns (their UNIQUE constraint drops with the column).
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS paddle_subscription_id,
  DROP COLUMN IF EXISTS paddle_customer_id,
  DROP COLUMN IF EXISTS paddle_price_id;

-- 3. Drop the legacy LemonSqueezy columns.
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS ls_subscription_id,
  DROP COLUMN IF EXISTS ls_customer_id,
  DROP COLUMN IF EXISTS ls_variant_id,
  DROP COLUMN IF EXISTS ls_order_id;
