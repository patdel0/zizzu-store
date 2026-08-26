# API routes

`app/api/posts/route.ts` is the reference implementation for a database-backed
endpoint. Copy it when adding a new resource.

## Layout

| File | Purpose |
|---|---|
| [`app/api/posts/route.ts`](../app/api/posts/route.ts) | `GET` and `POST` handlers for the `Post` model |
| [`app/posts/posts-board.tsx`](../app/posts/posts-board.tsx) | Client Component that reads and writes through the route |
| [`app/posts/page.tsx`](../app/posts/page.tsx) | Page that renders the component |
| [`__tests__/api/posts.test.ts`](../__tests__/api/posts.test.ts) | Handler tests, against a real database |
| [`e2e/posts.spec.ts`](../e2e/posts.spec.ts) | Browser tests for the page |

A route file lives at `app/api/<resource>/route.ts` and exports one async
function per HTTP method. Add `app/api/posts/[id]/route.ts` for single-record
`GET`/`PATCH`/`DELETE`; its `params` argument is a promise and has to be awaited.

## Conventions

- **One response envelope.** `{ data }` on success, `{ error }` on failure, so a
  client only needs one branch.
- **Validate before querying.** Query params and JSON bodies are untrusted.
  Parsing happens in small `parseX` functions that return
  `{ ok: true, value } | { ok: false, error }`, and a failure answers 400.
  Reach for [zod](https://zod.dev) once the shapes outgrow hand-written checks.
- **Foreign keys are checked up front** so a bad reference answers 422 rather
  than surfacing as an opaque constraint violation.
- **Errors do not leak.** Unexpected failures are logged server-side and
  answered with a generic 500.
- **`export const runtime = 'nodejs'`.** The `pg` driver cannot run on the Edge
  runtime.
- `GET` handlers are dynamic by default — a handler that reads the database is
  never served stale.

## Talking to the database

`db.orm.<namespace>.<Model>` returns a fluent, fully typed query builder:

```typescript
import { db } from '@/lib/prisma/db';

await db.orm.public.Post.orderBy((post) => post.createdAt.desc()).take(20).all();
await db.orm.public.Post.where({ id }).first();
await db.orm.public.Post.create({ title, content, authorId });
```

Columns declared with `field.uuidString()` are stored as `char(36)` and typed as
a branded string, so a plain `string` has to be validated and cast once, at the
request boundary — see `parseCreatePost`.

## Requests

```bash
curl 'http://localhost:3000/api/posts?limit=5'
```

```bash
curl -X POST http://localhost:3000/api/posts -H 'Content-Type: application/json' -d '{"title":"Hello","content":"World","authorId":"<user-uuid>"}'
```

## Tests

``` bash
npm test;          # Vitest — plain functions and Route Handlers
npm run test:e2e;  # Playwright — pages and components
```

Route Handlers are plain functions, so the tests import them and call them with
a request — no server involved. They run against a real Postgres database, so
they cover the actual SQL, not a mock of it.

See [testing.md](testing.md) for how to write one.
