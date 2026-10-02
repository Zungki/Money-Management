-- Run this in the Supabase SQL editor. Every financial row is private to its owner.
create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'ทั่วไป',
  amount numeric(14,2) not null check (amount > 0),
  kind text not null check (kind in ('income', 'expense')),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date,
  icon text not null default '◎',
  created_at timestamptz not null default now()
);

create table if not exists public.savings_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  deposited_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_on desc);
create index if not exists goals_user_idx on public.savings_goals(user_id);
create index if not exists deposits_goal_date_idx on public.savings_deposits(goal_id, deposited_on desc);

alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_deposits enable row level security;

create policy "Users manage their own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own savings goals" on public.savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own deposits" on public.savings_deposits
  for all using (auth.uid() = user_id) with check (
    auth.uid() = user_id and exists (
      select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid()
    )
  );
