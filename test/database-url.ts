import 'dotenv/config';

/**
 * Connection string for the test database.
 *
 * This is deliberately separate from `DATABASE_URL`: the suite empties every
 * table before each test, so it must never point at a database holding data
 * anyone cares about.
 */
export const testDatabaseUrl =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://zizzu:zizzu@localhost:5432/zizzu_test';
