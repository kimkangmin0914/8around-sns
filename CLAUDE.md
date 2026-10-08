# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**beside** is a Korean, text-first SNS (signup/login, follow lists, posts, comments, one-level replies) built for the 8around FDE assignment (`docs/assignment.md`). Next.js 16 App Router + React 19 + TypeScript, Supabase (Auth + Postgres + RLS), CSS Modules on hand-written design tokens. Production is Netlify, deployed from `main`.

Team rules are in `AGENTS.md` (imported at the end). Visual and copy rules are in `DESIGN.md` — read it before touching UI; `/brand` is its live specimen. The assignment requires `README.md`, `tool.md` and `exports/` to stay in the repo.

## Commands

Node 24 (`.nvmrc`). Local development needs Docker (Colima works) for the Supabase CLI stack.

```bash
npm ci
npm run db:start      # local Supabase: Postgres + Auth + PostgREST, applies supabase/migrations + seed.sql
npm run db:env        # writes .env.local with the local URL + publishable key
npm run dev           # http://127.0.0.1:3000
npm run db:reset      # back to migrations + seed (8 demo users; password in the seed.sql header)
npm run db:stop

npm run check         # prettier --check . && eslint . && tsc --noEmit && vitest run --project unit
npm run test:db       # tests/db against the LOCAL Supabase only (refuses non-localhost URLs)
npm run build
npm run format

npx vitest run --project unit tests/unit/validation.test.ts   # one file
npx vitest run --project unit -t "답글의 답글"                  # by test name
```

CI (`.github/workflows/ci.yml`) runs `check` + `build`, plus a separate job that boots Supabase in Docker and runs `test:db`. Netlify only runs `npm run build` (`netlify.toml`); its env is just `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `lib/supabase/config.ts` rejects anything but an `sb_publishable_` key and allows plain http only for localhost.

## Architecture

### Request flow and identity

- `src/proxy.ts` (Next 16's middleware) runs `lib/supabase/proxy.ts#updateSession` on every non-static request: refreshes the cookie session, and if the session or account no longer exists (`isMissingSession`, which includes `user_not_found`) it signs out locally to clear the stale cookie. Responses are `private, no-store`.
- `app/layout.tsx` is `force-dynamic` and calls `server/queries/viewer.ts#getViewer()` (React `cache`, per request). `Viewer` is `guest | error | onboarding | ready`; `onboarding` means authenticated without a `profiles` row, and pages redirect there. The layout passes a serialisable `ShellViewer` to `ShellProvider`, which drives the rail, mobile bars, bento menu, compose dialog and toasts. Ready viewers' pages are wrapped in `SessionBoundary`, which blocks stale UI when another tab switches account.

### Reads vs writes

- `server/queries/*` — reads with the server client. They return `{ ok: false }` instead of throwing, and pages render `ErrorState` (never an empty list) on failure. Lists return `Page<T> = { ok, items, next }` with **keyset cursors** `"created_at|id"` (`encodeCursor`/`parseCursor` in `lib/validation.ts`, `olderThan()` builds the PostgREST `or` filter). Embeds name FKs explicitly (`profiles!posts_author_id_fkey`, `follows!follows_followee_id_fkey`, …) and must match the migration.
- `server/actions/*` (`"use server"`) — every write goes `readFields` (field whitelist) → shared validator in `lib/validation.ts` → `requireAuthor(expectedUserId)` (signed in, same user the page was rendered for, has a profile) → insert, letting DB defaults and RLS set author/id/time → re-read to confirm → `revalidatePath` → `ActionResult` (`success | input | error | uncertain`, `lib/action-result.ts`). The same folder also holds read actions for "load more" (`loadPosts`, `loadThreads`, `loadPeople`) and `checkUsername`.
- The client calls the action, then `router.refresh()`. `ShellContext.markFresh(id)` lets lists highlight the new item.

### Client lists and state

- `FeedList`, `ThreadList` and `PeopleList` take the server's first page as `initial` and keep appended pages in state that survives `router.refresh()`. `lib/list.ts` (`mergeNewestFirst`, `droppedRows`) prevents duplicates and rows lost at page boundaries; reuse it for new lists.
- `FollowButton` is optimistic with rollback. The feed's suggestion list is intentionally frozen for the visit so a followed row doesn't jump away.
- Composer drafts live in `sessionStorage` per variant + user. Dialogs are native `<dialog>` + `showModal()`; focus must be set after `showModal()` because React's `autoFocus` fires too early.

### Database

`supabase/migrations/202609170001_initial.sql` is exactly what production runs. Tables are `profiles`, `posts`, `comments` (`parent_id`), `follows`. Reads are public. Inserts are allowed only as yourself, via column-level grants (`author_id` is not insertable). There are no UPDATE grants; DELETE exists only for your own follows. Replies are **one level**: trigger `comments_parent_guard` rejects reply-to-reply and cross-post parents (`23514`). In the UI, "reply to a reply" attaches to the root comment and prefills `@username`. `lib/supabase/database.ts` is hand-written to mirror the migration — update it with any schema change, and add a new migration file plus `tests/db` coverage rather than editing the existing one.

A person's colour is not stored: `toneFor(user.id)` (`lib/tone.ts`, FNV hash → one of 8 tones) is rendered as `data-tone`.

### Styling

- Global CSS is only `src/styles/{tokens,base,layout}.css` (via `app/globals.css`); everything else is a colocated `*.module.css`.
- Page grid classes from `layout.css`: `.page` containing `.page-main` / `.page-aside` / `.page-wide` / `.page-full`, with `.section` and `.section-eyebrow`, which sits in the left margin column at ≥1280px. Hairlines come from `.page`'s background and from `::before` on sections and rows.
- `[data-tone]` sets `--tone / --tone-ink / --tone-deep`. Dark mode follows `prefers-color-scheme`, or `html[data-theme]` to force it.
- **Gotcha:** global keyframes from `base.css` (`rise`, `fade`, `flash`, `drop-in`) must be written as `global(rise)` inside a CSS Module. A bare `rise` gets hashed and silently does nothing.
- Icons are hand-drawn in `components/icons/icon.tsx`; the 8-tile mark and loader are in `components/brand/mark.tsx`. Fonts: Pretendard dynamic subset (npm), and Archivo via `next/font` (`--font-archivo`, wide axis for numbers and `@handles`).

### Tests

- `tests/unit` covers pure libs, server actions (using a Proxy-based fake Supabase query builder — see `fake()` in `actions.test.ts`), and the proxy's session cleanup.
- `tests/db` signs up throwaway users on the local stack and asserts RLS, grants, the reply-depth trigger and follow constraints.
- Browser checks are manual and recorded in `docs/verification.md`, kept separate from unit and DB evidence.

@AGENTS.md
