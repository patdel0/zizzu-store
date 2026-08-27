Your endpoint works, and trusts everything it is told. Now make it correct.

Work in small loops here: one test, make it pass, commit, next test. Five short
cycles, not one long one.

===
## The rule

**Anything that arrives over HTTP is untrusted.** Not because everyone is
malicious, but because a typo in a form and a deliberate attack arrive through
the same door and look identical from the server's side.

Your job is to decide, for every field, what counts as valid — and to answer
clearly when it is not.

===
## What to build

| Situation | Status | Body |
|---|---|---|
| Created | **201** | `{ data: product }` |
| Body is not valid JSON | **400** | `{ error: 'Request body must be valid JSON' }` |
| `name` missing or empty | **400** | `{ error: '`name` is required' }` |
| `priceCents` not a positive whole number | **400** | `{ error: … }` |
| A product with that name already exists | **422** | `{ error: … }` |

Remember the distinction from {{step:requests}} — and [MDN has the full list](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status): **400** means "I cannot make sense of
this"; **422** means "I understood you perfectly and it still cannot be done".

===
## How this project does it

Open `parseCreatePost` in `app/api/posts/route.ts`. It is a plain function that
takes something unknown and returns either a value or a reason:

```typescript
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
```

The handler then reads simply — parse, and if it is not ok, answer 400:

```typescript
const input = parseCreateProduct(body);

if (!input.ok) {
  return Response.json({ error: input.error }, { status: 400 });
}
```

**You are writing `parseCreateProduct`.** The loops below each add one rule to
it — not to the handler. That is the point of the shape: the handler stays four
lines, and every rule ends up in a plain function you can test with no request
and no database.

Start it now, because the first two lines are the ones people get wrong:

```typescript
type CreateProductInput = { name: string; description: string | null; priceCents: number };

function parseCreateProduct(body: unknown): Parsed<CreateProductInput> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const { name, description, priceCents } = body as Record<string, unknown>;

  // your rules go here

  return { ok: true, value: { name: '', description: null, priceCents: 0 } };
}
```

Those two lines are load-bearing, and `parseCreatePost` has the same pair.
`typeof body !== 'object'` is the check; `as Record<string, unknown>` is you
telling TypeScript what you just proved. Without it, `body.name` will not
compile at all — `body` is `unknown`, and `unknown` refuses everything until
you narrow it. See {{step:typescript}} for what `as` is doing there.

:::note Why the body is `unknown`
[`request.json()`](https://nextjs.org/docs/app/api-reference/functions/next-request)
could return anything at all, so its result is typed `unknown` — the same
reason as in {{step:typescript}}, and the reason the parsing below has to
happen before anything else does.
:::

=== check=sandbox-branch,bad-json
## Loop one: a body that is not JSON

`postRawRequest('/api/products', 'not json')` sends the text untouched.
`request.json()` throws on it, so wrap it:

```typescript
let body: unknown;

try {
  body = await request.json();
} catch {
  return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 });
}
```

Write the test, watch it fail, make it pass, commit. Then come back.

=== check=missing-name
## Loop two: a missing name

Inside `parseCreateProduct`, after the destructure:

```typescript
if (typeof name !== 'string' || name.trim() === '') {
  return { ok: false, error: '`name` is required' };
}
```

Trim before saving, so `"  Mug  "` and `"Mug"` do not become two products.

=== check=uses-parse
## Loop three: a bad price

You already wrote this one. In {{step:prep}} you PREP'd and tested
`parsePriceCents` — this is what it was for. Import it rather than writing the
checks a second time:

```typescript
import { parsePriceCents } from '@/lib/products';

// inside parseCreateProduct, on the destructured value — not on `body`
const price = parsePriceCents(priceCents);

if (!price.ok) {
  return { ok: false, error: price.error };
}
```

Note what you get for free: it is already tested against all eight of your
examples. The handler test only has to prove the handler *uses* it — one case is
enough, because the edge cases are covered where they belong.

:::note This is what "a plain function" buys you
`parsePriceCents` needs no request, no database and no server. That makes it
trivial to test exhaustively, which is why the tricky decisions live there
rather than in the middle of the handler.

When you find yourself wanting to mock a database to reach some branch, that is
usually a sign the logic in that branch should move into a function like this
one.
:::

=== check=duplicate-name
## Loop four: a duplicate name

Look before you write:

```typescript
const existing = await db.orm.public.Product.where({ name: input.value.name }).first();

if (existing) {
  return Response.json(
    { error: `A product called "${input.value.name}" already exists` },
    { status: 422 },
  );
}
```

Arrange this test by creating the product first, then posting the same name
again. You will want a helper:

```typescript
let productCount = 0;

export async function createProduct(overrides: { name?: string; priceCents?: number } = {}) {
  productCount += 1;

  return db.orm.public.Product.create({
    name: overrides.name ?? `Product ${productCount}`,
    priceCents: overrides.priceCents ?? 999,
  });
}
```

Put it in `test/helpers.ts` next to `createPost`, rather than repeating the
setup in each test. That file exists so a test reads as what it checks, not as
database plumbing.

:::note Why the counter
Two fixtures both called "Product" would collide the moment you test
uniqueness. Fixtures should differ by default, and be identical only when a test
says so.
:::

=== check=cases
## Loop five: unexpected failures

Wrap the database work in a `try`/`catch`, log the real error, and answer a flat
500:

```typescript
} catch (error) {
  console.error('Failed to create product', error);

  return Response.json({ error: 'Failed to create product' }, { status: 500 });
}
```

:::warn Never send the raw error to the caller
A database error can contain table names, the query, sometimes the connection
string. Log the detail where your team can see it; return the summary.
:::

===
## Two attacks you did not have to think about, and one you do

You just wrote input validation, which is where most security advice starts. Two
of the attacks it usually warns about never came up. It is worth knowing why —
and there is a third that nothing protects you from.

**You never built a query by pasting strings together.**

```typescript
// Never. Not once, not "just this one time for a search box".
`SELECT * FROM products WHERE name = '${name}'`
```

A product called `'; DROP TABLE products; --` ends that query early and starts a
new one. That is SQL injection, and it is still near the top of the
[OWASP Top Ten](https://owasp.org/www-project-top-ten/) after twenty-five years.
`db.orm.public.Product.where({ name })` sends the name as a *parameter*,
separately from the query — so there is no sentence for it to escape from. You
get that for free by using the query builder, and you lose it the moment you
reach for raw SQL.

**You never put user text straight into a page.** React escapes anything in
`{...}` before it renders, so a name containing `<script>` displays as those
characters rather than running. The way out of that protection has a deliberately
alarming name — `dangerouslySetInnerHTML` — and if you ever find yourself typing
it, stop and find another way. That is cross-site scripting, and it is the same
mistake as SQL injection wearing a different hat: **data got treated as
instructions.**

**And nothing secret is in the code you are about to push.** Connection strings,
API keys and tokens live in `.env`, which is in `.gitignore`. Committing one is
not fixed by deleting it in the next commit — it is in the history, and the
history is what gets pushed. The fix is to rotate the secret, which means telling
someone. Do that quickly rather than quietly.

:::warn The biggest one is what this endpoint does not have
Anyone who can reach `POST /api/products` can create a product. There is no
sign-in, no check of who is asking, no limit on how often. That is deliberate
for a sandbox and it would not survive review anywhere else.

Two words worth having straight, because they get confused constantly:
**authentication** is *who are you*, **authorisation** is *are you allowed to do
this*. Validation — everything you just wrote — is a third thing, and having it
does not give you either of the others.

On a real ticket, "who is allowed to call this?" is the first question a
reviewer asks. Ask it yourself first.
:::

:::note The pattern under all three
Somewhere, a string you were given gets read as something with power — a query,
markup, a command. Every time you hand user input to something that interprets
it, ask what happens if that input is hostile rather than clumsy. Frameworks
handle the common cases, which is exactly why the dangerous moments are the ones
where you step outside them.
:::

===
## One `it` per case

Five separate tests, not one test with five assertions. When a test fails, its
name should tell you what broke without opening it:

```
✓ rejects a body that is not valid JSON
✓ rejects a missing name
✓ rejects a price that is not a whole number
✓ rejects a duplicate name
```

=== check=suite,live-400 quiz=validation
## Then run everything

```bash
npm test
```

Not just your file — the whole suite. If a `posts` test has gone red, you have
broken something you were not looking at. Running everything before asking for a
review is the minimum.

:::try Hit the real thing
```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mug","priceCents":899}'
```

Then send something broken, and watch it refuse politely instead of falling
over:

```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"priceCents":-1}'
```
:::
