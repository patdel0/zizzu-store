import type { Char } from '@prisma/orm-postgres/target/codec-types';
import { db } from '@/lib/prisma/db';

/**
 * Database helpers shared by the Vitest suite and the Playwright suite.
 *
 * The point of these is that a test should read as what it is checking, not as
 * database setup. Add a `createX` here whenever a new model needs fixtures.
 */

/** Empties every table. Called before each Vitest test by `test/setup.ts`. */
export async function resetDatabase() {
  // Posts reference users, so children go first.
  await db.orm.public.Post.where((post) => post.id.isNotNull()).deleteAll();
  await db.orm.public.User.where((user) => user.id.isNotNull()).deleteAll();
}

let userCount = 0;

/** Creates a user with a unique email. Pass overrides for fields you care about. */
export async function createUser(overrides: { name?: string } = {}) {
  userCount += 1;

  return db.orm.public.User.create({
    email: `user-${userCount}-${Date.now()}@example.com`,
    name: overrides.name ?? 'Test User',
  });
}

/** Creates a post. Creates an author too unless you pass one. */
export async function createPost(
  overrides: {
    title?: string;
    content?: string | null;
    // `char(36)` in the contract, so pass an id that came from `createUser`.
    authorId?: Char<36>;
  } = {},
) {
  const authorId = overrides.authorId ?? (await createUser()).id;

  return db.orm.public.Post.create({
    title: overrides.title ?? 'A post',
    content: overrides.content ?? null,
    authorId,
  });
}
