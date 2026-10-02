-- Run this migration in the Supabase SQL Editor.
-- The browser stores one JSON document per authenticated user; RLS isolates each row.
create table if not exists public.user_finance_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_finance_data enable row level security;
revoke all on public.user_finance_data from anon;
grant select, insert, update, delete on public.user_finance_data to authenticated;

drop policy if exists "Users manage their own finance data" on public.user_finance_data;
create policy "Users manage their own finance data"
  on public.user_finance_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_finance_data_updated_at_idx
  on public.user_finance_data(updated_at desc);
