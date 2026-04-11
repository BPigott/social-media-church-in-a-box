-- Add Paddle payment provider columns to subscriptions table.
-- LemonSqueezy columns are kept for historical data — do not drop.

alter table public.subscriptions
  add column if not exists paddle_subscription_id text unique,
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_price_id text;

comment on column public.subscriptions.ls_subscription_id
  is 'Legacy LemonSqueezy identifier — superseded by paddle_subscription_id';
