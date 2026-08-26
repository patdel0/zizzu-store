import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { testDatabaseUrl } from './database-url';

/**
 * Runs once, before the whole suite: makes sure the test database exists and
 * that its tables match the contract in `lib/prisma/contract.ts`.
 *
 * Nobody needs to run this by hand — `npm test` triggers it.
 */
export default async function globalSetup() {
  await createDatabaseIfMissing();

  // `db init` is additive and safe to re-run: it creates whatever the contract
  // declares and the database does not have yet.
  execFileSync(
    'npx',
    ['prisma-cli', 'db', 'init', '--db', testDatabaseUrl, '--no-interactive', '--yes'],
    { stdio: 'inherit' },
  );
}

async function createDatabaseIfMissing() {
  const url = new URL(testDatabaseUrl);
  const databaseName = url.pathname.slice(1);

  // `CREATE DATABASE` cannot run from inside the database it creates, so
  // connect to the always-present `postgres` database to issue it.
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });

  try {
    await client.connect();
  } catch (cause) {
    throw new Error(
      `Could not reach Postgres at ${url.host}. Start it with \`./script/server\` and try again.`,
      { cause },
    );
  }

  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (existing.rowCount === 0) {
      // A database name cannot be a bound parameter, so quote it as an
      // identifier instead.
      await client.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}
