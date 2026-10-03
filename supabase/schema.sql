-- Money Management: normalized Supabase schema.
-- Paste this complete script into Supabase SQL Editor and run it once.
create extension if not exists pgcrypto;

create table if not exists public.finance_transactions (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  title text not null,
  category text not null default 'ทั่วไป',
  amount numeric(14,2) not null check (amount > 0),
  occurred_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.finance_savings_goals (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  start_month text not null default to_char(current_date, 'YYYY-MM'),
  primary key (user_id, id)
);

create table if not exists public.finance_savings_deposits (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id text not null default 'emergency',
  month text not null,
  amount numeric(14,2) not null check (amount > 0),
  note text not null default '',
  recorded_at timestamptz,
  primary key (user_id, id)
);

create table if not exists public.finance_budgets (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric(14,2) not null check (monthly_limit > 0),
  primary key (user_id, id),
  unique (user_id, category)
);

create table if not exists public.finance_interest_accounts (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('savings', 'fixed')),
  principal numeric(14,2) not null check (principal > 0),
  annual_rate numeric(8,5) not null check (annual_rate >= 0),
  term_months integer not null check (term_months > 0),
  primary key (user_id, id)
);

create table if not exists public.finance_debts (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  monthly_payment numeric(14,2) not null check (monthly_payment > 0),
  total_installments integer not null check (total_installments > 0),
  paid_installments integer not null default 0 check (paid_installments >= 0),
  due_day integer not null default 1 check (due_day between 1 and 31),
  primary key (user_id, id)
);

create table if not exists public.finance_debt_payments (
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id text not null,
  paid_month text not null,
  primary key (user_id, debt_id, paid_month),
  foreign key (user_id, debt_id) references public.finance_debts(user_id, id) on delete cascade
);

create table if not exists public.finance_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_goal text not null default 'emergency',
  language text not null default 'th' check (language in ('th', 'en')),
  currency text not null default 'THB',
  savings_formula text not null default '503020' check (savings_formula in ('503020', 'buffett', 'fire', '6jars')),
  savings_mode text not null default 'formula' check (savings_mode in ('formula', 'custom')),
  custom_saving_target numeric not null default 0 check (custom_saving_target >= 0),
  emergency_months integer not null default 6 check (emergency_months in (3, 6, 9, 12)),
  emergency_start_month text not null default to_char(current_date, 'YYYY-MM'),
  display_name text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.finance_preferences
  add column if not exists savings_mode text not null default 'formula',
  add column if not exists custom_saving_target numeric not null default 0;

create index if not exists finance_transactions_user_date_idx on public.finance_transactions(user_id, occurred_at desc);
create index if not exists finance_deposits_user_goal_month_idx on public.finance_savings_deposits(user_id, goal_id, month);
create index if not exists finance_budgets_user_idx on public.finance_budgets(user_id);
create index if not exists finance_debts_user_idx on public.finance_debts(user_id);

-- Enable RLS and restrict every table to the signed-in owner.
do $$
declare t text;
begin
  foreach t in array array[
    'finance_transactions', 'finance_savings_goals', 'finance_savings_deposits',
    'finance_budgets', 'finance_interest_accounts', 'finance_debts',
    'finance_debt_payments', 'finance_preferences'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', 'finance_owner_access', t);
    execute format('create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', 'finance_owner_access', t);
  end loop;
end $$;

-- Atomic full-state save, called by the browser with the user's Supabase session.
create or replace function public.save_my_finance_data(p_data jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_data) <> 'object' then raise exception 'Invalid finance data'; end if;

  delete from public.finance_debt_payments where user_id = owner_id;
  delete from public.finance_debts where user_id = owner_id;
  delete from public.finance_savings_deposits where user_id = owner_id;
  delete from public.finance_savings_goals where user_id = owner_id;
  delete from public.finance_transactions where user_id = owner_id;
  delete from public.finance_budgets where user_id = owner_id;
  delete from public.finance_interest_accounts where user_id = owner_id;

  insert into public.finance_transactions (id,user_id,kind,title,category,amount,occurred_at)
  select coalesce(x.id, gen_random_uuid()::text), owner_id, x.kind, x.title, coalesce(x.category,'ทั่วไป'), x.amount,
         coalesce(x.created_at, now())
  from jsonb_to_recordset(coalesce(p_data->'items','[]'::jsonb)) as x(id text, kind text, title text, category text, amount numeric, created_at timestamptz);

  insert into public.finance_savings_goals (id,user_id,name,target_amount,start_month)
  select coalesce(x.id, gen_random_uuid()::text), owner_id, x.name, x.target, coalesce(x.start,to_char(current_date,'YYYY-MM'))
  from jsonb_to_recordset(coalesce(p_data->'goals','[]'::jsonb)) as x(id text, name text, target numeric, start text);

  insert into public.finance_savings_deposits (id,user_id,goal_id,month,amount,note,recorded_at)
  select coalesce(x.id, gen_random_uuid()::text), owner_id, coalesce(x.goal_id,'emergency'), coalesce(x.month,to_char(current_date,'YYYY-MM')),
         x.amount, coalesce(x.note,''), x.recorded_at
  from jsonb_to_recordset(coalesce(p_data->'deposits','[]'::jsonb)) as x(id text, goal_id text, month text, amount numeric, note text, recorded_at timestamptz);

  insert into public.finance_budgets (id,user_id,category,monthly_limit)
  select coalesce(x.id, gen_random_uuid()::text), owner_id, x.category, x.monthly_limit
  from jsonb_to_recordset(coalesce(p_data->'budgets','[]'::jsonb)) as x(id text, category text, monthly_limit numeric);

  insert into public.finance_interest_accounts (id,user_id,name,account_type,principal,annual_rate,term_months)
  select coalesce(x.id, gen_random_uuid()::text), owner_id, x.name, x.type, x.principal, x.annual_rate, x.term_months
  from jsonb_to_recordset(coalesce(p_data->'accounts','[]'::jsonb)) as x(id text, name text, type text, principal numeric, annual_rate numeric, term_months integer);

  insert into public.finance_debts (id,user_id,name,monthly_payment,total_installments,paid_installments,due_day)
  select coalesce(x.id, gen_random_uuid()::text), owner_id, x.name, x.monthly_payment, x.total_installments,
         coalesce(x.paid_installments,0), coalesce(x.due_day,1)
  from jsonb_to_recordset(coalesce(p_data->'debts','[]'::jsonb)) as x(id text, name text, monthly_payment numeric, total_installments integer, paid_installments integer, due_day integer);

  insert into public.finance_debt_payments (user_id,debt_id,paid_month)
  select owner_id, d.id, p.month
  from jsonb_to_recordset(coalesce(p_data->'debts','[]'::jsonb)) as d(id text, paid_months jsonb)
  cross join lateral jsonb_array_elements_text(coalesce(d.paid_months,'[]'::jsonb)) as p(month);

  insert into public.finance_preferences (user_id,selected_goal,language,currency,savings_formula,savings_mode,custom_saving_target,emergency_months,emergency_start_month,display_name,updated_at)
  values (owner_id, coalesce(p_data->>'selectedGoal','emergency'),
          case when p_data->>'lang' in ('th','en') then p_data->>'lang' else 'th' end,
          coalesce(p_data->>'currency','THB'),
          case when p_data->>'formula' in ('503020','buffett','fire','6jars') then p_data->>'formula' else '503020' end,
          case when p_data->>'savingMode' = 'custom' then 'custom' else 'formula' end,
          greatest(coalesce((p_data->>'customSavingTarget')::numeric,0),0),
          case when (p_data->>'months')::integer in (3,6,9,12) then (p_data->>'months')::integer else 6 end,
          coalesce(p_data->>'start',to_char(current_date,'YYYY-MM')), coalesce(p_data->>'name',''), now())
  on conflict (user_id) do update set selected_goal=excluded.selected_goal, language=excluded.language,
    currency=excluded.currency, savings_formula=excluded.savings_formula, savings_mode=excluded.savings_mode,
    custom_saving_target=excluded.custom_saving_target, emergency_months=excluded.emergency_months,
    emergency_start_month=excluded.emergency_start_month, display_name=excluded.display_name, updated_at=now();
end;
$$;

revoke all on function public.save_my_finance_data(jsonb) from public, anon;
grant execute on function public.save_my_finance_data(jsonb) to authenticated;
