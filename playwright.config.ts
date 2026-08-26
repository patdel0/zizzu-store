import { defineConfig, devices } from '@playwright/test';
import { testDatabaseUrl } from './test/database-url';

// Both this process (which seeds fixtures) and the dev server it starts must
// talk to the test database, so development data is never touched.
process.env['DATABASE_URL'] = testDatabaseUrl;

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
    baseURL: 'http://localhost:3000',
    // Keeps a recording of the first retry, which is usually enough to see why
    // a test failed.
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    env: { DATABASE_URL: testDatabaseUrl },
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
