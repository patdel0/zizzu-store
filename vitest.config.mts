import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test/database-url';

export default defineConfig({
  // Resolves the `@/*` alias from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    // `describe`, `it` and `expect` are available without importing them.
    globals: true,
    // Point the app's database client at the test database, so a stray
    // `npm test` can never touch development data.
    env: { DATABASE_URL: testDatabaseUrl },
    // Creates the test database and its tables once, before anything runs.
    globalSetup: ['./test/global-setup.ts'],
    // Empties the tables before each test.
    setupFiles: ['./test/setup.ts'],
    // `e2e/` belongs to Playwright.
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
