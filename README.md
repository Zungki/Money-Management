# Kinn · personal money management

Responsive personal finance dashboard with a light desktop sidebar layout and mobile navigation. The dashboard follows the original Kinn UI and incorporates the user's latest feature reference. Built with Next.js App Router, TypeScript, Tailwind CSS, React Hook Form and Zod.

## Features

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
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.
3. Run `npm install`, then `npm run dev`.
4. In Supabase, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor. This creates transaction, goal and deposit tables with row-level security.

The Supabase client and RLS-ready schema are scaffolding for a future cloud-backed version. The current UI stores its data in the browser's localStorage and does not yet use Supabase Auth or database persistence. The currency selector changes display formatting only; it does not convert exchange rates.

## Hosting

Deploy the repository to Vercel and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project environment variables. The schema's RLS policies restrict rows to the signed-in owner. Review Supabase Auth and Vercel project settings before production use.
