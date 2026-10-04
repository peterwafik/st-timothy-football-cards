# First-time setup & go-live checklist

## Status (2026-10-04)
Done: Supabase project **st-timothy-cards** (ref `wpwaygmxtvrpjlovhmqa`, Frankfurt, free plan, org "St. Timothy")
created; keys + DB password in `.env.local`; migrations pushed (31 kids, 6 activities); test admin and test teacher
created (credentials in `.env.local`: `E2E_EMAIL` / `TEST_TEACHER_EMAIL`); sample scores added; `npm run e2e` passes.

Still to do: section 1 step 2 (turn off public sign-ups), clearing the sample data before real use, and section 3 (Vercel).

**Sample data:** `node --env-file=.env.local scripts/clear-sample-data.mjs` removes everything the test accounts
logged (sample scores included); `scripts/seed-sample-data.mjs` adds the samples back.

## 1. Supabase (≈10 min)
1. Create a free project at https://supabase.com (region: Frankfurt / closest to Egypt). Save the DB password.
2. *Authentication → Sign In / Providers*: turn **off** "Allow new users to sign up" (teachers are added from Settings).
   Direct link: https://supabase.com/dashboard/project/wpwaygmxtvrpjlovhmqa/auth/providers
3. Copy `.env.example` to `.env.local` and fill in from *Project Settings → API Keys*:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable (anon) key
   - `SUPABASE_SERVICE_ROLE_KEY` — secret (service_role) key — never share it
4. Apply the database (in the project folder):
   ```
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   If pages later show permission errors on tables, run in the SQL editor:
   `grant select, insert, update, delete on all tables in schema public to authenticated;`
5. Create your admin login:
   `node --env-file=.env.local scripts/create-admin.mjs <email> <password> "<your name>"`
   → should print `Kids in database: 31`.

## 2. Try it on your computer
`npm run dev` → http://localhost:3000
- [ ] Log in, open **Log**, log Fasl for 2 kids → "Saved 2 kids."
- [ ] Log the same Fasl again from another browser → "already logged".
- [ ] **Kids** → open a kid → upload a photo → "Use cutout" → pick flag + club → Save.
- [ ] Open the kid's public card → photo, flag, crest, stats look right → **Download card**.
- [ ] **Bonus / Deduct** a few points → **History** → Undo.
- [ ] **Settings**: add a teacher, change tiers, save.
- [ ] Optional: add `E2E_EMAIL` / `E2E_PASSWORD` to `.env.local` and run `npm run e2e`.

## 3. Go live on Vercel
1. Push the repo to GitHub, import it in Vercel.
2. Add the env vars from `.env.local` **plus** `NEXT_PUBLIC_SITE_URL=https://<your-final-domain>`.
3. Pick the final domain **before printing QR codes** — changing it later breaks every printed code.
4. Test "Download card" on an iPhone too.
5. **Kids → Print QR codes** (the page warns if links still point to localhost).
