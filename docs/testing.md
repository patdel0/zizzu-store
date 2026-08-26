# Testing

Two tools, and a simple rule for which one to reach for.

| What you are testing | Tool | Where | Command |
|---|---|---|---|
| A plain function | Vitest | `__tests__/` | `npm test` |
| A Route Handler (`/api/...`) | Vitest | `__tests__/api/` | `npm test` |
| A component or a page | Playwright | `e2e/` | `npm run test:e2e` |

We do not unit test components. Rendering React outside a browser needs mocked
`fetch`, mocked modules and careful handling of asynchronous rendering — a lot
of machinery that teaches you about the test framework rather than about the
app. A real browser is both easier to write and closer to what users do. Next.js
also cannot render `async` Server Components outside a browser at all.

## Before you start

Everything needs Postgres running:

``` bash
./script/server;
```

`npm test` then creates a separate `zizzu_test` database and its tables the
first time it runs. **Every test starts with empty tables**, which is why the
test database must never be the one you develop against.

## Writing your first test

Start with a plain function — no database, no browser:

``` typescript
import { parseLimit } from '@/lib/example';

it('rejects a limit of zero', () => {
  expect(parseLimit('0').ok).toBe(false);
});
```

`describe`, `it` and `expect` are available everywhere; there is nothing to
import for them.

## Testing a Route Handler

A Route Handler is a function: it takes a request and returns a response. Import
it and call it.

``` typescript
import { POST } from '@/app/api/posts/route';
import { createUser } from '@/test/helpers';
import { postRequest } from '@/test/request';

it('creates a post', async () => {
  // 1. arrange — put what you need in the database
  const author = await createUser();

  // 2. act — call the handler
  const response = await POST(
    postRequest('/api/posts', { title: 'Hello', authorId: author.id }),
  );

  // 3. assert — check the status and the body
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({ data: { title: 'Hello' } });
});
```

Arrange, act, assert — in that order, every time.
[`__tests__/api/posts.test.ts`](../__tests__/api/posts.test.ts) is the file to
copy from.

Helpers live in [`test/helpers.ts`](../test/helpers.ts) (`createUser`,
`createPost`) and [`test/request.ts`](../test/request.ts) (`getRequest`,
`postRequest`). Add to them rather than repeating setup in a test — a test
should read as what it checks, not as database plumbing.

## Testing a page

``` typescript
import { expect, test } from '@playwright/test';
import { createUser } from '../test/helpers';

test('creates a post from the form', async ({ page }) => {
  const author = await createUser();

  await page.goto('/posts');
  await page.getByLabel('Title').fill('Hello');
  await page.getByLabel('Author ID').fill(author.id);
  await page.getByRole('button', { name: 'Create post' }).click();

  await expect(page.getByRole('heading', { name: 'Hello' })).toBeVisible();
});
```

The first run needs a browser: `npx playwright install chromium`.

Two rules that prevent most flaky tests:

- **Find things the way a person would** — `getByRole`, `getByLabel`,
  `getByText`. Not CSS classes, which change whenever the styling does.
- **Never add a fixed wait.** `expect(...).toBeVisible()` already waits for the
  element to appear. A `waitForTimeout` is either too short and flaky or too
  long and slow.

Keep end-to-end tests on the happy path. Empty states, validation messages and
error responses are far cheaper to check as Route Handler tests, and a big
browser suite gets slow.

## What we deliberately do not test

The `500` branch in a Route Handler — the one that runs when the database itself
fails — has no test. Triggering it needs a database that fails on demand, which
costs more than the branch is worth. If you find yourself wanting to mock the
database to reach a branch, that is usually a sign the logic should move into a
plain function that can be tested directly.
