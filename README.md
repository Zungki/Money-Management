# ทรัพย์อนันต์ Sub Anan · personal money management

Responsive personal finance dashboard with a desktop sidebar and mobile navigation. Built with Next.js, TypeScript, Tailwind CSS, React Hook Form, Zod, Supabase Auth and Supabase Database.

## Features

- Email/password sign-up, sign-in and sign-out through Supabase Auth.
- Private normalized Supabase tables for transactions, savings goals and deposits, budgets, interest accounts, debt installments and user preferences.
- Row Level Security policies scope every database row to its signed-in owner.
- Finance data loads from Supabase and saves atomically through `save_my_finance_data`; finance data is not stored in browser localStorage.
- Existing rows in the earlier `user_finance_data` JSON table are migrated to the normalized tables on first login after the new schema is installed.
- TH/EN interface toggle and currency display selector (THB, USD, EUR, JPY, GBP, AUD, SGD).
- Income and expense entry with category summaries and delete actions.
- Savings target calculator with 50/30/20, Pay Yourself First, FIRE and 6 Jars approaches.
- Emergency fund and independent custom savings goals, with per-goal deposits, history and calendar projections.
- One action distributes remaining monthly funds evenly across unfinished goals.
- Category budgets, interest projections, debt installment tracking, monthly/yearly reports, CSV/JSON export/import and financial health ratios.

## Setup

1. Install Node.js 20.9 or newer and run `npm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's API settings. The publishable key can be used for the anon key value; never put a service-role key in a browser environment variable.
3. Open the Supabase SQL Editor and run the full script in [`supabase/schema.sql`](supabase/schema.sql). It creates all app tables, owner-only RLS policies and the atomic save function.
4. In Supabase **Authentication → URL Configuration**, set your local site URL and add the Vercel site URL after deployment. Email confirmation settings determine whether a new account can log in immediately.
5. Run `npm run dev` and open `http://localhost:3000`.

The existing `user_finance_data` table from the earlier app version may remain in the project. The app no longer writes to it; if it contains a user's old backup, the first load after the new schema is installed copies it into the normalized tables.

## Hosting

Deploy to Vercel and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project's environment variables. Add the production URL to Supabase Auth redirect settings. Use only the public publishable/anon key in the browser; RLS protects user records.
