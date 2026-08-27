import 'dotenv/config';

// An exported-but-empty `TEST_DATABASE_URL` is not a choice anybody made, so
// treat a blank value the same as an unset one. Quotes are shell syntax rather
// than part of the URL, so drop a surrounding pair if a line copied out of
// `.env` brought them along.
const configured = process.env['TEST_DATABASE_URL']
  ?.trim()
  .replace(/^(['"])([\s\S]*)\1$/, '$2')
  .trim();

/**
 * Connection string for the test database.
 *
 * This is deliberately separate from `DATABASE_URL`: the suite empties every
 * table before each test, so it must never point at a database holding data
 * anyone cares about.
 */
export const testDatabaseUrl =
  configured || 'postgresql://zizzu:zizzu@localhost:5432/zizzu_test';

try {
  new URL(testDatabaseUrl);
} catch (cause) {
  throw new Error(
    `TEST_DATABASE_URL is not a valid connection string: ${JSON.stringify(testDatabaseUrl)}. ` +
      'Expected something like `postgresql://zizzu:zizzu@localhost:5432/zizzu_test`. ' +
      'Check `.env`, or `unset TEST_DATABASE_URL` if your shell is overriding it.',
    { cause },
  );
}
