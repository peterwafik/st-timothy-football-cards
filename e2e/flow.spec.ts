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

  await page.getByRole('group', { name: 'Activity' }).getByRole('button', { name: /Fasl/ }).click();
  await page.getByPlaceholder('Search name').fill(kidName);
  await page.getByRole('button', { name: kidName }).click();
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
