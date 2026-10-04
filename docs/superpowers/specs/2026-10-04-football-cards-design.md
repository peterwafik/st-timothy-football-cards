# St. Timothy Football Cards — Design Spec

Date: 2026-10-04
Status: Draft for review

## 1. Purpose

A website for the St. Timothy Sunday School class that turns each kid's spiritual
growth into a FIFA-style football card. Teachers (Leaders) log activities; each
kid's card stats, total score and rank update automatically. Each kid has a QR code
that opens their card.

It replaces the current Google Form + "St. Timothy Class Statistics.xlsx" workflow.

**Success criteria**
- A teacher can log a session for the whole class from a phone in under a minute.
- Scanning a kid's QR code shows their up-to-date card (photo, name, rank, tier, 6 stats).
- No private kid data (addresses, phones, father of confession) is stored or shown.
- Runs on localhost for testing, then deploys to Vercel at $0 cost.

## 2. Roles

| Role | Login | Can do |
|---|---|---|
| Visitor (kid/parent) | none | View one card via its QR link; view leaderboard if enabled |
| Teacher | email + password | Log sessions, bonus/deduct, manage kids & photos, set SSK, undo entries |
| Admin | email + password | Everything a teacher can, plus settings and teacher accounts |

## 3. Activities and points

Initial values (from the "Scoring Scheme" sheet), editable by admin:

| Key | Name | Points | Feeds stat |
|---|---|---|---|
| `odas` | Odas | 150 | CHA |
| `fasl` | Fasl | 100 | SSA |
| `nota` | Nota Ro7eya | 100 | PRA |
| `tasbeha` | Tasbe7a | 50 | PRA |
| `dars` | Dars Ketab | 50 | RIB |
| `discipline` | Discipline | 200 | BEH |

**Total score** = Σ(points of each entry, using current point values) + Σ(adjustments).
Adjustments are bonus (+) or deduction (−) points with a reason.

## 4. Stats

Six stats on a 0–99 scale. Every stat starts at 0 for a new kid.

| Stat | Meaning | Source |
|---|---|---|
| CHA | Church Attendance | `odas` |
| SSA | Sunday School Attendance | `fasl` |
| PRA | Prayers | `nota` + `tasbeha` combined |
| RIB | Read in Bible | `dars` |
| BEH | Behaviour & Discipline | `discipline`, minus deductions |
| SSK | Social Skills | Manual teacher rating 0–99 (null shown as 0) |

**Definitions**
- *Session held* for an activity = a distinct date on which that activity was logged
  for at least one kid.
- For a kid, only sessions with `date >= kid.joined_on` count.
- `rate = attended / sessions_held` (0 if sessions_held = 0).
- `stat = round(99 × rate)`.
- PRA: attended and held are summed across `nota` and `tasbeha`.
- BEH: `max(0, round(99 × rate) − 5 × number_of_deduction_adjustments)`
  (deduction = adjustment with negative points, since joined_on).
- OVR (optional overall) = round(average of the 6 stats).

## 5. Rank and tier

- Active kids are sorted by total score, descending.
- They are split into `tier_count` tiers (default 11, admin-configurable, max 11)
  of roughly equal size: `tier = floor(position_index × tier_count / active_count) + 1`,
  where kids with equal scores take the tier of the first kid with that score.
- Rank number on the card = tier number (shown as 1 ST, 2 ND, 3 RD, 4 TH…).
- Tier → template (`Badge Ranks/`): tier 1 → `0.9` (crystal), tier 2 → `1`,
  tier 3 → `2`, … tier 11 → `10` (bronze). With fewer tiers, the top templates are used
  in order.
- Inactive kids are excluded from ranking.

## 6. Pages

**Public**
- `/card/[code]`: full-screen card for one kid. `code` = random 8-char string.
  Includes a "Download card" button (PNG export via html-to-image). Inactive kids show
  a "Retired" label.
- `/leaderboard`: all active cards sorted by rank (photo, name, rank, tier only).
  Hidden when `leaderboard_public = false` (default true).

**Teacher (login required)**
- `/login`
- `/log`: pick date (default today) + activity, tick present kids (with "select all"),
  save. Mobile-first. Already-logged kids for that date/activity are pre-ticked and
  marked.
- `/adjust`: pick kid, +/− points, reason, date.
- `/kids`: list, add, edit (name, photo, flag, club, SSK, joined_on, active), show
  and print QR codes (A4 sheet, 12 per page with names).
- `/history`: all entries and adjustments, newest first, filter by kid/activity,
  undo (delete) button.
- `/settings` (admin): point values, tier_count, season_start, leaderboard_public,
  teacher accounts (invite by email, role).

## 7. Card rendering

`PlayerCard` component, pure HTML/CSS layered over the tier template:
- Background: the tier template image, scaled up, with CSS/SVG-drawn borders and
  dividers so it stays sharp.
- Top-left: rank number and suffix, flag, club crest.
- Right: kid photo (background removed).
- Name in bold uppercase condensed font.
- Stats in two columns: SSK / RIB / PRA (left), CHA / SSA / BEH (right), matching
  the sample cards.
- Text colour adapts per tier (dark text on gold/silver/bronze, light on others).

Flags: a selectable list of countries (flag emoji / SVG), default Egypt.
Clubs: a selectable list of popular club crests plus a "St. Timothy" crest, default
St. Timothy.

Template sharpness: start with the CSS/SVG redraw. Optional later upgrade: upscale the
11 templates via Higgsfield (11 credits), **only after explicit user approval**.

## 8. Photos

- Teacher uploads from the `/kids` edit form (camera or gallery).
- Browser resizes to ~800 px, runs on-device background removal
  (`@imgly/background-removal`), shows a preview; teacher may keep the original instead.
- Stored in Supabase Storage bucket `photos` (public read, teacher write).

## 9. Architecture

- Next.js (App Router, TypeScript) + Tailwind CSS.
- Supabase: Postgres, Auth (email/password), Storage.
- Deploy: Vercel; env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (server only).
- Local dev: same Supabase project (or Supabase CLI local stack).

### Data model

```
kids(id uuid pk, name text, public_code text unique, photo_url text,
     flag text default 'EG', club text default 'st-timothy', ssk int null check 0..99,
     joined_on date default season_start, active bool default true, created_at)
activities(key text pk, name text, points int, stat text)
entries(id uuid pk, kid_id fk, activity_key fk, date date, created_by uuid, created_at,
        unique(kid_id, activity_key, date))
adjustments(id uuid pk, kid_id fk, points int, reason text, date date,
            created_by uuid, created_at)
teachers(user_id uuid pk -> auth.users, name text, role text check in ('teacher','admin'))
settings(id int pk = 1, season_start date, tier_count int default 11,
         leaderboard_public bool default true)
```

- View `kid_stats`: per kid, the points, the 6 stats, OVR, total score, tier. Computed
  live from `entries` + `adjustments` + `activities` + `settings`. Nothing cached.
- `lib/scoring.ts` implements the same math in TypeScript (used for tests and as the
  single source of truth for tier assignment if SQL window logic becomes awkward).

### Security (Row-Level Security)
- Anonymous: `select` on a public card view exposing only id-safe fields
  (public_code, name, photo_url, flag, club, stats, tier, active).
- Authenticated teachers: read/write `kids`, `entries`, `adjustments`.
- Admin only: write `activities`, `settings`, `teachers`.

### Code layout
```
app/card/[code]/page.tsx
app/leaderboard/page.tsx
app/(teacher)/log, adjust, kids, history, settings, login
components/PlayerCard.tsx, QrSheet.tsx, KidPicker.tsx
lib/scoring.ts, lib/supabase/*.ts
supabase/migrations/*.sql, supabase/seed.sql
public/templates/0.9.png … 10.png, public/clubs/*, 
```

## 10. Initial data

Seed the 31 kids from "Full Class Sheet" (names only):
Efraim Remon, George Raafat, Daniel Samy, Seif Sherif, Carlos John, Oliver Mofeed,
Steven Mina, Rojer George, Paula Tarek, David Eissa, Kevin Ossama, Freddy Maged,
George Ayman, David George, Filopateer Mina, Thomas Sameh, Kerolos Emad, Patrick Nabil,
Filopateer Ayman, Justin remon, Kareem Joseph, Mina Hesham, Youssef Medhat,
Andrew Amgad, Johnny Sameh, Selim Ibrahim, Youssef Hany, Jerome Maged, Johnny Mina,
Matthew Adel, Pierre George.

The two existing Google Form responses are not imported (test data).

## 11. Error handling

- Duplicate entry (same kid/activity/date): skipped via unique constraint; UI reports
  "already logged".
- Save failure on `/log`: error toast, selections kept.
- Undo: deletes the entry/adjustment; stats recompute on next read.
- Photo processing failure: fall back to the original resized photo.
- Unknown card code: friendly "Card not found" page.

## 12. Testing

- Vitest unit tests for `lib/scoring.ts`: zero start, rates, join-date filtering,
  PRA combination, BEH deduction floor, tier split with ties, tier_count < 11,
  point-value change recomputation.
- Playwright end-to-end test on localhost: teacher login → log Fasl for 3 kids → their
  public cards show increased SSA and updated rank → undo restores previous values.
- Manual check of the 31 seeded kids on localhost before deploying to Vercel.

## 13. Out of scope (for now)

- Importing addresses, phones or other private sheet data.
- Parent accounts or notifications.
- Multiple classes or seasons archive.
- Higgsfield image generation (only the optional template upscale, with approval).
