import { defineConfig, devices } from '@playwright/test';
import { testDatabaseUrl } from './test/database-url';

// Both this process (which seeds fixtures) and the dev server it starts must
// talk to the test database, so development data is never touched.
process.env['DATABASE_URL'] = testDatabaseUrl;

/**
 * A port of its own, so the end-to-end run can never collide with — or quietly
 * borrow — the app you are developing against on 3000.
 */
const PORT = Number(process.env['E2E_PORT'] ?? 3100);

export default defineConfig({
  testDir: './e2e',
  // Tests share one database, so run them one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  // Creates the test database and its tables, exactly as `npm test` does.
  globalSetup: './test/global-setup.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Keeps a recording of the first retry, which is usually enough to see why
    // a test failed.
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { DATABASE_URL: testDatabaseUrl },
    // Never reuse a server this config did not start. The containerised app on
    // 3000 is pointed at `DATABASE_URL`, so reusing it ran the browser against
    // development data while the fixtures seeded the test database — tests
    // failed for reasons that had nothing to do with the code, and a
    // destructive test would have been pointed at real rows.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
