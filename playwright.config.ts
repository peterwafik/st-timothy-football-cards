import { defineConfig } from '@playwright/test';

try { process.loadEnvFile('.env.local'); } catch { /* CI provides env directly */ }

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000/login', reuseExistingServer: true, timeout: 120_000 },
});
