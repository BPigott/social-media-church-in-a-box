-- Generation ledger: persists every generation request so content survives
-- tab switches, refreshes, and re-renders. Also enables idempotency,
-- token budget tracking, and generation history.

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid unique not null,
  user_id uuid references auth.users not null,
  church_id uuid not null,
  created_at timestamptz default now(),
  completed_at timestamptz,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  content_types text[] not null,
  platforms text[],
  generation_mode text not null default 'sermon',
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10,6),
  result jsonb
);

alter table public.generations enable row level security;

create policy "Users can read own generations"
  on public.generations for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own generations"
  on public.generations for insert
  with check ((select auth.uid()) = user_id);

create policy "Service role can manage all generations"
  on public.generations for all
  using (auth.jwt() ->> 'role' = 'service_role');

create index generations_user_id_created_at_idx
  on public.generations(user_id, created_at desc);

create index generations_idempotency_key_idx
  on public.generations(idempotency_key);
