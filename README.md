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
