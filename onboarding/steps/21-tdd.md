You know what a test is now, and you have watched one catch a real break.

One question left before you write your own: how do you know a test you wrote is
any good? Start with a two-minute experiment.

=== check=limit-restored attest=green-but-broken
## Break something on purpose

The `posts` feature is finished and its tests all pass. Let us see what that
actually guarantees.

**1.** Open `app/api/posts/route.ts` and find this line near the top:

```typescript
const TITLE_MAX_LENGTH = 200;
```

**2.** Change the `200` to `5`. Save.

**3.** Run the tests:

```bash
npm test
```

**All green.**

**4.** Now use the app. Make sure it is running, then:

```bash
curl -s -X POST http://localhost:3000/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"My first post","authorId":"0199c0de-1a2b-7c3d-8e4f-5a6b7c8d9e0f"}'
```

```json
{"error":"`title` must be at most 5 characters"}
```

The app now rejects any title longer than a word. Every test passes.

**5.** Put the `200` back, and save.

===
## What that means

You just broke the app and the test suite did not notice.

That is not a bug in the tests. Nobody ever wrote a test for the title limit, so
nothing was watching it. A passing suite means one thing only:

> **The behaviours somebody wrote down still work.**

Which raises the question you cannot answer by looking at green ticks: **is the
test I just wrote actually watching anything?**

A test you have only ever seen pass might be connected to nothing at all. A
typo in the name of the thing it imports, an assertion that is true either way —
both look exactly like a passing test.

There is one way to find out, and it takes a second: **watch it fail first.**

===
## Red, green, refactor

The loop you will hear named constantly:

```mermaid
flowchart LR
    R["🔴 Red<br/>write a failing test"] --> G["🟢 Green<br/>make it pass, simply"]
    G --> F["🔵 Refactor<br/>tidy, tests still passing"]
    F --> R
```

1. **Red.** Write a test for something that does not exist yet. Run it. Watch
   it fail.
2. **Green.** Write the simplest code that makes it pass.
3. **Refactor.** Tidy up, with the test there to catch you.

Two different things are bundled in there, and they are not equally well
supported. Worth separating them, because you will be told to do both.

**Watching it fail is not optional.** You proved that to yourself a moment ago.
Red first takes one second and there is no substitute for it.

**Writing the test *before* the code is a preference, not a law.** The largest
careful study of this — [Fucci et al., 2017](https://arxiv.org/abs/1611.05994) —
took developers doing test-first and test-last and found the ordering "had no
important influence" on how much they got done or how correct it was. What
*did* predict better results was something else in the same data: working in
**small, even steps**, whichever order the test came in.

So the thing to actually copy from TDD is the size of the steps.

| | |
| --- | --- |
| Two hours of code, then find out | Slow to debug, painful to review, easy to get lost |
| Twenty minutes, then find out | You know what broke it, because you only did one thing |

You can get there test-first or test-last. What you cannot do is write it all
and find out at the end.

:::why Why test-first still helps, even without the evidence backing the order
It forces you to say what the thing should *do* before you think about how it
works — so you describe it from the outside, the way it will be used, instead of
from the inside where it is easy to build something awkward and not notice.

It also makes small steps the path of least resistance: a test you have to write
first is a step you have to define first. That may be the whole of the effect —
the order gets you the granularity, and the granularity does the work.

The course teaches it test-first for that reason. If you find yourself writing
the code first and then the test, you are not doing it wrong, as long as the
steps stay small and the test is watched failing before you trust it.
:::

===
## What a test looks like here

A Route Handler is just a function — it takes a request, returns a response. So
a test builds a request, calls the function, and looks at what comes back. No
server involved.

Every test follows the same three beats:

```typescript
it('does the thing', async () => {
  // 1. arrange — set up what this test needs
  const author = await createUser();

  // 2. act — do the one thing being tested
  const response = await POST(postRequest('/api/posts', { title: 'Hello', authorId: author.id }));

  // 3. assert — check what happened
  expect(response.status).toBe(201);
});
```

Arrange, act, assert. In that order, every time. When a test is hard to read, it
is usually because those three have been shuffled together.

The test runner is [Vitest](https://vitest.dev/), and `describe`, `it` and
`expect` are available without importing them.

Two things are given to you:

- **`test/helpers.ts`** — `createUser()`, `createPost()`. They put rows in the
  database so your test does not read as database plumbing.
- **`test/request.ts`** — `getRequest(path)`, `postRequest(path, body)`. They
  build the request object.

And one thing happens invisibly: **every test starts with empty tables.** You
never clean up after yourself, and no test can be affected by one that ran
before it.

=== check=sandbox-branch,test-exists,no-route-yet
## Your test

Create `__tests__/api/products.test.ts` with one test: `GET /api/products`
returns an empty list when there are no products.

```typescript
import { GET } from '@/app/api/products/route';
import { getRequest } from '@/test/request';

describe('GET /api/products', () => {
  it('returns an empty list when there are no products', async () => {
    const response = await GET(getRequest('/api/products'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
  });
});
```

Yes, it imports a file that does not exist. That is the point.

:::note What `@/` means
A shortcut for the project root, set up in `tsconfig.json`. `@/test/request`
means `test/request` from the top of the project — so a file can move between
folders without every import in it breaking.
:::

=== check=red,test-committed
## Run it and read the failure

```bash
npm test -- __tests__/api/products.test.ts
```

It fails — something like `Failed to resolve import "@/app/api/products/route"`.

Read it properly. It is not saying "you did something wrong"; it is saying "the
thing you asked for is not there yet", which is what you expected.
Getting comfortable reading failure output is most of what separates a fast
developer from a stuck one.

:::try
Write the test, run it, watch it fail, then **commit it on its own**.

Committing a failing test feels wrong. It is not: the commit is a statement of
what the code should do, and the next commit makes it true. The check below
looks for exactly that pair, in that order.

Something like: `Add a failing test for GET /api/products`
:::

=== check=sandbox-branch,route-exists,runtime,green
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

===
## What each part is doing

**`export async function GET`** — the name is the HTTP method. Next.js looks for
exports called `GET`, `POST`, `PATCH`, `DELETE` and calls whichever matches the
request. One function per method, no routing code to write.

**`export const runtime = 'nodejs'`** — Next.js can run a handler in a stripped
down "Edge" environment that has no Node APIs. The Postgres driver needs them,
so the runtime is pinned. Leave it out and this works on your machine and fails
in production, which is the worst way to find a bug.

**`db.orm.public.Product`** — the query builder [Prisma](https://www.prisma.io/docs) generated from your
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

**[`Response.json({ data: products })`](https://developer.mozilla.org/en-US/docs/Web/API/Response)** — 200 by default. The `{ data }` wrapper
is the project's convention, and now your endpoint keeps it too.

**The `try`/`catch`** — if the database is down, the caller gets a flat 500 and
the real error goes to the server log where the team can see it. Never send the
raw error to the browser.

:::note The 500 branch has no test, deliberately
Testing it would need a database that fails on demand. `docs/testing.md`
explains the reasoning: some branches cost more to test than they are worth, and
saying so out loud is better than pretending the gap is not there.
:::

=== check=order quiz=envelope ask=why-red-first
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

===
## Try it for real

```bash
curl http://localhost:3000/api/products
```

You should get `{"data":[]}`. If you get a 500, the app container has not run
`db init` for the development database — go back to {{step:database}}.

:::try Prove your test can still fail
Change `{ data: products }` to `{ data: [] }` in the handler, and run the test
again. It passes — because your one test only ever creates zero products, so an
endpoint that always returns nothing satisfies it completely.

Put it back. So far you have described one case, and one case is all your suite
protects.
:::
