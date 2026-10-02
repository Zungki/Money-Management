# Kinn · personal money management

Responsive personal finance dashboard with a light desktop sidebar layout and mobile navigation. The dashboard follows the original Kinn UI and incorporates the user's latest feature reference. Built with Next.js App Router, TypeScript, Tailwind CSS, React Hook Form and Zod.

## Features

- Email/password sign-up, sign-in and sign-out through Supabase Auth.
- Per-account cloud backup and restore through Supabase Database; row-level security restricts each JSON data row to its owner. Existing anonymous browser data is migrated to the first account that signs in on that device.
- TH/EN interface toggle and currency display selector (THB, USD, EUR, JPY, GBP, AUD, SGD).
- Income and expense entry with quick category buttons, summary totals, and delete actions.
- Savings target calculator with 50/30/20, Pay Yourself First, FIRE and 6 Jars approaches.
- Emergency fund target based on recorded expenses and a selected 3, 6, 9 or 12 month reserve.
- Multiple independent savings goals: when one is complete, select another goal or create the next one. Deposits and progress stay separate per goal.
- Savings history is grouped into separate cards for the emergency fund and each custom goal.
- e-Savings deposits with notes, running balance, projected monthly schedule, actual deposit status and estimated completion month.
- Remaining cash is calculated as monthly income minus expenses and deposits already recorded this month. One action distributes the available amount evenly across incomplete goals, reallocating a goal's share if that goal reaches its target.
- After saving an expense, the entry form stays open and resets so another expense can be entered without reopening it.
- Monthly savings history view and local-device persistence through browser localStorage.

## Run locally

1. Install Node.js 20.9 or newer.
2. In Supabase, create a project. Copy `.env.example` to `.env.local` and fill in the project URL and anon/publishable key from **Project Settings → API**.
3. In the Supabase SQL Editor, run [`supabase/user_finance_data.sql`](supabase/user_finance_data.sql). It creates the private per-user data table and RLS policy used by the app.
4. In **Authentication → URL Configuration**, add `http://localhost:3000` to the Site URL or allowed redirect URLs. Add the deployed Vercel URL there too when deploying.
5. Run `npm install`, then `npm run dev`.

When a user signs in, the app loads their cloud data and automatically syncs changes. Browser localStorage remains as a per-account cache. The original [`supabase/schema.sql`](supabase/schema.sql) is an optional relational schema and is not required by the current JSON-backed app. The currency selector changes display formatting only; it does not convert exchange rates.

## Hosting

Deploy the repository to Vercel and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project environment variables. Configure the Vercel URL in Supabase Auth redirect settings. RLS restricts each finance data row to the signed-in owner.
