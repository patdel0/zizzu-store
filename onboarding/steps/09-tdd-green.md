Now make it pass. The rule for this step: **write the simplest thing that turns
the test green.** Not the endpoint you imagine you will need. The one the test
asks for.

## The file

Create `app/api/products/route.ts`:

```typescript
import type { NextRequest } from 'next/server';
import { db } from '@/lib/prisma/db';

// The Postgres driver needs Node APIs, which the Edge runtime does not have.
export const runtime = 'nodejs';

/**
 * `GET /api/products` — newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const products = await db.orm.public.Product.orderBy((product) =>
      product.createdAt.desc(),
    ).all();

    return Response.json({ data: products });
  } catch (error) {
    console.error('Failed to list products', error);

    return Response.json({ error: 'Failed to list products' }, { status: 500 });
  }
}
```

Run it:

```bash
npm test -- __tests__/api/products.test.ts
```

Green.

## What each part is doing

**`export async function GET`** — the name is the HTTP method. Next.js looks for
exports called `GET`, `POST`, `PATCH`, `DELETE` and calls whichever matches the
request. One function per method, no routing code to write.

**`export const runtime = 'nodejs'`** — Next.js can run a handler in a stripped
down "Edge" environment that has no Node APIs. The Postgres driver needs them,
so the runtime is pinned. Leave it out and this works on your machine and fails
in production, which is the worst way to find a bug.

**`db.orm.public.Product`** — the query builder Prisma generated from your
contract. Type `db.orm.public.Product.` in your editor and let autocomplete show
you what is there. A few you will use:

```typescript
await db.orm.public.Product.all();                          // every row
await db.orm.public.Product.where({ id }).first();          // one row, or null
await db.orm.public.Product.orderBy((p) => p.name.asc()).take(20).all();
await db.orm.public.Product.create({ name, priceCents });   // insert, returns the row
```

`.first()` returns `null` when there is no match. It does not throw — so
anything you get back from it has to be checked before it is used.

**`Response.json({ data: products })`** — 200 by default. The `{ data }` wrapper
is the project's convention, and now your endpoint keeps it too.

**The `try`/`catch`** — if the database is down, the caller gets a flat 500 and
the real error goes to the server log where the team can see it. Never send the
raw error to the browser.

:::note The 500 branch has no test, deliberately
Testing it would need a database that fails on demand. `docs/testing.md`
explains the reasoning: some branches cost more to test than they are worth, and
saying so out loud is better than pretending the gap is not there.
:::

## Now commit — separately

The test is already committed. Commit the route as its own change, so the
history reads:

```
a1b2c3d  Add a failing test for GET /api/products
e4f5g6h  Add GET /api/products
```

Anyone can check out the first commit, run the test, and watch it fail. That is
your evidence the test is real.

:::warn If you committed them together
`git reset --soft HEAD~1` undoes the last commit but keeps the changes staged.
Then `git restore --staged app/api/products/route.ts`, commit the test, and
commit the route. The check below will tell you if the order is wrong.
:::

## Try it for real

```bash
curl http://localhost:3000/api/products
```

You should get `{"data":[]}`. If you get a 500, the app container has not run
`db init` for the development database — go back to step 7.

:::try Prove your test can still fail
Change `{ data: products }` to `{ data: [] }` in the handler, and run the test
again. It passes — because your one test only ever creates zero products, so an
endpoint that always returns nothing satisfies it completely.

Put it back. That is not a flaw in TDD; it is TDD telling you the truth about
how much you have actually specified. A test suite only protects the behaviour
it describes, and so far you have described one case.
:::
