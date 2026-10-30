# Together — Couple Schedule

A shared weekly planner built with Next.js App Router, TypeScript, PostgreSQL, and Drizzle ORM. Every day has separate columns for two partners. Events can belong to either person or both.

## Local setup

Requires Node.js 22+ and PostgreSQL 14+.

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your PostgreSQL connection string.
3. `npm run db:migrate`
4. `npm run dev`, then open http://localhost:3000.

The homepage includes a clearly labeled sample calendar. Select **Create our calendar**, enter both names, and create an empty, persisted calendar. Copy the shared link to invite your partner and bookmark it for later. No account is required.

## Features

- Monday–Sunday calendar, with one column per partner for each day
- Events for one partner or both; edit, delete, locations, and notes
- Week navigation, today shortcut, agenda view, and person filters
- Editable calendar and partner names
- Automatic refresh every 10 seconds while visible, plus refresh on window focus
- Version checks prevent silent overwrites when both people edit the same event
- Overlapping events appear side by side
- Keyboard accessible native dialogs and responsive layout

## Vercel deployment

1. Import `Noe-prt/CoupleSchedule` into Vercel. Framework: Next.js. Node.js: 24.x.
2. Attach your PostgreSQL database and add its **pooled** connection string as `DATABASE_URL` for the relevant environments. Keep this variable server-only. The app uses the standard PostgreSQL protocol and works with providers such as Neon, Supabase, or a normal PostgreSQL server.
3. Apply committed migrations to the target database with `npm run db:migrate` from a trusted terminal with that database's `DATABASE_URL`. Use an isolated preview database for preview deployments. Do not run migrations against production during every preview build.
4. Deploy with the default `npm run build` command.

No database access is required during the build. A missing database produces an explicit setup error when creating or opening a calendar; data is never silently saved to memory or browser storage.

## Data model and access

`schedules` stores the title, partner names, and a SHA-256 hash of the access key. `events` stores a calendar date and minute-of-day times, plus a version number. An index supports calendar/week lookups. Database constraints protect event time ranges and ownership values.

Links contain a cryptographically random 256-bit bearer key. Anyone holding the link can read and edit both partners' plans. There is no owner account, password reset, link recovery, or link revocation in this initial version. Losing the link means losing access. Share it privately, avoid analytics that collect full URLs, and do not place it in public posts. Referrer headers are disabled, calendars are marked noindex, and API responses are not cached. Infrastructure access logs may still contain URLs; configure redaction/retention for your host if needed.

Times are **floating local calendar times**, like a paper planner: a 09:00 event stays at 09:00 for both people, even if they are in different time zones. Events are limited to one date; split overnight plans into two events. Partner name changes use the last saved values; event edits and deletion use version checks.

Before opening this as a public service, add infrastructure rate limits for calendar creation and event writes, and a link rotation/recovery design if required. This version is designed for privately shared couple calendars.

## Development

- `npm test` — date boundaries, input validation, and overlapping event layout
- `npm run typecheck` — TypeScript
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run db:generate` — generate a migration after editing `src/db/schema.ts`
- `npm run db:migrate` — apply committed migrations

Drizzle CLI loads `.env.local` and `.env`. Never commit either file.
