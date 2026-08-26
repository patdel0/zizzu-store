import type { NextRequest } from 'next/server';
import type { Char } from '@prisma/orm-postgres/target/codec-types';
import { db } from '@/lib/prisma/db';

/**
 * Route Handler template — `GET /api/posts` and `POST /api/posts`.
 *
 * Conventions used here, worth keeping in new endpoints:
 *
 * - Handlers are named exports per HTTP method and return the Web `Response`
 *   (`Response.json`). `GET` handlers are *not* cached by default, so a handler
 *   that reads from the database is always fresh.
 * - Every response uses the same envelope: `{ data }` on success,
 *   `{ error }` on failure, so clients only need one branch.
 * - Input is untrusted: query params and JSON bodies are validated before they
 *   reach the database, and validation failures answer 400 instead of throwing.
 * - Unexpected errors are logged server-side and answered with a generic 500 so
 *   internals (SQL, connection strings) never reach the client.
 */

// The Prisma client talks to Postgres through `pg`, which needs Node APIs.
// The Edge runtime cannot run it, so pin the runtime explicitly.
export const runtime = 'nodejs';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const TITLE_MAX_LENGTH = 200;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Result of validating untrusted input: either the parsed value or a reason. */
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

type CreatePostInput = {
  title: string;
  content: string | null;
  // `field.uuidString()` is stored as `char(36)`, which the generated contract
  // types as a branded string. Values are branded once, here at the boundary.
  authorId: Char<36>;
};

/**
 * `GET /api/posts?limit=10` — newest posts first.
 */
export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  if (!limit.ok) {
    return Response.json({ error: limit.error }, { status: 400 });
  }

  try {
    const posts = await db.orm.public.Post.orderBy((post) =>
      post.createdAt.desc(),
    )
      .take(limit.value)
      .all();

    return Response.json({ data: posts });
  } catch (error) {
    return internalError('Failed to list posts', error);
  }
}

/**
 * `POST /api/posts` — create one post from a JSON body.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const input = parseCreatePost(body);

  if (!input.ok) {
    return Response.json({ error: input.error }, { status: 400 });
  }

  try {
    // Check the foreign key up front so a missing author reads as a client
    // error rather than surfacing as an opaque constraint violation.
    const author = await db.orm.public.User.where({
      id: input.value.authorId,
    }).first();

    if (!author) {
      return Response.json(
        { error: `No user exists with id "${input.value.authorId}"` },
        { status: 422 },
      );
    }

    const post = await db.orm.public.Post.create(input.value);

    return Response.json({ data: post }, { status: 201 });
  } catch (error) {
    return internalError('Failed to create post', error);
  }
}

function parseLimit(raw: string | null): Parsed<number> {
  if (raw === null) {
    return { ok: true, value: DEFAULT_LIMIT };
  }

  const limit = Number(raw);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return {
      ok: false,
      error: `\`limit\` must be an integer between 1 and ${MAX_LIMIT}`,
    };
  }

  return { ok: true, value: limit };
}

function parseCreatePost(body: unknown): Parsed<CreatePostInput> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const { title, content, authorId } = body as Record<string, unknown>;

  if (typeof title !== 'string' || title.trim() === '') {
    return { ok: false, error: '`title` is required' };
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `\`title\` must be at most ${TITLE_MAX_LENGTH} characters`,
    };
  }

  if (content !== undefined && content !== null && typeof content !== 'string') {
    return { ok: false, error: '`content` must be a string or null' };
  }

  if (typeof authorId !== 'string' || !UUID_PATTERN.test(authorId)) {
    return { ok: false, error: '`authorId` must be a UUID' };
  }

  return {
    ok: true,
    value: {
      title: title.trim(),
      content: content ?? null,
      authorId: authorId as Char<36>,
    },
  };
}

function internalError(message: string, error: unknown) {
  console.error(message, error);

  return Response.json({ error: message }, { status: 500 });
}
