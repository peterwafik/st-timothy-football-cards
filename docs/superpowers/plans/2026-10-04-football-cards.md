# St. Timothy Football Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js website where teachers log Sunday School activities and each kid's FIFA-style card (stats, rank, tier) updates live, reachable by a per-kid QR code.

**Architecture:** Next.js 16 App Router (TypeScript, Tailwind v4) on Vercel; Supabase for Postgres, email/password auth and photo storage. All scoring math lives in one pure, unit-tested module (`src/lib/scoring.ts`) that runs server-side over the raw tables — nothing is cached. Public pages read through a server-only service-role client and expose only card fields; teacher pages use the logged-in user's client under Row-Level Security.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, @supabase/supabase-js + @supabase/ssr, Vitest, Playwright, qrcode, html-to-image, @imgly/background-removal, country-flag-icons, Python 3 + Pillow (one-off template prep).

**Spec:** `docs/superpowers/specs/2026-10-04-football-cards-design.md`

## Global Constraints

- Stats are 0–99 integers; every stat starts at 0 for a new kid; `stat = round(99 × attended / sessions_held)`, 0 when nothing held.
- A *session held* = distinct date on which that activity was logged for ≥1 kid; only sessions with `date >= kid.joined_on` count for that kid.
- PRA combines `nota` + `tasbeha`; BEH = `max(0, rate_stat − 5 × deductions)`; SSK is manual (null → 0).
- Initial points: odas 150, fasl 100, nota 100, tasbeha 50, dars 50, discipline 200 — admin-editable; scores always recomputed from history with current values.
- Tiers: default 11, max 11; `tier = floor(firstIndexOfScore × tierCount / activeCount) + 1`; equal scores share a tier; inactive kids are excluded. Tier 1 → template `0.9`, tier k → template `k−1`.
- Plan decision (refines spec): kids with total score ≤ 0 are placed in the lowest tier, so at season start everyone is bronze rather than everyone crystal.
- Plan decision (refines spec §9 Security): anonymous users get **no** direct table access; public pages compute cards server-side with the service-role key and return only card fields.
- Never store addresses, phone numbers, father of confession, or any other sheet data besides kid names.
- Public card URL: `/card/<public_code>`, `public_code` = random 8 chars from `abcdefghjkmnpqrstuvwxyz23456789`.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the project's publishable/anon key), `SUPABASE_SERVICE_ROLE_KEY` (secret/service-role key, server only), `NEXT_PUBLIC_SITE_URL` (used in QR codes).
- Next.js 16 conventions: request interception lives in `src/proxy.ts` exporting `proxy`; `params`/`searchParams` are Promises; `cookies()` is async.
- No Higgsfield usage anywhere in this plan.

## Review Focus

1. **Season with >1000 entries** — Supabase returns at most 1000 rows per request; a reasonable person expects stats to stay correct all year. Pinned by `fetchAll` pagination test in Task 4.
2. **Season start, nobody has points** — all kids tie at 0; a reasonable person expects everyone on bronze, not everyone on crystal. Pinned by tier test in Task 2.
3. **Brand-new kid / activity never held** — expects 0s, never `NaN`. Pinned in Task 2.
4. **Two teachers log the same Fasl for the same kid** — expects one entry and an "already logged" message, not double points. Pinned by DB unique constraint (Task 4) and `summarizeInsert` test in Task 7.
5. **Long names like "Filopateer Ayman"** — expects the name to fit on the card line. Pinned by `nameFontScale` test in Task 3.

---

## File Structure

```
scripts/prepare_templates.py        one-off: make template backgrounds transparent, upscale 2x
scripts/create-admin.mjs            create first admin user + teachers row
public/templates/0.9.png … 10.png   processed tier templates
supabase/migrations/0001_init.sql   schema, RLS, storage bucket
supabase/migrations/0002_seed_kids.sql  31 kid names
src/lib/scoring.ts (+ .test.ts)     pure stat/score/tier math
src/lib/card.ts (+ .test.ts)        tier→template, rank label, name font scale, CardData type
src/lib/dates.ts (+ .test.ts)       local ISO date + validation
src/lib/fetch-all.ts (+ .test.ts)   paginated Supabase reads
src/lib/flags.ts, src/lib/clubs.ts  selectable lists
src/lib/supabase/{server,client,admin,proxy}.ts
src/lib/auth.ts                     requireTeacher / requireAdmin
src/lib/data.ts                     loadClassSnapshot, getCardByCode, toCardData
src/proxy.ts                        session refresh
src/components/{PlayerCard,Flag,ClubCrest,DownloadCardButton,ConfirmButton}.tsx
src/app/layout.tsx, globals.css, page.tsx
src/app/card/[code]/page.tsx, src/app/card/[code]/not-found.tsx
src/app/leaderboard/page.tsx
src/app/dev/cards/page.tsx          dev-only gallery of all tiers
src/app/login/{page.tsx,LoginForm.tsx,actions.ts}
src/app/(teacher)/layout.tsx, actions.ts (signOut)
src/app/(teacher)/log/{page.tsx,LogForm.tsx,actions.ts}
src/app/(teacher)/adjust/{page.tsx,AdjustForm.tsx,actions.ts}
src/app/(teacher)/history/{page.tsx,actions.ts}
src/app/(teacher)/kids/{page.tsx,KidForm.tsx,PhotoUploader.tsx,actions.ts}
src/app/(teacher)/kids/new/page.tsx, [id]/page.tsx, qr/page.tsx
src/app/(teacher)/settings/{page.tsx,actions.ts}
e2e/flow.spec.ts, playwright.config.ts, vitest.config.ts
README.md
```

---

### Task 1: Scaffold the Next.js app and test runner

**Files:**
- Create: whole Next.js scaffold at repo root, `vitest.config.ts`, `src/lib/smoke.test.ts` (deleted at end of task)
- Modify: `.gitignore`, `package.json`, `eslint.config.mjs`

**Interfaces:**
- Produces: `npm run dev`, `npm test` (Vitest), `@/` alias → `src/`.

- [ ] **Step 1: Generate the app in a temporary subfolder** (the repo root already has non-app files, which create-next-app refuses)

```bash
cd "D:/Football-Kids-Scoring-System"
npx create-next-app@latest st-timothy-cards --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```
Expected: `Success! Created st-timothy-cards`.

- [ ] **Step 2: Move it to the repo root and merge .gitignore**

```bash
cd "D:/Football-Kids-Scoring-System"
rm -rf st-timothy-cards/.git
shopt -s dotglob
for f in st-timothy-cards/*; do b=$(basename "$f"); [ "$b" = ".gitignore" ] && continue; mv "$f" .; done
cat st-timothy-cards/.gitignore >> .gitignore
rm -rf st-timothy-cards
grep -n "xlsx" .gitignore
```
Expected: `*.xlsx` still present in `.gitignore`.

- [ ] **Step 3: Install runtime and dev dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr qrcode html-to-image @imgly/background-removal country-flag-icons server-only
npm install -D vitest @types/qrcode @playwright/test
```

- [ ] **Step 4: Add Vitest config and scripts**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
```
In `package.json` `"scripts"` add:
```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test"
```

- [ ] **Step 5: Allow plain `<img>` (cards are exported with html-to-image, which needs real `<img>` tags)**

In `eslint.config.mjs`, append to the exported array:
```js
  { rules: { '@next/next/no-img-element': 'off' } },
```

- [ ] **Step 6: Smoke test**

`src/lib/smoke.test.ts`:
```ts
import { expect, test } from 'vitest';
test('vitest runs', () => expect(1 + 1).toBe(2));
```
Run: `npm test` → Expected: 1 passed.
Run: `npm run build` → Expected: build succeeds.

- [ ] **Step 7: Remove smoke test and commit**

```bash
rm src/lib/smoke.test.ts
git add -A ':!*.xlsx'
git status --short | grep -i xlsx && echo "STOP: xlsx staged" || true
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: Scoring engine

**Files:**
- Create: `src/lib/scoring.ts`, `src/lib/scoring.test.ts`

**Interfaces:**
- Produces:
```ts
export const STAT_KEYS: readonly ['SSK','RIB','PRA','CHA','SSA','BEH'];
export type StatKey = 'SSK'|'RIB'|'PRA'|'CHA'|'SSA'|'BEH';
export type ActivityStat = Exclude<StatKey,'SSK'>;
export interface Activity { key: string; name: string; points: number; stat: ActivityStat }
export interface KidInput { id: string; joinedOn: string; active: boolean; ssk: number | null }
export interface EntryInput { kidId: string; activityKey: string; date: string }
export interface AdjustmentInput { kidId: string; points: number; date: string }
export interface ClassInput { kids: KidInput[]; activities: Activity[]; entries: EntryInput[]; adjustments: AdjustmentInput[]; tierCount: number }
export interface KidResult { kidId: string; score: number; stats: Record<StatKey, number>; ovr: number; tier: number | null }
export const MAX_TIERS = 11;
export function computeClass(input: ClassInput): Map<string, KidResult>;
export function assignTiers(rows: { kidId: string; score: number }[], tierCount: number): Map<string, number>;
```
Dates are `YYYY-MM-DD` strings (string comparison is chronological).

- [ ] **Step 1: Write the failing tests**

`src/lib/scoring.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { assignTiers, computeClass, type Activity, type ClassInput } from './scoring';

const ACTIVITIES: Activity[] = [
  { key: 'odas', name: 'Odas', points: 150, stat: 'CHA' },
  { key: 'fasl', name: 'Fasl', points: 100, stat: 'SSA' },
  { key: 'nota', name: 'Nota Ro7eya', points: 100, stat: 'PRA' },
  { key: 'tasbeha', name: 'Tasbe7a', points: 50, stat: 'PRA' },
  { key: 'dars', name: 'Dars Ketab', points: 50, stat: 'RIB' },
  { key: 'discipline', name: 'Discipline', points: 200, stat: 'BEH' },
];

function input(partial: Partial<ClassInput>): ClassInput {
  return {
    kids: [{ id: 'a', joinedOn: '2026-10-01', active: true, ssk: null }],
    activities: ACTIVITIES,
    entries: [],
    adjustments: [],
    tierCount: 11,
    ...partial,
  };
}

describe('computeClass stats', () => {
  test('new kid with nothing held has all-zero stats and no NaN', () => {
    const r = computeClass(input({})).get('a')!;
    expect(r.score).toBe(0);
    expect(r.stats).toEqual({ SSK: 0, RIB: 0, PRA: 0, CHA: 0, SSA: 0, BEH: 0 });
    expect(r.ovr).toBe(0);
  });

  test('attendance rate maps to 0-99', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-01', active: true, ssk: null },
      { id: 'b', joinedOn: '2026-10-01', active: true, ssk: null },
    ];
    const dates = ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23'];
    const entries = [
      ...dates.map((date) => ({ kidId: 'b', activityKey: 'fasl', date })),
      ...dates.slice(0, 3).map((date) => ({ kidId: 'a', activityKey: 'fasl', date })),
    ];
    const res = computeClass(input({ kids, entries }));
    expect(res.get('a')!.stats.SSA).toBe(74); // round(99*3/4)
    expect(res.get('b')!.stats.SSA).toBe(99);
    expect(res.get('a')!.score).toBe(300);
  });

  test('sessions before joinedOn do not count against a late joiner', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-10', active: true, ssk: null },
      { id: 'b', joinedOn: '2026-10-01', active: true, ssk: null },
    ];
    const dates = ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23'];
    const entries = [
      ...dates.map((date) => ({ kidId: 'b', activityKey: 'odas', date })),
      { kidId: 'a', activityKey: 'odas', date: '2026-10-16' },
      { kidId: 'a', activityKey: 'odas', date: '2026-10-23' },
    ];
    expect(computeClass(input({ kids, entries })).get('a')!.stats.CHA).toBe(99);
  });

  test('PRA combines nota and tasbeha', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-01', active: true, ssk: null },
      { id: 'b', joinedOn: '2026-10-01', active: true, ssk: null },
    ];
    const entries = [
      { kidId: 'b', activityKey: 'nota', date: '2026-10-02' },
      { kidId: 'b', activityKey: 'nota', date: '2026-10-09' },
      { kidId: 'b', activityKey: 'tasbeha', date: '2026-10-03' },
      { kidId: 'b', activityKey: 'tasbeha', date: '2026-10-10' },
      { kidId: 'a', activityKey: 'nota', date: '2026-10-02' },
      { kidId: 'a', activityKey: 'tasbeha', date: '2026-10-03' },
      { kidId: 'a', activityKey: 'tasbeha', date: '2026-10-10' },
    ];
    expect(computeClass(input({ kids, entries })).get('a')!.stats.PRA).toBe(74);
  });

  test('BEH loses 5 per deduction and floors at 0', () => {
    const entries = [
      { kidId: 'a', activityKey: 'discipline', date: '2026-10-02' },
      { kidId: 'a', activityKey: 'discipline', date: '2026-10-09' },
    ];
    const adjustments = [
      { kidId: 'a', points: -50, date: '2026-10-05' },
      { kidId: 'a', points: -20, date: '2026-10-06' },
      { kidId: 'a', points: 30, date: '2026-10-07' },
    ];
    const r = computeClass(input({ entries, adjustments })).get('a')!;
    expect(r.stats.BEH).toBe(89);
    expect(r.score).toBe(400 - 50 - 20 + 30);

    const floor = computeClass(input({ adjustments: [{ kidId: 'a', points: -10, date: '2026-10-05' }] })).get('a')!;
    expect(floor.stats.BEH).toBe(0);
  });

  test('SSK is manual and ovr averages all six stats', () => {
    const kids = [{ id: 'a', joinedOn: '2026-10-01', active: true, ssk: 84 }];
    const entries = [{ kidId: 'a', activityKey: 'fasl', date: '2026-10-02' }];
    const r = computeClass(input({ kids, entries })).get('a')!;
    expect(r.stats.SSK).toBe(84);
    expect(r.stats.SSA).toBe(99);
    expect(r.ovr).toBe(Math.round((84 + 99) / 6));
  });

  test('score uses current point values', () => {
    const entries = [{ kidId: 'a', activityKey: 'fasl', date: '2026-10-02' }];
    const changed = ACTIVITIES.map((a) => (a.key === 'fasl' ? { ...a, points: 200 } : a));
    expect(computeClass(input({ entries, activities: changed })).get('a')!.score).toBe(200);
  });

  test('entries for unknown activities are ignored', () => {
    const entries = [{ kidId: 'a', activityKey: 'gone', date: '2026-10-02' }];
    expect(computeClass(input({ entries })).get('a')!.score).toBe(0);
  });
});

describe('tiers', () => {
  test('22 distinct scores over 11 tiers gives 2 per tier', () => {
    const rows = Array.from({ length: 22 }, (_, i) => ({ kidId: `k${i}`, score: 1000 - i }));
    const t = assignTiers(rows, 11);
    expect(t.get('k0')).toBe(1);
    expect(t.get('k1')).toBe(1);
    expect(t.get('k2')).toBe(2);
    expect(t.get('k21')).toBe(11);
  });

  test('equal scores share the tier of the first kid with that score', () => {
    const rows = [
      { kidId: 'a', score: 500 }, { kidId: 'b', score: 400 }, { kidId: 'c', score: 400 },
      { kidId: 'd', score: 400 }, { kidId: 'e', score: 100 },
    ];
    const t = assignTiers(rows, 5);
    expect(t.get('b')).toBe(2);
    expect(t.get('c')).toBe(2);
    expect(t.get('d')).toBe(2);
    expect(t.get('e')).toBe(5);
  });

  test('kids with score <= 0 go to the lowest tier (season start => all bronze)', () => {
    const rows = Array.from({ length: 31 }, (_, i) => ({ kidId: `k${i}`, score: 0 }));
    const t = assignTiers(rows, 11);
    expect(new Set(t.values())).toEqual(new Set([11]));
  });

  test('tierCount is clamped to 1..11', () => {
    const rows = [{ kidId: 'a', score: 10 }, { kidId: 'b', score: 5 }];
    expect(assignTiers(rows, 40).get('b')).toBe(6);
    expect(assignTiers(rows, 0).get('b')).toBe(1);
  });

  test('tierCount 8 uses tiers 1..8', () => {
    const rows = Array.from({ length: 16 }, (_, i) => ({ kidId: `k${i}`, score: 100 - i }));
    const t = assignTiers(rows, 8);
    expect(Math.max(...t.values())).toBe(8);
  });

  test('inactive kids get tier null and do not take tier slots', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-01', active: true, ssk: null },
      { id: 'x', joinedOn: '2026-10-01', active: false, ssk: null },
    ];
    const entries = [
      { kidId: 'a', activityKey: 'fasl', date: '2026-10-02' },
      { kidId: 'x', activityKey: 'odas', date: '2026-10-02' },
    ];
    const res = computeClass(input({ kids, entries, tierCount: 2 }));
    expect(res.get('x')!.tier).toBeNull();
    expect(res.get('a')!.tier).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` → Expected: FAIL, `Failed to resolve import "./scoring"`.

- [ ] **Step 3: Implement**

`src/lib/scoring.ts`:
```ts
export const STAT_KEYS = ['SSK', 'RIB', 'PRA', 'CHA', 'SSA', 'BEH'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type ActivityStat = Exclude<StatKey, 'SSK'>;
const ACTIVITY_STATS: ActivityStat[] = ['RIB', 'PRA', 'CHA', 'SSA', 'BEH'];

export interface Activity { key: string; name: string; points: number; stat: ActivityStat }
export interface KidInput { id: string; joinedOn: string; active: boolean; ssk: number | null }
export interface EntryInput { kidId: string; activityKey: string; date: string }
export interface AdjustmentInput { kidId: string; points: number; date: string }
export interface ClassInput {
  kids: KidInput[];
  activities: Activity[];
  entries: EntryInput[];
  adjustments: AdjustmentInput[];
  tierCount: number;
}
export interface KidResult {
  kidId: string;
  score: number;
  stats: Record<StatKey, number>;
  ovr: number;
  tier: number | null;
}

export const MAX_TIERS = 11;
const BEH_DEDUCTION_PENALTY = 5;

const clampStat = (n: number) => Math.min(99, Math.max(0, Math.round(n)));

export function computeClass(input: ClassInput): Map<string, KidResult> {
  const activityByKey = new Map(input.activities.map((a) => [a.key, a]));

  // Session = "activityKey|date"; grouped by the stat it feeds.
  const heldByStat = new Map<ActivityStat, Set<string>>();
  const entriesByKid = new Map<string, EntryInput[]>();
  for (const e of input.entries) {
    const activity = activityByKey.get(e.activityKey);
    if (!activity) continue;
    let held = heldByStat.get(activity.stat);
    if (!held) heldByStat.set(activity.stat, (held = new Set()));
    held.add(`${e.activityKey}|${e.date}`);
    let list = entriesByKid.get(e.kidId);
    if (!list) entriesByKid.set(e.kidId, (list = []));
    list.push(e);
  }

  const results = new Map<string, KidResult>();
  for (const kid of input.kids) {
    const kidEntries = entriesByKid.get(kid.id) ?? [];
    const kidAdjustments = input.adjustments.filter((a) => a.kidId === kid.id);

    let score = 0;
    for (const e of kidEntries) score += activityByKey.get(e.activityKey)!.points;
    for (const a of kidAdjustments) score += a.points;

    const stats = { SSK: clampStat(kid.ssk ?? 0) } as Record<StatKey, number>;
    for (const stat of ACTIVITY_STATS) {
      const held = [...(heldByStat.get(stat) ?? [])].filter((s) => s.split('|')[1] >= kid.joinedOn).length;
      const attended = new Set(
        kidEntries
          .filter((e) => activityByKey.get(e.activityKey)!.stat === stat && e.date >= kid.joinedOn)
          .map((e) => `${e.activityKey}|${e.date}`),
      ).size;
      stats[stat] = held === 0 ? 0 : clampStat((99 * attended) / held);
    }
    const deductions = kidAdjustments.filter((a) => a.points < 0 && a.date >= kid.joinedOn).length;
    stats.BEH = Math.max(0, stats.BEH - BEH_DEDUCTION_PENALTY * deductions);

    const ovr = Math.round(STAT_KEYS.reduce((sum, k) => sum + stats[k], 0) / STAT_KEYS.length);
    results.set(kid.id, { kidId: kid.id, score, stats, ovr, tier: null });
  }

  const activeRows = input.kids
    .filter((k) => k.active)
    .map((k) => ({ kidId: k.id, score: results.get(k.id)!.score }));
  for (const [kidId, tier] of assignTiers(activeRows, input.tierCount)) {
    results.get(kidId)!.tier = tier;
  }
  return results;
}

export function assignTiers(rows: { kidId: string; score: number }[], tierCount: number): Map<string, number> {
  const tiers = Math.min(MAX_TIERS, Math.max(1, Math.floor(tierCount)));
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const out = new Map<string, number>();
  let firstIndexOfScore = 0;
  sorted.forEach((row, i) => {
    if (i > 0 && row.score !== sorted[i - 1].score) firstIndexOfScore = i;
    const tier = row.score <= 0 ? tiers : Math.floor((firstIndexOfScore * tiers) / sorted.length) + 1;
    out.set(row.kidId, tier);
  });
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` → Expected: all scoring tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts
git commit -m "feat: scoring engine for stats, score and tiers"
```

---

### Task 3: Card templates and PlayerCard component

**Files:**
- Create: `scripts/prepare_templates.py`, `public/templates/*.png`, `src/lib/card.ts`, `src/lib/card.test.ts`, `src/lib/flags.ts`, `src/lib/clubs.ts`, `src/components/Flag.tsx`, `src/components/ClubCrest.tsx`, `src/components/PlayerCard.tsx`, `src/components/DownloadCardButton.tsx`, `src/app/dev/cards/page.tsx`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `StatKey`, `STAT_KEYS` from `@/lib/scoring`.
- Produces:
```ts
// src/lib/card.ts
export interface CardData { name: string; photoUrl: string | null; flag: string; club: string; tier: number; stats: Record<StatKey, number>; active: boolean }
export function templateForTier(tier: number): string;   // '0.9' | '1'..'10'
export function isLightTier(tier: number): boolean;      // tiers 9-11
export function rankLabel(tier: number): { num: string; suffix: string };
export function nameFontScale(name: string): number;     // fraction of card width
// components
export function PlayerCard(props: { data: CardData; width?: number; hideStats?: boolean }): JSX.Element;
export function DownloadCardButton(props: { targetId: string; fileName: string }): JSX.Element;
// lists
export const FLAGS: { code: string; name: string }[];
export const CLUBS: { slug: string; name: string; short: string; colors: [string, string] }[];
```

- [ ] **Step 1: Write the template prep script**

The source templates have a near-white rectangle around the card shape. All 11 share one silhouette, so we flood-fill the outside on the dark crystal template (`0.9`) and apply that mask to all of them, then upscale 2× with Lanczos.

`scripts/prepare_templates.py`:
```python
"""Make tier template backgrounds transparent and upscale them 2x.

Usage: py scripts/prepare_templates.py
Reads  "Badge Ranks/*.png"; writes public/templates/<same name>.png
"""
from collections import deque
from pathlib import Path
from PIL import Image

SRC = Path("Badge Ranks")
OUT = Path("public/templates")
NAMES = ["0.9"] + [str(i) for i in range(1, 11)]
THRESHOLD = 225  # luminance above this, connected to a corner, is "outside"


def outside_mask(img: Image.Image) -> Image.Image:
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    lum = lambda p: 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]
    seen = [[False] * h for _ in range(w)]
    q = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    mask = Image.new("L", (w, h), 255)
    m = mask.load()
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            continue
        seen[x][y] = True
        if lum(px[x, y]) < THRESHOLD:
            continue
        m[x, y] = 0
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return mask


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mask = outside_mask(Image.open(SRC / "0.9.png"))
    for name in NAMES:
        img = Image.open(SRC / f"{name}.png").convert("RGBA")
        img.putalpha(mask)
        img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
        img.save(OUT / f"{name}.png")
        print("wrote", OUT / f"{name}.png", img.size)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it and eyeball one result**

```bash
py -m pip install -q pillow
py scripts/prepare_templates.py
```
Expected: 11 lines `wrote public/templates/<n>.png (364, 514)`. Open `public/templates/10.png` (bronze — the riskiest because it's light) with the Read tool: the corners must be transparent and the card body intact. If the bronze card body got eaten, lower `THRESHOLD` to 240 and rerun.

- [ ] **Step 3: Write failing tests for card helpers**

`src/lib/card.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { isLightTier, nameFontScale, rankLabel, templateForTier } from './card';

describe('card helpers', () => {
  test('tier to template file', () => {
    expect(templateForTier(1)).toBe('0.9');
    expect(templateForTier(2)).toBe('1');
    expect(templateForTier(11)).toBe('10');
  });
  test('light tiers are gold, silver, bronze', () => {
    expect([8, 9, 10, 11].map(isLightTier)).toEqual([false, true, true, true]);
  });
  test('rank labels', () => {
    expect(rankLabel(1)).toEqual({ num: '1', suffix: 'ST' });
    expect(rankLabel(2)).toEqual({ num: '2', suffix: 'ND' });
    expect(rankLabel(3)).toEqual({ num: '3', suffix: 'RD' });
    expect(rankLabel(4)).toEqual({ num: '4', suffix: 'TH' });
    expect(rankLabel(11)).toEqual({ num: '11', suffix: 'TH' });
  });
  test('long names shrink so they fit on one line', () => {
    expect(nameFontScale('Daniel Mina')).toBe(0.085);
    const long = nameFontScale('Filopateer Ayman');
    expect(long).toBeLessThan(0.085);
    // Barlow Condensed bold caps ≈ 0.5em per char; must fit in 90% of width.
    expect('Filopateer Ayman'.length * long * 0.5).toBeLessThanOrEqual(0.9);
    const huge = 'Abanoub Mina Fawzy Abdelmalak';
    expect(huge.length * nameFontScale(huge) * 0.5).toBeLessThanOrEqual(0.9);
  });
});
```
Run: `npm test` → Expected: FAIL, cannot resolve `./card`.

- [ ] **Step 4: Implement card helpers**

`src/lib/card.ts`:
```ts
import type { StatKey } from './scoring';

export interface CardData {
  name: string;
  photoUrl: string | null;
  flag: string;
  club: string;
  tier: number;
  stats: Record<StatKey, number>;
  active: boolean;
}

export function templateForTier(tier: number): string {
  return tier <= 1 ? '0.9' : String(tier - 1);
}

export function isLightTier(tier: number): boolean {
  return tier >= 9;
}

export function rankLabel(tier: number): { num: string; suffix: string } {
  const suffix = tier === 1 ? 'ST' : tier === 2 ? 'ND' : tier === 3 ? 'RD' : 'TH';
  return { num: String(tier), suffix };
}

const BASE_SCALE = 0.085;
const MAX_CHARS_AT_BASE = 13;

export function nameFontScale(name: string): number {
  const len = name.trim().length;
  if (len <= MAX_CHARS_AT_BASE) return BASE_SCALE;
  return Math.max(0.03, (BASE_SCALE * MAX_CHARS_AT_BASE) / len);
}
```
Check: `13 × 0.085 × 0.5 = 0.55 ≤ 0.9`, long names scale proportionally, so the test bound holds.

Run: `npm test` → Expected: PASS.

- [ ] **Step 5: Flags and clubs lists**

`src/lib/flags.ts`:
```ts
export const FLAGS = [
  { code: 'EG', name: 'Egypt' }, { code: 'AR', name: 'Argentina' }, { code: 'BR', name: 'Brazil' },
  { code: 'PT', name: 'Portugal' }, { code: 'ES', name: 'Spain' }, { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' }, { code: 'IT', name: 'Italy' }, { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' }, { code: 'HR', name: 'Croatia' }, { code: 'MA', name: 'Morocco' },
  { code: 'SN', name: 'Senegal' }, { code: 'NG', name: 'Nigeria' }, { code: 'UY', name: 'Uruguay' },
  { code: 'CO', name: 'Colombia' }, { code: 'US', name: 'USA' }, { code: 'JP', name: 'Japan' },
  { code: 'SA', name: 'Saudi Arabia' },
] as const;
export type FlagCode = (typeof FLAGS)[number]['code'];
```

`src/lib/clubs.ts`:
```ts
export interface Club { slug: string; name: string; short: string; colors: [string, string] }

// Crests are drawn as a simple shield in club colours (no official logos).
export const CLUBS: Club[] = [
  { slug: 'st-timothy', name: 'St. Timothy', short: 'STM', colors: ['#c9a227', '#14213d'] },
  { slug: 'al-ahly', name: 'Al Ahly', short: 'AHL', colors: ['#c8102e', '#ffffff'] },
  { slug: 'zamalek', name: 'Zamalek', short: 'ZSC', colors: ['#ffffff', '#c8102e'] },
  { slug: 'pyramids', name: 'Pyramids', short: 'PYR', colors: ['#0b2545', '#5fa8d3'] },
  { slug: 'barcelona', name: 'Barcelona', short: 'FCB', colors: ['#004d98', '#a50044'] },
  { slug: 'real-madrid', name: 'Real Madrid', short: 'RMA', colors: ['#ffffff', '#febe10'] },
  { slug: 'liverpool', name: 'Liverpool', short: 'LIV', colors: ['#c8102e', '#00b2a9'] },
  { slug: 'man-city', name: 'Man City', short: 'MCI', colors: ['#6cabdd', '#1c2c5b'] },
  { slug: 'man-united', name: 'Man United', short: 'MUN', colors: ['#da291c', '#000000'] },
  { slug: 'chelsea', name: 'Chelsea', short: 'CHE', colors: ['#034694', '#ffffff'] },
  { slug: 'arsenal', name: 'Arsenal', short: 'ARS', colors: ['#ef0107', '#ffffff'] },
  { slug: 'bayern', name: 'Bayern', short: 'BAY', colors: ['#dc052d', '#0066b2'] },
  { slug: 'psg', name: 'PSG', short: 'PSG', colors: ['#004170', '#da291c'] },
  { slug: 'juventus', name: 'Juventus', short: 'JUV', colors: ['#000000', '#ffffff'] },
  { slug: 'inter-miami', name: 'Inter Miami', short: 'MIA', colors: ['#f7b5cd', '#231f20'] },
  { slug: 'al-nassr', name: 'Al Nassr', short: 'NSR', colors: ['#fcd116', '#003da5'] },
];

export function clubBySlug(slug: string): Club {
  return CLUBS.find((c) => c.slug === slug) ?? CLUBS[0];
}
```

- [ ] **Step 6: Flag and ClubCrest components**

`src/components/Flag.tsx`:
```tsx
import { AR, BE, BR, CO, DE, EG, ES, FR, HR, IT, JP, MA, NG, NL, PT, SA, SN, US, UY } from 'country-flag-icons/react/3x2';
import type { ComponentType, SVGProps } from 'react';

const COMPONENTS: Record<string, ComponentType<SVGProps<SVGSVGElement> & { title?: string }>> = {
  AR, BE, BR, CO, DE, EG, ES, FR, HR, IT, JP, MA, NG, NL, PT, SA, SN, US, UY,
};

export function Flag({ code }: { code: string }) {
  const Svg = COMPONENTS[code] ?? EG;
  return <Svg title={code} className="block h-auto w-full shadow" />;
}
```

`src/components/ClubCrest.tsx`:
```tsx
import { clubBySlug } from '@/lib/clubs';

export function ClubCrest({ club }: { club: string }) {
  const c = clubBySlug(club);
  const id = `crest-${c.slug}`;
  return (
    <svg viewBox="0 0 40 46" className="block h-auto w-full drop-shadow" aria-label={c.name}>
      <defs>
        <clipPath id={id}>
          <path d="M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="40" height="46" fill={c.colors[0]} />
        <rect x="14" width="12" height="46" fill={c.colors[1]} />
      </g>
      <path d="M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z" fill="none" stroke="#d4af37" strokeWidth="2" />
      <text x="20" y="27" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="0.6" paintOrder="stroke">
        {c.short}
      </text>
    </svg>
  );
}
```

- [ ] **Step 7: Font and theme**

`src/app/layout.tsx` (replace generated file):
```tsx
import type { Metadata } from 'next';
import { Barlow_Condensed } from 'next/font/google';
import './globals.css';

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-barlow' });

export const metadata: Metadata = { title: 'St. Timothy Cards', description: 'St. Timothy Sunday School football cards' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={barlow.variable}>
      <body className="min-h-dvh bg-pitch text-white antialiased">{children}</body>
    </html>
  );
}
```
`src/app/globals.css` (replace generated file):
```css
@import "tailwindcss";

@theme {
  --color-pitch: #0d2b2f;
  --color-pitch-light: #164047;
  --color-gold: #d4af37;
  --font-card: var(--font-barlow), "Arial Narrow", sans-serif;
}

@media print {
  body { background: #fff; color: #000; }
}
```

- [ ] **Step 8: PlayerCard**

Overlay positions are percentages of the 182×257 template, measured from the source images: horizontal divider at 63.4%, short flag dashes at 30% and 39.5%, vertical divider centred.

`src/components/PlayerCard.tsx`:
```tsx
import { ClubCrest } from './ClubCrest';
import { Flag } from './Flag';
import { isLightTier, nameFontScale, rankLabel, templateForTier, type CardData } from '@/lib/card';
import type { StatKey } from '@/lib/scoring';

const LEFT: StatKey[] = ['SSK', 'RIB', 'PRA'];
const RIGHT: StatKey[] = ['CHA', 'SSA', 'BEH'];
const ROW_TOPS = ['67.5%', '74%', '80.5%'];

export function PlayerCard({ data, width = 340, hideStats = false }: { data: CardData; width?: number; hideStats?: boolean }) {
  const height = (width * 257) / 182;
  const ink = isLightTier(data.tier) ? '#3a2a12' : '#ffffff';
  const { num, suffix } = rankLabel(data.tier);
  const px = (fraction: number) => `${fraction * width}px`;

  const statColumn = (keys: StatKey[], left: string) =>
    keys.map((k, i) => (
      <div key={k} className="absolute flex items-baseline justify-center gap-[0.35em]" style={{ left, top: ROW_TOPS[i], width: '36%' }}>
        <span data-testid={`stat-${k}`} style={{ fontSize: px(0.072), fontWeight: 700 }}>{data.stats[k]}</span>
        <span style={{ fontSize: px(0.062), fontWeight: 500 }}>{k}</span>
      </div>
    ));

  return (
    <div className="relative select-none font-card leading-none" style={{ width, height, color: ink }}>
      <img src={`/templates/${templateForTier(data.tier)}.png`} alt="" className="absolute inset-0 h-full w-full" />

      {data.photoUrl ? (
        <img
          src={data.photoUrl}
          alt={data.name}
          crossOrigin="anonymous"
          className="absolute object-cover object-top"
          style={{
            left: '30%', top: '7%', width: '62%', height: '50%',
            maskImage: 'linear-gradient(to bottom, black 75%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent)',
          }}
        />
      ) : (
        <svg viewBox="0 0 100 100" className="absolute opacity-40" style={{ left: '38%', top: '14%', width: '46%' }} aria-hidden>
          <circle cx="50" cy="35" r="20" fill={ink} />
          <path d="M10 100 C10 65 90 65 90 100 Z" fill={ink} />
        </svg>
      )}

      <div className="absolute text-center" style={{ left: '10%', top: '12%', width: '24%' }}>
        <div style={{ fontSize: px(0.16), fontWeight: 700 }}>{num}</div>
        <div style={{ fontSize: px(0.06), fontWeight: 500, marginTop: px(0.01) }}>{suffix}</div>
      </div>
      <div className="absolute" style={{ left: '14%', top: '31.6%', width: '16%' }}>
        <Flag code={data.flag} />
      </div>
      <div className="absolute" style={{ left: '14%', top: '42%', width: '16%' }}>
        <ClubCrest club={data.club} />
      </div>

      <div className="absolute w-full whitespace-nowrap text-center uppercase" style={{ top: '55.5%', fontSize: px(nameFontScale(data.name)), fontWeight: 700 }}>
        {data.name}
      </div>

      {!hideStats && (
        <>
          {statColumn(LEFT, '12%')}
          {statColumn(RIGHT, '52%')}
        </>
      )}

      {!data.active && (
        <div className="absolute left-0 right-0 bg-black/70 py-1 text-center font-bold uppercase tracking-widest text-white" style={{ top: '45%', fontSize: px(0.07) }}>
          Retired
        </div>
      )}
    </div>
  );
}
```

`src/components/DownloadCardButton.tsx`:
```tsx
'use client';
import { toPng } from 'html-to-image';
import { useState } from 'react';

export function DownloadCardButton({ targetId, fileName }: { targetId: string; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    const node = document.getElementById(targetId);
    if (!node) return;
    setBusy(true);
    setError(null);
    try {
      const url = await toPng(node, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch {
      setError('Could not create the image. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={download} disabled={busy} className="rounded-full bg-gold px-6 py-3 font-card text-lg font-bold uppercase text-pitch disabled:opacity-60">
        {busy ? 'Preparing…' : 'Download card'}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 9: Dev gallery page to check all 11 tiers visually**

`src/app/dev/cards/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { PlayerCard } from '@/components/PlayerCard';

export default function DevCards() {
  if (process.env.NODE_ENV === 'production') notFound();
  const names = ['Daniel Mina', 'Filopateer Ayman', 'George Raafat', 'Kerolos Emad'];
  return (
    <main className="flex flex-wrap gap-6 p-6">
      {Array.from({ length: 11 }, (_, i) => i + 1).map((tier) => (
        <PlayerCard
          key={tier}
          width={240}
          data={{
            name: names[tier % names.length], photoUrl: null, flag: tier % 2 ? 'EG' : 'AR',
            club: tier % 2 ? 'st-timothy' : 'barcelona', tier, active: tier !== 11,
            stats: { SSK: 0, RIB: 45, PRA: 66, CHA: 80, SSA: 99, BEH: 74 },
          }}
        />
      ))}
    </main>
  );
}
```

- [ ] **Step 10: Visual check**

Run `npm run dev`, open `http://localhost:3000/dev/cards` (Playwright MCP screenshot or browser). Expected: 11 cards, transparent corners on the dark background, rank number + flag + crest in the top-left between the template's dash lines, name sitting just above the horizontal line, stat rows either side of the vertical line, dark text on tiers 9–11, "Retired" ribbon on tier 11. Adjust the percentages in `PlayerCard.tsx` if anything overlaps the template lines, then re-check. Also compare against `Players badges/1.Daniel Mina.png`.

Run: `npm test && npm run build` → Expected: PASS, build OK.

- [ ] **Step 11: Commit**

```bash
git add scripts/prepare_templates.py public/templates src/lib/card.ts src/lib/card.test.ts src/lib/flags.ts src/lib/clubs.ts src/components src/app/layout.tsx src/app/globals.css src/app/dev
git commit -m "feat: player card component with tier templates"
```

---

### Task 4: Supabase schema, clients, and data loading

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_seed_kids.sql`, `.env.example`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/admin.ts`, `src/lib/supabase/proxy.ts`, `src/proxy.ts`, `src/lib/fetch-all.ts`, `src/lib/fetch-all.test.ts`, `src/lib/data.ts`, `scripts/create-admin.mjs`

**Interfaces:**
- Consumes: `computeClass`, `Activity`, `KidResult` (Task 2); `CardData` (Task 3).
- Produces:
```ts
// src/lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient>;     // cookie session, RLS applies
// src/lib/supabase/client.ts
export function createClient(): SupabaseClient;                    // browser
// src/lib/supabase/admin.ts (server-only)
export function createAdminClient(): SupabaseClient;               // service role, bypasses RLS
// src/lib/fetch-all.ts
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, pageSize?: number): Promise<T[]>;
// src/lib/data.ts (server-only)
export interface KidRow { id: string; name: string; public_code: string; photo_url: string | null; flag: string; club: string; ssk: number | null; joined_on: string; active: boolean }
export interface SettingsRow { season_start: string; tier_count: number; leaderboard_public: boolean }
export interface ClassSnapshot { kids: KidRow[]; activities: Activity[]; results: Map<string, KidResult>; settings: SettingsRow }
export async function loadClassSnapshot(): Promise<ClassSnapshot>;
export function toCardData(kid: KidRow, result: KidResult, tierCount?: number): CardData; // inactive kids (tier null) render with tierCount
export async function getCardByCode(code: string): Promise<CardData | null>;
```

- [ ] **Step 1: USER ACTION — create the Supabase project**

Ask the user to:
1. Create a free project at https://supabase.com (region close to Egypt, e.g. Frankfurt). Save the database password.
2. From *Project Settings → API Keys* copy the Project URL, the publishable (anon) key and the secret (service_role) key.
3. Create `.env.local` in the repo root:
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable or anon key>
SUPABASE_SERVICE_ROLE_KEY=<secret or service_role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Wait for confirmation before continuing. Never print the secret key.

Create `.env.example` with the same four names and empty values.

- [ ] **Step 2: Schema migration**

`supabase/migrations/0001_init.sql`:
```sql
create extension if not exists pgcrypto;

create or replace function public.random_code() returns text
language sql volatile as $$
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 8)
$$;

create table public.settings (
  id int primary key default 1 check (id = 1),
  season_start date not null default date '2026-10-01',
  tier_count int not null default 11 check (tier_count between 1 and 11),
  leaderboard_public boolean not null default true
);
insert into public.settings (id) values (1);

create table public.activities (
  key text primary key,
  name text not null,
  points int not null check (points >= 0),
  stat text not null check (stat in ('CHA', 'SSA', 'PRA', 'RIB', 'BEH')),
  sort int not null default 0
);
insert into public.activities (key, name, points, stat, sort) values
  ('odas', 'Odas', 150, 'CHA', 1),
  ('fasl', 'Fasl', 100, 'SSA', 2),
  ('nota', 'Nota Ro7eya', 100, 'PRA', 3),
  ('tasbeha', 'Tasbe7a', 50, 'PRA', 4),
  ('dars', 'Dars Ketab', 50, 'RIB', 5),
  ('discipline', 'Discipline', 200, 'BEH', 6);

create table public.kids (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  public_code text not null unique default public.random_code(),
  photo_url text,
  flag text not null default 'EG',
  club text not null default 'st-timothy',
  ssk int check (ssk between 0 and 99),
  joined_on date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  activity_key text not null references public.activities(key) on update cascade,
  date date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (kid_id, activity_key, date)
);

create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  points int not null check (points <> 0),
  reason text not null check (length(trim(reason)) > 0),
  date date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'teacher' check (role in ('teacher', 'admin'))
);

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where user_id = auth.uid())
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where user_id = auth.uid() and role = 'admin')
$$;

alter table public.settings enable row level security;
alter table public.activities enable row level security;
alter table public.kids enable row level security;
alter table public.entries enable row level security;
alter table public.adjustments enable row level security;
alter table public.teachers enable row level security;

-- No anon policies: public pages read through the server-side service-role client.
create policy "teachers read settings" on public.settings for select to authenticated using (public.is_teacher());
create policy "admins update settings" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "teachers read activities" on public.activities for select to authenticated using (public.is_teacher());
create policy "admins update activities" on public.activities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "teachers manage kids" on public.kids for all to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "teachers read entries" on public.entries for select to authenticated using (public.is_teacher());
create policy "teachers add entries" on public.entries for insert to authenticated with check (public.is_teacher());
create policy "teachers delete entries" on public.entries for delete to authenticated using (public.is_teacher());
create policy "teachers read adjustments" on public.adjustments for select to authenticated using (public.is_teacher());
create policy "teachers add adjustments" on public.adjustments for insert to authenticated with check (public.is_teacher());
create policy "teachers delete adjustments" on public.adjustments for delete to authenticated using (public.is_teacher());
create policy "teachers read teachers" on public.teachers for select to authenticated using (public.is_teacher());

insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
create policy "teachers upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_teacher());
```

`supabase/migrations/0002_seed_kids.sql`:
```sql
insert into public.kids (name, joined_on) values
  ('Efraim Remon', '2026-10-01'), ('George Raafat', '2026-10-01'), ('Daniel Samy', '2026-10-01'),
  ('Seif Sherif', '2026-10-01'), ('Carlos John', '2026-10-01'), ('Oliver Mofeed', '2026-10-01'),
  ('Steven Mina', '2026-10-01'), ('Rojer George', '2026-10-01'), ('Paula Tarek', '2026-10-01'),
  ('David Eissa', '2026-10-01'), ('Kevin Ossama', '2026-10-01'), ('Freddy Maged', '2026-10-01'),
  ('George Ayman', '2026-10-01'), ('David George', '2026-10-01'), ('Filopateer Mina', '2026-10-01'),
  ('Thomas Sameh', '2026-10-01'), ('Kerolos Emad', '2026-10-01'), ('Patrick Nabil', '2026-10-01'),
  ('Filopateer Ayman', '2026-10-01'), ('Justin Remon', '2026-10-01'), ('Kareem Joseph', '2026-10-01'),
  ('Mina Hesham', '2026-10-01'), ('Youssef Medhat', '2026-10-01'), ('Andrew Amgad', '2026-10-01'),
  ('Johnny Sameh', '2026-10-01'), ('Selim Ibrahim', '2026-10-01'), ('Youssef Hany', '2026-10-01'),
  ('Jerome Maged', '2026-10-01'), ('Johnny Mina', '2026-10-01'), ('Matthew Adel', '2026-10-01'),
  ('Pierre George', '2026-10-01');
```
(“Justin remon” from the sheet is capitalised as “Justin Remon”.)

- [ ] **Step 3: USER ACTION — apply migrations**

Ask the user to run (interactive login):
```
! npx supabase login
```
Then run:
```bash
npx supabase init --force   # creates supabase/config.toml; keeps existing migrations folder
npx supabase link --project-ref <ref>      # prompts for DB password — user runs with "!" prefix
npx supabase db push
```
Expected: `Applying migration 0001_init.sql... 0002_seed_kids.sql... Finished`.
Verify: `npx supabase db query "select count(*) from kids"` is not available on all CLI versions — instead verify in Step 8's script output.

- [ ] **Step 4: Supabase clients**

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  });
}
```
`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
```
`src/lib/supabase/admin.ts`:
```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```
`src/lib/supabase/proxy.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}
```
`src/proxy.ts`:
```ts
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only teacher pages and login need session refresh; public cards stay fast.
  matcher: ['/log/:path*', '/adjust/:path*', '/kids/:path*', '/history/:path*', '/settings/:path*', '/login'],
};
```

- [ ] **Step 5: Failing test for paginated reads**

`src/lib/fetch-all.test.ts`:
```ts
import { expect, test } from 'vitest';
import { fetchAll } from './fetch-all';

test('fetchAll pages past the 1000-row cap', async () => {
  const rows = Array.from({ length: 2345 }, (_, i) => i);
  const calls: [number, number][] = [];
  const result = await fetchAll<number>(async (from, to) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  }, 1000);
  expect(result).toHaveLength(2345);
  expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
});

test('fetchAll throws on error', async () => {
  await expect(fetchAll(async () => ({ data: null, error: { message: 'boom' } }))).rejects.toThrow('boom');
});
```
Run: `npm test` → Expected: FAIL, cannot resolve `./fetch-all`.

- [ ] **Step 6: Implement fetchAll**

`src/lib/fetch-all.ts`:
```ts
type Page<T> = { data: T[] | null; error: { message: string } | null };

export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<Page<T>>, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) return out;
  }
}
```
Run: `npm test` → Expected: PASS.

- [ ] **Step 7: Data loading**

`src/lib/data.ts`:
```ts
import 'server-only';
import type { CardData } from './card';
import { fetchAll } from './fetch-all';
import { computeClass, type Activity, type KidResult } from './scoring';
import { createAdminClient } from './supabase/admin';

export interface KidRow {
  id: string; name: string; public_code: string; photo_url: string | null; flag: string;
  club: string; ssk: number | null; joined_on: string; active: boolean;
}
export interface SettingsRow { season_start: string; tier_count: number; leaderboard_public: boolean }
export interface ClassSnapshot { kids: KidRow[]; activities: Activity[]; results: Map<string, KidResult>; settings: SettingsRow }

const KID_COLUMNS = 'id, name, public_code, photo_url, flag, club, ssk, joined_on, active';

export async function loadClassSnapshot(): Promise<ClassSnapshot> {
  const db = createAdminClient();
  const [kids, activities, entries, adjustments, settingsRes] = await Promise.all([
    fetchAll<KidRow>((f, t) => db.from('kids').select(KID_COLUMNS).order('name').range(f, t)),
    fetchAll<Activity>((f, t) => db.from('activities').select('key, name, points, stat').order('sort').range(f, t)),
    fetchAll<{ kid_id: string; activity_key: string; date: string }>((f, t) =>
      db.from('entries').select('kid_id, activity_key, date').order('id').range(f, t)),
    fetchAll<{ kid_id: string; points: number; date: string }>((f, t) =>
      db.from('adjustments').select('kid_id, points, date').order('id').range(f, t)),
    db.from('settings').select('season_start, tier_count, leaderboard_public').eq('id', 1).single(),
  ]);
  if (settingsRes.error) throw new Error(settingsRes.error.message);
  const settings = settingsRes.data as SettingsRow;

  const results = computeClass({
    kids: kids.map((k) => ({ id: k.id, joinedOn: k.joined_on, active: k.active, ssk: k.ssk })),
    activities,
    entries: entries.map((e) => ({ kidId: e.kid_id, activityKey: e.activity_key, date: e.date })),
    adjustments: adjustments.map((a) => ({ kidId: a.kid_id, points: a.points, date: a.date })),
    tierCount: settings.tier_count,
  });
  return { kids, activities, results, settings };
}

export function toCardData(kid: KidRow, result: KidResult, tierCount = 11): CardData {
  return {
    name: kid.name, photoUrl: kid.photo_url, flag: kid.flag, club: kid.club,
    tier: result.tier ?? tierCount, stats: result.stats, active: kid.active,
  };
}

export async function getCardByCode(code: string): Promise<CardData | null> {
  if (!/^[a-z0-9]{8}$/.test(code)) return null;
  const snap = await loadClassSnapshot();
  const kid = snap.kids.find((k) => k.public_code === code);
  if (!kid) return null;
  return toCardData(kid, snap.results.get(kid.id)!, snap.settings.tier_count);
}
```

- [ ] **Step 8: Admin bootstrap script**

`scripts/create-admin.mjs`:
```js
// Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> <name...>
import { createClient } from '@supabase/supabase-js';

const [email, password, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ');
if (!email || !password || password.length < 8 || !name) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password(8+)> <name>');
  process.exit(1);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) { console.error(error.message); process.exit(1); }
const { error: tErr } = await db.from('teachers').upsert({ user_id: data.user.id, name, role: 'admin' });
if (tErr) { console.error(tErr.message); process.exit(1); }
const { count } = await db.from('kids').select('*', { count: 'exact', head: true });
console.log(`Admin ${email} created. Kids in database: ${count}`);
```
USER ACTION: ask the user to run it with their own password (so it never appears in the transcript):
```
! node --env-file=.env.local scripts/create-admin.mjs <their-email> <their-password> "<their name>"
```
Expected: `Admin … created. Kids in database: 31`.

- [ ] **Step 9: Verify and commit**

Run: `npm test && npm run build` → Expected: PASS.
```bash
git add supabase .env.example src/lib/supabase src/proxy.ts src/lib/fetch-all.ts src/lib/fetch-all.test.ts src/lib/data.ts scripts/create-admin.mjs
git status --short | grep -E "\.env\.local|xlsx" && echo "STOP: secret or xlsx staged" || true
git commit -m "feat: Supabase schema, RLS, clients and class snapshot loader"
```

---

### Task 5: Public card and leaderboard pages

**Files:**
- Create: `src/app/card/[code]/page.tsx`, `src/app/card/[code]/not-found.tsx`, `src/app/leaderboard/page.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getCardByCode`, `loadClassSnapshot`, `toCardData` (Task 4); `PlayerCard`, `DownloadCardButton` (Task 3).

- [ ] **Step 1: Card page**

`src/app/card/[code]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DownloadCardButton } from '@/components/DownloadCardButton';
import { PlayerCard } from '@/components/PlayerCard';
import { getCardByCode } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCardByCode((await params).code);
  return { title: card ? `${card.name} · St. Timothy` : 'Card not found' };
}

export default async function CardPage({ params }: Props) {
  const { code } = await params;
  const card = await getCardByCode(code);
  if (!card) notFound();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div id="card" className="p-2">
        <PlayerCard data={card} width={340} />
      </div>
      <DownloadCardButton targetId="card" fileName={`${card.name.replace(/\s+/g, '-')}-card.png`} />
    </main>
  );
}
```
`src/app/card/[code]/not-found.tsx`:
```tsx
export default function CardNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center font-card">
      <h1 className="text-4xl font-bold uppercase">Card not found</h1>
      <p className="text-white/70">This QR code doesn&apos;t match any player. Ask your teacher for a new one.</p>
    </main>
  );
}
```

- [ ] **Step 2: Leaderboard**

`src/app/leaderboard/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { PlayerCard } from '@/components/PlayerCard';
import { loadClassSnapshot, toCardData } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leaderboard · St. Timothy' };

export default async function Leaderboard() {
  const snap = await loadClassSnapshot();
  if (!snap.settings.leaderboard_public) notFound();
  const rows = snap.kids
    .filter((k) => k.active)
    .map((k) => ({ kid: k, result: snap.results.get(k.id)! }))
    .sort((a, b) => b.result.score - a.result.score || a.kid.name.localeCompare(b.kid.name));
  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-center font-card text-5xl font-bold uppercase text-gold">St. Timothy Squad</h1>
      <div className="flex flex-wrap justify-center gap-4">
        {rows.map(({ kid, result }) => (
          <PlayerCard key={kid.id} width={160} hideStats data={toCardData(kid, result, snap.settings.tier_count)} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Root redirect**

`src/app/page.tsx` (replace generated file):
```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/log');
}
```

- [ ] **Step 4: Verify against real data**

Run `npm run dev`. Get one code:
```bash
node --env-file=.env.local -e "const {createClient}=require('@supabase/supabase-js');createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY).from('kids').select('name,public_code').limit(1).then(r=>console.log(r.data))"
```
Open `/card/<code>` → Expected: bronze card (everyone has 0 points), all stats 0, kid's name. Open `/card/zzzzzzzz` → "Card not found". Open `/leaderboard` → 31 bronze cards without stats. Click "Download card" → a PNG downloads.

- [ ] **Step 5: Commit**

```bash
git add src/app/card src/app/leaderboard src/app/page.tsx
git commit -m "feat: public card and leaderboard pages"
```

---

### Task 6: Teacher login and protected layout

**Files:**
- Create: `src/lib/auth.ts`, `src/app/login/page.tsx`, `src/app/login/LoginForm.tsx`, `src/app/login/actions.ts`, `src/app/(teacher)/layout.tsx`, `src/app/(teacher)/actions.ts`, `src/components/ConfirmButton.tsx`

**Interfaces:**
- Consumes: `createClient` (server) from Task 4.
- Produces:
```ts
// src/lib/auth.ts
export interface Teacher { name: string; role: 'teacher' | 'admin' }
export async function requireTeacher(): Promise<{ supabase: SupabaseClient; userId: string; teacher: Teacher }>;
export async function requireAdmin(): Promise<{ supabase: SupabaseClient; userId: string; teacher: Teacher }>;
// src/components/ConfirmButton.tsx — two-tap confirm without browser dialogs
export function ConfirmButton(props: { action: () => Promise<void>; label: string; confirmLabel: string }): JSX.Element;
```

- [ ] **Step 1: Auth helpers**

`src/lib/auth.ts`:
```ts
import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export interface Teacher { name: string; role: 'teacher' | 'admin' }

export async function requireTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: teacher } = await supabase.from('teachers').select('name, role').eq('user_id', user.id).maybeSingle();
  if (!teacher) redirect('/login?error=not-teacher');
  return { supabase, userId: user.id, teacher: teacher as Teacher };
}

export async function requireAdmin() {
  const ctx = await requireTeacher();
  if (ctx.teacher.role !== 'admin') redirect('/log');
  return ctx;
}
```

- [ ] **Step 2: Login**

`src/app/login/actions.ts`:
```ts
'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return 'Enter your email and password.';
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return 'Wrong email or password.';
  redirect('/log');
}
```
`src/app/login/LoginForm.tsx`:
```tsx
'use client';
import { useActionState } from 'react';
import { signIn } from './actions';

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [error, action, pending] = useActionState(signIn, initialError);
  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <input name="email" type="email" autoComplete="email" placeholder="Email" required className="rounded-lg bg-white px-4 py-3 text-black" />
      <input name="password" type="password" autoComplete="current-password" placeholder="Password" required className="rounded-lg bg-white px-4 py-3 text-black" />
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-60">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
```
`src/app/login/page.tsx`:
```tsx
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const initial = error === 'not-teacher' ? 'This account is not a teacher. Ask the admin to add you.' : null;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="font-card text-4xl font-bold uppercase text-gold">Leaders Login</h1>
      <LoginForm initialError={initial} />
    </main>
  );
}
```

- [ ] **Step 3: Teacher layout, nav and sign-out**

`src/app/(teacher)/actions.ts`:
```ts
'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```
`src/app/(teacher)/layout.tsx`:
```tsx
import Link from 'next/link';
import { requireTeacher } from '@/lib/auth';
import { signOut } from './actions';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { teacher } = await requireTeacher();
  const links = [
    ['/log', 'Log'], ['/adjust', 'Bonus / Deduct'], ['/kids', 'Kids'], ['/history', 'History'],
    ...(teacher.role === 'admin' ? [['/settings', 'Settings']] : []),
  ];
  return (
    <div className="min-h-dvh bg-pitch">
      <nav className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 bg-pitch-light px-4 py-3 font-card text-lg uppercase print:hidden">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="hover:text-gold">{label}</Link>
        ))}
        <span className="ml-auto text-sm normal-case text-white/60">{teacher.name}</span>
        <form action={signOut}><button className="text-sm text-white/80 underline">Sign out</button></form>
      </nav>
      <div className="mx-auto max-w-3xl p-4 print:max-w-none print:p-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: ConfirmButton (used by History and Settings)**

`src/components/ConfirmButton.tsx`:
```tsx
'use client';
import { useState, useTransition } from 'react';

export function ConfirmButton({ action, label, confirmLabel }: { action: () => Promise<void>; label: string; confirmLabel: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  if (!armed) {
    return <button type="button" onClick={() => setArmed(true)} className="text-sm text-red-300 underline">{label}</button>;
  }
  return (
    <span className="flex gap-2">
      <button type="button" disabled={pending} onClick={() => start(action)} className="rounded bg-red-600 px-2 py-1 text-sm font-bold">
        {pending ? '…' : confirmLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="text-sm underline">Cancel</button>
    </span>
  );
}
```

- [ ] **Step 5: Placeholder log page so the redirect target exists**

`src/app/(teacher)/log/page.tsx`:
```tsx
export default function LogPage() {
  return <h1 className="font-card text-3xl font-bold uppercase">Log session</h1>;
}
```

- [ ] **Step 6: Verify**

`npm run dev`: visit `/log` logged out → redirected to `/login`. Wrong password → "Wrong email or password." Correct admin credentials → `/log` with nav incl. Settings. Sign out → `/login`.
Run: `npm run build` → OK.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/app/login "src/app/(teacher)" src/components/ConfirmButton.tsx
git commit -m "feat: teacher login and protected layout"
```

---

### Task 7: Log Session page

**Files:**
- Create: `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/lib/log-result.ts`, `src/lib/log-result.test.ts`, `src/app/(teacher)/log/actions.ts`, `src/app/(teacher)/log/LogForm.tsx`
- Modify: `src/app/(teacher)/log/page.tsx`

**Interfaces:**
- Consumes: `requireTeacher` (Task 6).
- Produces:
```ts
// src/lib/dates.ts
export function toLocalISODate(d: Date): string;                  // 'YYYY-MM-DD' in the device's timezone
export function isValidISODate(s: string): boolean;
export function isFutureDate(date: string, today: string): boolean;
// src/lib/log-result.ts
export function summarizeInsert(requested: number, inserted: number): { inserted: number; skipped: number; message: string };
// src/app/(teacher)/log/actions.ts
export async function getLoggedKidIds(activityKey: string, date: string): Promise<string[]>;
export type LogResult = { ok: true; message: string } | { ok: false; error: string };
export async function logSession(input: { activityKey: string; date: string; kidIds: string[] }): Promise<LogResult>;
```

- [ ] **Step 1: Failing tests**

`src/lib/dates.test.ts`:
```ts
import { expect, test } from 'vitest';
import { isFutureDate, isValidISODate, toLocalISODate } from './dates';

test('local date late in the evening stays on the same day', () => {
  expect(toLocalISODate(new Date(2026, 9, 4, 23, 30))).toBe('2026-10-04');
  expect(toLocalISODate(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05');
});
test('validates ISO dates', () => {
  expect(isValidISODate('2026-10-04')).toBe(true);
  expect(isValidISODate('2026-02-30')).toBe(false);
  expect(isValidISODate('04/10/2026')).toBe(false);
});
test('future dates', () => {
  expect(isFutureDate('2026-10-05', '2026-10-04')).toBe(true);
  expect(isFutureDate('2026-10-04', '2026-10-04')).toBe(false);
});
```
`src/lib/log-result.test.ts`:
```ts
import { expect, test } from 'vitest';
import { summarizeInsert } from './log-result';

test('all new', () => {
  expect(summarizeInsert(3, 3)).toEqual({ inserted: 3, skipped: 0, message: 'Saved 3 kids.' });
});
test('some already logged by another teacher', () => {
  expect(summarizeInsert(3, 1)).toEqual({ inserted: 1, skipped: 2, message: 'Saved 1 kid. 2 already logged.' });
});
test('everything already logged', () => {
  expect(summarizeInsert(2, 0).message).toBe('Nothing new — 2 already logged.');
});
```
Run: `npm test` → Expected: FAIL (modules missing).

- [ ] **Step 2: Implement**

`src/lib/dates.ts`:
```ts
const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isFutureDate(date: string, today: string): boolean {
  return date > today;
}
```
`src/lib/log-result.ts`:
```ts
const kids = (n: number) => `${n} kid${n === 1 ? '' : 's'}`;

export function summarizeInsert(requested: number, inserted: number) {
  const skipped = requested - inserted;
  const message =
    inserted === 0
      ? `Nothing new — ${skipped} already logged.`
      : `Saved ${kids(inserted)}.${skipped ? ` ${skipped} already logged.` : ''}`;
  return { inserted, skipped, message };
}
```
Run: `npm test` → Expected: PASS.

- [ ] **Step 3: Server actions**

`src/app/(teacher)/log/actions.ts`:
```ts
'use server';
import { requireTeacher } from '@/lib/auth';
import { isFutureDate, isValidISODate, toLocalISODate } from '@/lib/dates';
import { summarizeInsert } from '@/lib/log-result';

export async function getLoggedKidIds(activityKey: string, date: string): Promise<string[]> {
  if (!isValidISODate(date)) return [];
  const { supabase } = await requireTeacher();
  const { data } = await supabase.from('entries').select('kid_id').eq('activity_key', activityKey).eq('date', date);
  return (data ?? []).map((r) => r.kid_id);
}

export type LogResult = { ok: true; message: string } | { ok: false; error: string };

export async function logSession(input: { activityKey: string; date: string; kidIds: string[] }): Promise<LogResult> {
  const { supabase } = await requireTeacher();
  if (!isValidISODate(input.date)) return { ok: false, error: 'Pick a valid date.' };
  // Allow one day of slack: the server runs in UTC, teachers are in Egypt (UTC+2/+3).
  const tomorrow = toLocalISODate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  if (isFutureDate(input.date, tomorrow)) return { ok: false, error: 'You can’t log a future date.' };
  const kidIds = [...new Set(input.kidIds)];
  if (kidIds.length === 0) return { ok: false, error: 'Tick at least one kid.' };

  const rows = kidIds.map((kid_id) => ({ kid_id, activity_key: input.activityKey, date: input.date }));
  const { data, error } = await supabase
    .from('entries')
    .upsert(rows, { onConflict: 'kid_id,activity_key,date', ignoreDuplicates: true })
    .select('id');
  if (error) return { ok: false, error: 'Could not save. Check your connection and try again.' };
  return { ok: true, message: summarizeInsert(kidIds.length, data?.length ?? 0).message };
}
```

- [ ] **Step 4: LogForm and page**

`src/app/(teacher)/log/LogForm.tsx`:
```tsx
'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toLocalISODate } from '@/lib/dates';
import { getLoggedKidIds, logSession } from './actions';

type Kid = { id: string; name: string; photo_url: string | null };
type Activity = { key: string; name: string; points: number };

export function LogForm({ kids, activities }: { kids: Kid[]; activities: Activity[] }) {
  const [date, setDate] = useState(() => toLocalISODate(new Date()));
  const [activityKey, setActivityKey] = useState(activities[0]?.key ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getLoggedKidIds(activityKey, date).then((ids) => {
      if (!cancelled) setLogged(new Set(ids));
    });
    return () => { cancelled = true; };
  }, [activityKey, date]);

  const visible = useMemo(
    () => kids.filter((k) => k.name.toLowerCase().includes(query.trim().toLowerCase())),
    [kids, query],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(visible.filter((k) => !logged.has(k.id)).map((k) => k.id)));
  }

  function save() {
    start(async () => {
      const res = await logSession({ activityKey, date, kidIds: [...selected] });
      if (res.ok) {
        setStatus({ ok: true, text: res.message });
        setSelected(new Set());
        setLogged(new Set(await getLoggedKidIds(activityKey, date)));
      } else {
        setStatus({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="font-card text-3xl font-bold uppercase">Log session</h1>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg bg-white px-3 py-2 text-black" />
        </label>
        <label className="flex flex-col gap-1 text-sm">Activity
          <select aria-label="Activity" value={activityKey} onChange={(e) => setActivityKey(e.target.value)} className="rounded-lg bg-white px-3 py-2 text-black">
            {activities.map((a) => <option key={a.key} value={a.key}>{a.name} (+{a.points})</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name" className="flex-1 rounded-lg bg-white px-3 py-2 text-black" />
        <button type="button" onClick={selectAll} className="rounded-lg border border-white/30 px-3">Select all</button>
      </div>
      <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
        {visible.map((k) => {
          const isLogged = logged.has(k.id);
          return (
            <li key={k.id}>
              <label className={`flex items-center gap-3 px-3 py-3 ${isLogged ? 'opacity-60' : ''}`}>
                <input type="checkbox" className="h-6 w-6" checked={isLogged || selected.has(k.id)} disabled={isLogged} onChange={() => toggle(k.id)} aria-label={k.name} />
                {k.photo_url ? <img src={k.photo_url} alt="" className="h-9 w-9 rounded-full object-cover object-top" /> : <span className="h-9 w-9 rounded-full bg-white/10" />}
                <span className="flex-1">{k.name}</span>
                {isLogged && <span className="text-xs text-gold">✓ logged</span>}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="fixed inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-pitch/95 p-3">
        {status && <p role="status" className={status.ok ? 'text-green-300' : 'text-red-300'}>{status.text}</p>}
        <button type="button" onClick={save} disabled={pending || selected.size === 0} className="w-full max-w-3xl rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-50">
          {pending ? 'Saving…' : `Save ${selected.size} kid${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
```
`src/app/(teacher)/log/page.tsx` (replace placeholder):
```tsx
import { requireTeacher } from '@/lib/auth';
import { LogForm } from './LogForm';

export default async function LogPage() {
  const { supabase } = await requireTeacher();
  const [{ data: kids }, { data: activities }] = await Promise.all([
    supabase.from('kids').select('id, name, photo_url').eq('active', true).order('name'),
    supabase.from('activities').select('key, name, points').order('sort'),
  ]);
  return <LogForm kids={kids ?? []} activities={activities ?? []} />;
}
```

- [ ] **Step 5: Verify**

Run: `npm test` → PASS. In the browser: log Fasl for 2 kids today → "Saved 2 kids."; they show "✓ logged". Open one kid's `/card/<code>` → SSA 99, tier no longer bronze. Then delete those two entries in the Supabase dashboard (Table editor → entries) to keep data clean — History's undo arrives in Task 8.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts src/lib/log-result.ts src/lib/log-result.test.ts "src/app/(teacher)/log"
git commit -m "feat: log session page"
```

---

### Task 8: Bonus/Deduct and History with undo

**Files:**
- Create: `src/app/(teacher)/adjust/page.tsx`, `src/app/(teacher)/adjust/AdjustForm.tsx`, `src/app/(teacher)/adjust/actions.ts`, `src/app/(teacher)/history/page.tsx`, `src/app/(teacher)/history/actions.ts`

**Interfaces:**
- Consumes: `requireTeacher`, `ConfirmButton` (Task 6); `toLocalISODate`, `isValidISODate`, `isFutureDate` (Task 7).
- Produces:
```ts
export async function addAdjustment(prev: AdjustState, formData: FormData): Promise<AdjustState>; // AdjustState = { ok: boolean; message: string } | null
export async function deleteEntry(id: string): Promise<void>;
export async function deleteAdjustment(id: string): Promise<void>;
```

- [ ] **Step 1: Adjust action**

`src/app/(teacher)/adjust/actions.ts`:
```ts
'use server';
import { requireTeacher } from '@/lib/auth';
import { isFutureDate, isValidISODate, toLocalISODate } from '@/lib/dates';

export type AdjustState = { ok: boolean; message: string } | null;

export async function addAdjustment(_prev: AdjustState, formData: FormData): Promise<AdjustState> {
  const { supabase } = await requireTeacher();
  const kidId = String(formData.get('kid_id') ?? '');
  const kind = String(formData.get('kind') ?? 'bonus');
  const amount = Number(formData.get('points'));
  const reason = String(formData.get('reason') ?? '').trim();
  const date = String(formData.get('date') ?? '');

  if (!kidId) return { ok: false, message: 'Pick a kid.' };
  if (!Number.isInteger(amount) || amount < 1 || amount > 10000) return { ok: false, message: 'Points must be a whole number from 1 to 10000.' };
  if (!reason) return { ok: false, message: 'Write a short reason.' };
  const tomorrow = toLocalISODate(new Date(Date.now() + 86_400_000));
  if (!isValidISODate(date) || isFutureDate(date, tomorrow)) return { ok: false, message: 'Pick a valid date (not in the future).' };

  const points = kind === 'deduct' ? -amount : amount;
  const { error } = await supabase.from('adjustments').insert({ kid_id: kidId, points, reason, date });
  if (error) return { ok: false, message: 'Could not save. Try again.' };
  return { ok: true, message: `${kind === 'deduct' ? 'Deducted' : 'Added'} ${amount} points.` };
}
```

- [ ] **Step 2: Adjust form and page**

`src/app/(teacher)/adjust/AdjustForm.tsx`:
```tsx
'use client';
import { useActionState } from 'react';
import { toLocalISODate } from '@/lib/dates';
import { addAdjustment } from './actions';

const field = 'rounded-lg bg-white px-3 py-2 text-black';

export function AdjustForm({ kids }: { kids: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addAdjustment, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <h1 className="font-card text-3xl font-bold uppercase">Bonus / Deduct</h1>
      <select name="kid_id" required className={field} defaultValue="">
        <option value="" disabled>Choose kid…</option>
        {kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
      </select>
      <div className="flex gap-4">
        <label className="flex items-center gap-2"><input type="radio" name="kind" value="bonus" defaultChecked /> Bonus</label>
        <label className="flex items-center gap-2"><input type="radio" name="kind" value="deduct" /> Deduct</label>
      </div>
      <input name="points" type="number" min={1} max={10000} required placeholder="Points" className={field} />
      <input name="reason" required placeholder="Reason (e.g. helped clean the class)" className={field} />
      <input name="date" type="date" required defaultValue={toLocalISODate(new Date())} className={field} />
      {state && <p role="status" className={state.ok ? 'text-green-300' : 'text-red-300'}>{state.message}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-60">
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
```
`src/app/(teacher)/adjust/page.tsx`:
```tsx
import { requireTeacher } from '@/lib/auth';
import { AdjustForm } from './AdjustForm';

export default async function AdjustPage() {
  const { supabase } = await requireTeacher();
  const { data: kids } = await supabase.from('kids').select('id, name').eq('active', true).order('name');
  return <AdjustForm kids={kids ?? []} />;
}
```

- [ ] **Step 3: History actions**

`src/app/(teacher)/history/actions.ts`:
```ts
'use server';
import { revalidatePath } from 'next/cache';
import { requireTeacher } from '@/lib/auth';

export async function deleteEntry(id: string) {
  const { supabase } = await requireTeacher();
  await supabase.from('entries').delete().eq('id', id);
  revalidatePath('/history');
}

export async function deleteAdjustment(id: string) {
  const { supabase } = await requireTeacher();
  await supabase.from('adjustments').delete().eq('id', id);
  revalidatePath('/history');
}
```

- [ ] **Step 4: History page**

`src/app/(teacher)/history/page.tsx`:
```tsx
import { ConfirmButton } from '@/components/ConfirmButton';
import { requireTeacher } from '@/lib/auth';
import { deleteAdjustment, deleteEntry } from './actions';

type Row = { id: string; kind: 'entry' | 'adjustment'; date: string; createdAt: string; kid: string; what: string; points: number; by: string };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ kid?: string; activity?: string }> }) {
  const { kid, activity } = await searchParams;
  const { supabase } = await requireTeacher();

  let entriesQ = supabase.from('entries')
    .select('id, date, created_at, created_by, kids(name), activities(name, points)')
    .order('date', { ascending: false }).order('created_at', { ascending: false }).limit(300);
  if (kid) entriesQ = entriesQ.eq('kid_id', kid);
  if (activity) entriesQ = entriesQ.eq('activity_key', activity);

  let adjQ = supabase.from('adjustments')
    .select('id, date, created_at, created_by, points, reason, kids(name)')
    .order('date', { ascending: false }).order('created_at', { ascending: false }).limit(300);
  if (kid) adjQ = adjQ.eq('kid_id', kid);

  const [{ data: entries }, { data: adjustments }, { data: kids }, { data: activities }, { data: teachers }] = await Promise.all([
    entriesQ,
    activity ? Promise.resolve({ data: [] }) : adjQ,
    supabase.from('kids').select('id, name').order('name'),
    supabase.from('activities').select('key, name').order('sort'),
    supabase.from('teachers').select('user_id, name'),
  ]);
  const teacherName = new Map((teachers ?? []).map((t) => [t.user_id, t.name]));
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  const rows: Row[] = [
    ...(entries ?? []).map((e) => ({
      id: e.id, kind: 'entry' as const, date: e.date, createdAt: e.created_at,
      kid: one(e.kids)?.name ?? '?', what: one(e.activities)?.name ?? '?', points: one(e.activities)?.points ?? 0,
      by: teacherName.get(e.created_by) ?? '—',
    })),
    ...((adjustments ?? []) as { id: string; date: string; created_at: string; created_by: string; points: number; reason: string; kids: { name: string } | { name: string }[] | null }[]).map((a) => ({
      id: a.id, kind: 'adjustment' as const, date: a.date, createdAt: a.created_at,
      kid: one(a.kids)?.name ?? '?', what: `${a.points > 0 ? 'Bonus' : 'Deduction'}: ${a.reason}`, points: a.points,
      by: teacherName.get(a.created_by) ?? '—',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-card text-3xl font-bold uppercase">History</h1>
      <form className="flex flex-wrap gap-2 text-black">
        <select name="kid" defaultValue={kid ?? ''} className="rounded-lg bg-white px-3 py-2">
          <option value="">All kids</option>
          {(kids ?? []).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <select name="activity" defaultValue={activity ?? ''} className="rounded-lg bg-white px-3 py-2">
          <option value="">All activities + bonuses</option>
          {(activities ?? []).map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
        </select>
        <button className="rounded-lg bg-gold px-4 font-bold text-pitch">Filter</button>
      </form>
      {rows.length === 0 && <p className="text-white/60">Nothing logged yet.</p>}
      <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
        {rows.map((r) => (
          <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
            <span className="w-24 text-white/60">{r.date}</span>
            <span className="flex-1 font-semibold">{r.kid}</span>
            <span className="flex-1">{r.what}</span>
            <span className={r.points < 0 ? 'text-red-300' : 'text-green-300'}>{r.points > 0 ? '+' : ''}{r.points}</span>
            <span className="text-xs text-white/50">by {r.by}</span>
            <ConfirmButton
              label="Undo"
              confirmLabel="Confirm undo"
              action={r.kind === 'entry' ? deleteEntry.bind(null, r.id) : deleteAdjustment.bind(null, r.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Browser: add a +50 bonus and a −20 deduction for one kid → History shows both plus any entries; that kid's card BEH dropped by 5 if they had Discipline. Undo → Confirm undo → row disappears; card back to previous values. `npm run build` → OK.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(teacher)/adjust" "src/app/(teacher)/history"
git commit -m "feat: bonus/deduct and history with undo"
```

---

### Task 9: Kids management, photos and QR codes

**Files:**
- Create: `src/lib/kid-form.ts`, `src/lib/kid-form.test.ts`, `src/app/(teacher)/kids/page.tsx`, `src/app/(teacher)/kids/actions.ts`, `src/app/(teacher)/kids/KidForm.tsx`, `src/app/(teacher)/kids/PhotoUploader.tsx`, `src/app/(teacher)/kids/new/page.tsx`, `src/app/(teacher)/kids/[id]/page.tsx`, `src/app/(teacher)/kids/qr/page.tsx`, `src/lib/qr.ts`

**Interfaces:**
- Consumes: `requireTeacher` (Task 6); `loadClassSnapshot`, `toCardData`, `KidRow` (Task 4); `PlayerCard` (Task 3); `FLAGS`, `CLUBS` (Task 3); `createClient` browser (Task 4).
- Produces:
```ts
// src/lib/kid-form.ts
export interface KidFields { name: string; photo_url: string | null; flag: string; club: string; ssk: number | null; joined_on: string; active: boolean }
export function parseKidForm(fd: FormData): { ok: true; value: KidFields } | { ok: false; error: string };
// src/lib/qr.ts (server)
export function cardUrl(code: string): string;
export async function qrDataUrl(code: string): Promise<string>;
// actions
export async function saveKid(id: string | null, prev: string | null, fd: FormData): Promise<string | null>;
```

- [ ] **Step 1: Failing tests for form parsing**

`src/lib/kid-form.test.ts`:
```ts
import { expect, test } from 'vitest';
import { parseKidForm } from './kid-form';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}
const base = { name: ' Mina Hesham ', flag: 'EG', club: 'al-ahly', ssk: '', joined_on: '2026-10-01', active: 'on', photo_url: '' };

test('parses a valid kid with blank SSK as null', () => {
  expect(parseKidForm(fd(base))).toEqual({
    ok: true,
    value: { name: 'Mina Hesham', photo_url: null, flag: 'EG', club: 'al-ahly', ssk: null, joined_on: '2026-10-01', active: true },
  });
});
test('rejects empty name', () => {
  expect(parseKidForm(fd({ ...base, name: '  ' }))).toEqual({ ok: false, error: 'Name is required.' });
});
test('rejects SSK out of range', () => {
  expect(parseKidForm(fd({ ...base, ssk: '120' }))).toEqual({ ok: false, error: 'SSK must be 0–99.' });
});
test('unknown flag/club fall back to defaults; unchecked active is false', () => {
  const { active: _drop, ...rest } = base;
  const r = parseKidForm(fd({ ...rest, flag: 'XX', club: 'nope' }));
  expect(r.ok && r.value.flag).toBe('EG');
  expect(r.ok && r.value.club).toBe('st-timothy');
  expect(r.ok && r.value.active).toBe(false);
});
```
Run: `npm test` → Expected: FAIL.

- [ ] **Step 2: Implement parseKidForm**

`src/lib/kid-form.ts`:
```ts
import { CLUBS } from './clubs';
import { isValidISODate } from './dates';
import { FLAGS } from './flags';

export interface KidFields {
  name: string; photo_url: string | null; flag: string; club: string;
  ssk: number | null; joined_on: string; active: boolean;
}

export function parseKidForm(fd: FormData): { ok: true; value: KidFields } | { ok: false; error: string } {
  const name = String(fd.get('name') ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'Name is required.' };
  if (name.length > 40) return { ok: false, error: 'Name is too long (max 40).' };

  const sskRaw = String(fd.get('ssk') ?? '').trim();
  let ssk: number | null = null;
  if (sskRaw !== '') {
    ssk = Number(sskRaw);
    if (!Number.isInteger(ssk) || ssk < 0 || ssk > 99) return { ok: false, error: 'SSK must be 0–99.' };
  }

  const joined_on = String(fd.get('joined_on') ?? '');
  if (!isValidISODate(joined_on)) return { ok: false, error: 'Pick a valid join date.' };

  const flagRaw = String(fd.get('flag') ?? '');
  const clubRaw = String(fd.get('club') ?? '');
  const photo = String(fd.get('photo_url') ?? '').trim();

  return {
    ok: true,
    value: {
      name,
      photo_url: photo || null,
      flag: FLAGS.some((f) => f.code === flagRaw) ? flagRaw : 'EG',
      club: CLUBS.some((c) => c.slug === clubRaw) ? clubRaw : 'st-timothy',
      ssk,
      joined_on,
      active: fd.get('active') === 'on',
    },
  };
}
```
Run: `npm test` → Expected: PASS.

- [ ] **Step 3: QR helpers and kid actions**

`src/lib/qr.ts`:
```ts
import 'server-only';
import QRCode from 'qrcode';

export function cardUrl(code: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/card/${code}`;
}

export function qrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(cardUrl(code), { margin: 1, width: 300, errorCorrectionLevel: 'M' });
}
```
`src/app/(teacher)/kids/actions.ts`:
```ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireTeacher } from '@/lib/auth';
import { parseKidForm } from '@/lib/kid-form';

export async function saveKid(id: string | null, _prev: string | null, fd: FormData): Promise<string | null> {
  const { supabase } = await requireTeacher();
  const parsed = parseKidForm(fd);
  if (!parsed.ok) return parsed.error;
  const { error } = id
    ? await supabase.from('kids').update(parsed.value).eq('id', id)
    : await supabase.from('kids').insert(parsed.value);
  if (error) return 'Could not save. Try again.';
  revalidatePath('/kids');
  redirect('/kids');
}
```

- [ ] **Step 4: PhotoUploader (client: resize → background removal → upload)**

`src/app/(teacher)/kids/PhotoUploader.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

async function resize(file: File, max = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/png'));
}

export function PhotoUploader({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [original, setOriginal] = useState<Blob | null>(null);
  const [cutout, setCutout] = useState<Blob | null>(null);
  const [status, setStatus] = useState('');

  async function onFile(file: File | undefined) {
    if (!file) return;
    setCutout(null);
    setStatus('Resizing…');
    try {
      const small = await resize(file);
      setOriginal(small);
      setStatus('Removing background (first time can take ~30s)…');
      const { removeBackground } = await import('@imgly/background-removal');
      setCutout(await removeBackground(small));
      setStatus('Choose which photo to use.');
    } catch {
      setStatus('Background removal failed — you can use the original photo.');
    }
  }

  async function upload(blob: Blob) {
    setStatus('Uploading…');
    const path = `${crypto.randomUUID()}.png`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/png' });
    if (error) { setStatus('Upload failed. Try again.'); return; }
    setUrl(supabase.storage.from('photos').getPublicUrl(path).data.publicUrl);
    setOriginal(null);
    setCutout(null);
    setStatus('Photo ready — press Save to keep it.');
  }

  const preview = (b: Blob) => URL.createObjectURL(b);

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="photo_url" value={url} />
      {url && <img src={url} alt="Current photo" className="h-32 w-32 rounded-lg bg-white/10 object-cover object-top" />}
      <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      {(original || cutout) && (
        <div className="flex gap-3">
          {cutout && (
            <button type="button" onClick={() => upload(cutout)} className="flex flex-col items-center gap-1">
              <img src={preview(cutout)} alt="Cutout" className="h-32 w-32 rounded-lg bg-white/10 object-contain" />
              <span className="text-sm underline">Use cutout</span>
            </button>
          )}
          {original && (
            <button type="button" onClick={() => upload(original)} className="flex flex-col items-center gap-1">
              <img src={preview(original)} alt="Original" className="h-32 w-32 rounded-lg object-cover" />
              <span className="text-sm underline">Use original</span>
            </button>
          )}
        </div>
      )}
      {status && <p className="text-sm text-white/70">{status}</p>}
    </div>
  );
}
```

- [ ] **Step 5: KidForm**

`src/app/(teacher)/kids/KidForm.tsx`:
```tsx
'use client';
import { useActionState } from 'react';
import { CLUBS } from '@/lib/clubs';
import { FLAGS } from '@/lib/flags';
import type { KidFields } from '@/lib/kid-form';
import { saveKid } from './actions';
import { PhotoUploader } from './PhotoUploader';

const field = 'rounded-lg bg-white px-3 py-2 text-black';

export function KidForm({ id, initial }: { id: string | null; initial: KidFields }) {
  const [error, action, pending] = useActionState(saveKid.bind(null, id), null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">Name
        <input name="name" required defaultValue={initial.name} className={field} />
      </label>
      <PhotoUploader initialUrl={initial.photo_url} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">Country
          <select name="flag" defaultValue={initial.flag} className={field}>
            {FLAGS.map((f) => <option key={f.code} value={f.code}>{f.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">Club
          <select name="club" defaultValue={initial.club} className={field}>
            {CLUBS.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">SSK (Social Skills 0–99, blank = not rated)
          <input name="ssk" type="number" min={0} max={99} defaultValue={initial.ssk ?? ''} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm">Joined on
          <input name="joined_on" type="date" required defaultValue={initial.joined_on} className={field} />
        </label>
      </div>
      <label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={initial.active} /> Active in class</label>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-60">
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Kids list, new, edit pages**

`src/app/(teacher)/kids/page.tsx`:
```tsx
import Link from 'next/link';
import { requireTeacher } from '@/lib/auth';
import { rankLabel } from '@/lib/card';
import { loadClassSnapshot } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function KidsPage() {
  await requireTeacher();
  const snap = await loadClassSnapshot();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 font-card text-3xl font-bold uppercase">Kids</h1>
        <Link href="/kids/qr" className="rounded-lg border border-white/30 px-3 py-2">Print QR codes</Link>
        <Link href="/kids/new" className="rounded-lg bg-gold px-3 py-2 font-bold text-pitch">Add kid</Link>
      </div>
      <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
        {snap.kids.map((k) => {
          const r = snap.results.get(k.id)!;
          return (
            <li key={k.id}>
              <Link href={`/kids/${k.id}`} className={`flex items-center gap-3 px-3 py-2 ${k.active ? '' : 'opacity-50'}`}>
                {k.photo_url ? <img src={k.photo_url} alt="" className="h-10 w-10 rounded-full object-cover object-top" /> : <span className="h-10 w-10 rounded-full bg-white/10" />}
                <span className="flex-1">{k.name}{!k.active && ' (inactive)'}</span>
                <span className="text-sm text-white/70">{r.score} pts</span>
                {r.tier && <span className="w-12 text-right font-card text-gold">{rankLabel(r.tier).num}{rankLabel(r.tier).suffix}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```
`src/app/(teacher)/kids/new/page.tsx`:
```tsx
import { requireTeacher } from '@/lib/auth';
import { toLocalISODate } from '@/lib/dates';
import { KidForm } from '../KidForm';

export default async function NewKidPage() {
  await requireTeacher();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-card text-3xl font-bold uppercase">Add kid</h1>
      <KidForm id={null} initial={{ name: '', photo_url: null, flag: 'EG', club: 'st-timothy', ssk: null, joined_on: toLocalISODate(new Date()), active: true }} />
    </div>
  );
}
```
`src/app/(teacher)/kids/[id]/page.tsx`:
```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlayerCard } from '@/components/PlayerCard';
import { requireTeacher } from '@/lib/auth';
import { loadClassSnapshot, toCardData } from '@/lib/data';
import { cardUrl, qrDataUrl } from '@/lib/qr';
import { KidForm } from '../KidForm';

export const dynamic = 'force-dynamic';

export default async function EditKidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireTeacher();
  const snap = await loadClassSnapshot();
  const kid = snap.kids.find((k) => k.id === id);
  if (!kid) notFound();
  const qr = await qrDataUrl(kid.public_code);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-card text-3xl font-bold uppercase">{kid.name}</h1>
      <div className="flex flex-wrap items-start gap-6">
        <PlayerCard width={220} data={toCardData(kid, snap.results.get(kid.id)!, snap.settings.tier_count)} />
        <div className="flex flex-col items-center gap-2">
          <img src={qr} alt={`QR code for ${kid.name}`} className="h-40 w-40 rounded bg-white p-1" />
          <Link href={cardUrl(kid.public_code)} target="_blank" className="text-sm underline">Open public card</Link>
        </div>
      </div>
      <KidForm id={kid.id} initial={kid} />
    </div>
  );
}
```
(`KidRow` has extra fields `id`/`public_code`; `KidForm` only reads the `KidFields` ones — pass `initial={kid}` works because `KidRow` is a structural superset.)

- [ ] **Step 7: Printable QR sheet**

`src/app/(teacher)/kids/qr/page.tsx`:
```tsx
import { requireTeacher } from '@/lib/auth';
import { qrDataUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

export default async function QrSheet() {
  const { supabase } = await requireTeacher();
  const { data: kids } = await supabase.from('kids').select('id, name, public_code').eq('active', true).order('name');
  const items = await Promise.all((kids ?? []).map(async (k) => ({ ...k, qr: await qrDataUrl(k.public_code) })));
  const isLocal = (process.env.NEXT_PUBLIC_SITE_URL ?? '').includes('localhost');
  return (
    <div>
      {isLocal && (
        <p className="mb-4 rounded bg-yellow-200 p-3 text-black print:hidden">
          These QR codes point to localhost and won&apos;t open on phones. Set NEXT_PUBLIC_SITE_URL to the Vercel address before printing.
        </p>
      )}
      <p className="mb-4 print:hidden">Use your browser&apos;s Print (Ctrl+P) — 12 cards per A4 page.</p>
      <div className="grid grid-cols-3 gap-4 bg-white p-4 text-black print:gap-2 print:p-0">
        {items.map((k) => (
          <div key={k.id} className="flex break-inside-avoid flex-col items-center gap-1 rounded border border-gray-300 p-2">
            <img src={k.qr} alt="" className="h-36 w-36" />
            <span className="font-card text-lg font-bold uppercase">{k.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify**

`npm test` → PASS. Browser: add a test kid with a photo → cutout preview appears → "Use cutout" → Save → list shows photo; open kid → card shows the cutout, QR renders, "Open public card" works. Set SSK 80 → card SSK 80. Untick Active → card shows "Retired", kid disappears from `/log` and `/leaderboard`. `/kids/qr` → print preview shows a 3-column grid. Delete the test kid afterwards in the Supabase dashboard.

- [ ] **Step 9: Commit**

```bash
git add src/lib/kid-form.ts src/lib/kid-form.test.ts src/lib/qr.ts "src/app/(teacher)/kids"
git commit -m "feat: kids management with photo cutout and QR codes"
```

---

### Task 10: Admin settings and teacher accounts

**Files:**
- Create: `src/app/(teacher)/settings/page.tsx`, `src/app/(teacher)/settings/actions.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `ConfirmButton` (Task 6); `createAdminClient` (Task 4); `isValidISODate` (Task 7).
- Produces:
```ts
export async function saveSettings(fd: FormData): Promise<void>;
export async function createTeacher(fd: FormData): Promise<void>;
export async function removeTeacher(userId: string): Promise<void>;
```
Errors are returned via `redirect('/settings?msg=...')` so the page can show them without client state.

- [ ] **Step 1: Actions**

`src/app/(teacher)/settings/actions.ts`:
```ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isValidISODate } from '@/lib/dates';
import { createAdminClient } from '@/lib/supabase/admin';

const back = (msg: string) => redirect(`/settings?msg=${encodeURIComponent(msg)}`);

export async function saveSettings(fd: FormData) {
  const { supabase } = await requireAdmin();
  const tierCount = Number(fd.get('tier_count'));
  const seasonStart = String(fd.get('season_start') ?? '');
  if (!Number.isInteger(tierCount) || tierCount < 1 || tierCount > 11) back('Tiers must be 1–11.');
  if (!isValidISODate(seasonStart)) back('Pick a valid season start.');

  const { data: activities } = await supabase.from('activities').select('key');
  for (const a of activities ?? []) {
    const points = Number(fd.get(`points_${a.key}`));
    if (!Number.isInteger(points) || points < 0 || points > 10000) back('Points must be whole numbers 0–10000.');
    await supabase.from('activities').update({ points }).eq('key', a.key);
  }
  const { error } = await supabase.from('settings').update({
    tier_count: tierCount, season_start: seasonStart, leaderboard_public: fd.get('leaderboard_public') === 'on',
  }).eq('id', 1);
  revalidatePath('/settings');
  back(error ? 'Could not save settings.' : 'Settings saved.');
}

export async function createTeacher(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  const role = fd.get('role') === 'admin' ? 'admin' : 'teacher';
  if (!name || !email) back('Name and email are required.');
  if (password.length < 8) back('Temporary password must be at least 8 characters.');

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) back(`Could not create user: ${error?.message ?? 'unknown error'}`);
  const { error: tErr } = await admin.from('teachers').insert({ user_id: data.user!.id, name, role });
  revalidatePath('/settings');
  back(tErr ? 'User created but could not add as teacher.' : `${name} added. Share the email and temporary password with them.`);
}

export async function removeTeacher(userId: string) {
  const { userId: me } = await requireAdmin();
  if (userId === me) back('You cannot remove yourself.');
  await createAdminClient().from('teachers').delete().eq('user_id', userId);
  revalidatePath('/settings');
}
```

- [ ] **Step 2: Page**

`src/app/(teacher)/settings/page.tsx`:
```tsx
import { ConfirmButton } from '@/components/ConfirmButton';
import { requireAdmin } from '@/lib/auth';
import { createTeacher, removeTeacher, saveSettings } from './actions';

const field = 'rounded-lg bg-white px-3 py-2 text-black';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { supabase, userId } = await requireAdmin();
  const [{ data: settings }, { data: activities }, { data: teachers }] = await Promise.all([
    supabase.from('settings').select('season_start, tier_count, leaderboard_public').eq('id', 1).single(),
    supabase.from('activities').select('key, name, points, stat').order('sort'),
    supabase.from('teachers').select('user_id, name, role').order('name'),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-card text-3xl font-bold uppercase">Settings</h1>
      {msg && <p role="status" className="rounded bg-white/10 p-3">{msg}</p>}

      <form action={saveSettings} className="flex flex-col gap-3">
        <h2 className="font-card text-2xl uppercase text-gold">Points per activity</h2>
        {(activities ?? []).map((a) => (
          <label key={a.key} className="flex items-center gap-3">
            <span className="flex-1">{a.name} <span className="text-xs text-white/50">→ {a.stat}</span></span>
            <input name={`points_${a.key}`} type="number" min={0} max={10000} defaultValue={a.points} className={`${field} w-28`} />
          </label>
        ))}
        <h2 className="mt-4 font-card text-2xl uppercase text-gold">Season</h2>
        <label className="flex items-center gap-3"><span className="flex-1">Season start</span>
          <input name="season_start" type="date" defaultValue={settings?.season_start} className={field} />
        </label>
        <label className="flex items-center gap-3"><span className="flex-1">Number of card tiers (1–11)</span>
          <input name="tier_count" type="number" min={1} max={11} defaultValue={settings?.tier_count} className={`${field} w-28`} />
        </label>
        <label className="flex items-center gap-2">
          <input name="leaderboard_public" type="checkbox" defaultChecked={settings?.leaderboard_public} /> Public leaderboard
        </label>
        <button className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch">Save settings</button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="font-card text-2xl uppercase text-gold">Teachers</h2>
        <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
          {(teachers ?? []).map((t) => (
            <li key={t.user_id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1">{t.name}</span>
              <span className="text-xs uppercase text-white/60">{t.role}</span>
              {t.user_id !== userId && (
                <ConfirmButton label="Remove" confirmLabel="Confirm remove" action={removeTeacher.bind(null, t.user_id)} />
              )}
            </li>
          ))}
        </ul>
        <form action={createTeacher} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input name="name" required placeholder="Name" className={field} />
          <input name="email" type="email" required placeholder="Email" className={field} />
          <input name="password" type="text" required minLength={8} placeholder="Temporary password (8+)" className={field} />
          <select name="role" className={field} defaultValue="teacher">
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button className="rounded-lg bg-gold py-2 font-bold text-pitch sm:col-span-2">Add teacher</button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Browser as admin: change Fasl to 200 → save → "Settings saved."; a kid with one Fasl shows 200 pts on `/kids`; set back to 100. Set tiers to 8 → `/kids` ranks max 8TH. Untick public leaderboard → `/leaderboard` 404; re-tick. Add a teacher → log in as them in a private window → no Settings link, `/settings` redirects to `/log`. Remove them.
Run: `npm run build` → OK.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(teacher)/settings"
git commit -m "feat: admin settings and teacher accounts"
```

---

### Task 11: End-to-end test and README

**Files:**
- Create: `playwright.config.ts`, `e2e/flow.spec.ts`, `README.md`
- Modify: `.env.example` (add `E2E_EMAIL`, `E2E_PASSWORD`)

**Interfaces:**
- Consumes: the running app; `data-testid="stat-SSA"` from `PlayerCard`; History "Undo"/"Confirm undo" buttons; LogForm checkbox `aria-label={kid name}` and Activity select `aria-label="Activity"`.

- [ ] **Step 1: Playwright config**

`playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

try { process.loadEnvFile('.env.local'); } catch { /* CI provides env directly */ }

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000/login', reuseExistingServer: true, timeout: 120_000 },
});
```
Run `npx playwright install chromium`.

- [ ] **Step 2: E2E test**

`e2e/flow.spec.ts`:
```ts
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const kidName = `E2E Kid ${Date.now()}`;
let kid: { id: string; public_code: string };

test.beforeAll(async () => {
  const { data, error } = await db.from('kids').insert({ name: kidName, joined_on: '2020-01-01' }).select('id, public_code').single();
  if (error) throw error;
  kid = data;
});

test.afterAll(async () => {
  await db.from('kids').delete().eq('id', kid.id); // cascades entries
});

test('logging Fasl raises SSA on the public card and undo restores it', async ({ page }) => {
  await page.goto(`/card/${kid.public_code}`);
  await expect(page.getByTestId('stat-SSA')).toHaveText('0');

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(process.env.E2E_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/log');

  await page.getByLabel('Activity').selectOption('fasl');
  await page.getByPlaceholder('Search name').fill(kidName);
  await page.getByLabel(kidName).check();
  await page.getByRole('button', { name: /Save 1 kid/ }).click();
  await expect(page.getByRole('status')).toContainText('Saved 1 kid');

  await page.goto(`/card/${kid.public_code}`);
  await expect(page.getByTestId('stat-SSA')).not.toHaveText('0');

  await page.goto(`/history?kid=${kid.id}`);
  await page.getByRole('button', { name: 'Undo' }).first().click();
  await page.getByRole('button', { name: 'Confirm undo' }).click();
  await expect(page.getByText('Nothing logged yet.')).toBeVisible();

  await page.goto(`/card/${kid.public_code}`);
  await expect(page.getByTestId('stat-SSA')).toHaveText('0');
});
```
Add to `.env.example`: `E2E_EMAIL=` and `E2E_PASSWORD=`. USER ACTION: ask the user to add their admin email/password as `E2E_EMAIL`/`E2E_PASSWORD` in `.env.local`.

- [ ] **Step 3: Run it**

Run: `npm run e2e` → Expected: 1 passed. (It creates and deletes its own test kid; it never touches the 31 real kids.)

- [ ] **Step 4: README**

`README.md`:
```markdown
# St. Timothy Football Cards

Sunday School spiritual-growth tracker: every kid gets a FIFA-style card whose stats grow as teachers log
Odas, Fasl, Nota Ro7eya, Tasbe7a, Dars Ketab and Discipline. Each kid has a QR code that opens their card.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL/keys.
3. `npx supabase link --project-ref <ref>` then `npx supabase db push` (first time only).
4. Create the first admin: `node --env-file=.env.local scripts/create-admin.mjs <email> <password> <name>`
5. `npm run dev` → http://localhost:3000

Tests: `npm test` (unit) · `npm run e2e` (needs E2E_EMAIL/E2E_PASSWORD in .env.local)

## Deploy to Vercel
1. Push the repo to GitHub and import it in Vercel.
2. Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
   NEXT_PUBLIC_SITE_URL=https://<your-app>.vercel.app
3. Deploy, then print QR codes from **Kids → Print QR codes** (they use NEXT_PUBLIC_SITE_URL).

## How scoring works
- Stats (0–99) = attendance rate since the kid joined: CHA←Odas, SSA←Fasl, PRA←Nota Ro7eya+Tasbe7a,
  RIB←Dars Ketab, BEH←Discipline (−5 per deduction), SSK = manual teacher rating.
- Score = points of every activity + bonuses − deductions. Point values are editable in Settings.
- Kids are ranked by score into tiers (default 11): 1st = crystal card … 11th = bronze. Kids with 0 points are bronze.
```

- [ ] **Step 5: Final verification and commit**

Run: `npm test && npm run build && npm run e2e` → all PASS.
```bash
git add playwright.config.ts e2e README.md .env.example
git status --short | grep -E "\.env\.local|xlsx" && echo "STOP: secret or xlsx staged" || true
git commit -m "test: end-to-end log/undo flow; add README"
```
