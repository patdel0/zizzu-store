Your endpoint works, and trusts everything it is told. Now make it correct.

Work in small loops here: one test, make it pass, commit, next test. Five short
cycles, not one long one.

## The rule

**Anything that arrives over HTTP is untrusted.** Not because everyone is
malicious, but because a typo in a form and a deliberate attack arrive through
the same door and look identical from the server's side.

Your job is to decide, for every field, what counts as valid — and to answer
clearly when it is not.

## What to build

| Situation | Status | Body |
|---|---|---|
| Created | **201** | `{ data: product }` |
| Body is not valid JSON | **400** | `{ error: 'Request body must be valid JSON' }` |
| `name` missing or empty | **400** | `{ error: '`name` is required' }` |
| `priceCents` not a positive whole number | **400** | `{ error: … }` |
| A product with that name already exists | **422** | `{ error: … }` |

Remember the distinction from step 3: **400** means "I cannot make sense of
this"; **422** means "I understood you perfectly and it still cannot be done".

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

Borrow that shape. It keeps the handler readable, and the parsing ends up in a
plain function you can test on its own, with no request and no database.

:::note `unknown` versus `any`
`request.json()` could return literally anything, so the result is typed
`unknown`. TypeScript then refuses to let you touch it until you have checked
what it is — which is the point. `any` would switch those checks off and let the
bug through silently.
:::

## The loops

**1. A body that is not JSON.** `postRawRequest('/api/products', 'not json')`
sends the text untouched. `request.json()` throws on it, so wrap it:

```typescript
let body: unknown;

try {
  body = await request.json();
} catch {
  return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 });
}
```

**2. A missing name.** `typeof name !== 'string' || name.trim() === ''`. Trim it
before saving, so `"  Mug  "` and `"Mug"` do not become two products.

**3. A bad price.** Think about what you are refusing and why:

| Input | Why it is refused |
|---|---|
| `"899"` | Text, not a number. |
| `9.99` | Not a whole number of cents. |
| `-100` | A price someone gets paid to take. |
| `1e400` | Larger than JavaScript can hold — it becomes `Infinity`. |

`Number.isInteger(priceCents) && priceCents > 0` covers all four. Every one of
them is a bug report somebody would otherwise file.

**4. A duplicate name.** Look before you write:

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
again. You will want a helper for that:

```typescript
let productCount = 0;

export async function createProduct(overrides: { name?: string; priceCents?: number } = {}) {
  productCount += 1;

  return db.orm.public.Product.create({
    name: overrides.name ?? `Product ${productCount}`,
    description: null,
    priceCents: overrides.priceCents ?? 999,
  });
}
```

Put it in `test/helpers.ts` next to `createPost`, rather than repeating the setup
in each test. That file exists so a test reads as what it checks, not as
database plumbing.

:::note Why the counter
Two fixtures both called "Product" would collide the moment you test uniqueness.
Fixtures should differ by default, and be identical only when a test says so.
:::

**5. Unexpected failures.** Wrap the database work in a `try`/`catch`, log the
real error, and answer a flat 500:

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

## One `it` per case

Five separate tests, not one test with five assertions. When a test fails, its
name should tell you what broke without opening it:

```
✓ rejects a body that is not valid JSON
✓ rejects a missing name
✓ rejects a price that is not a whole number
✓ rejects a duplicate name
```

## Then run everything

```bash
npm test
```

Not just your file — the whole suite. If a `posts` test has gone red, you have
broken something you were not looking at. Running everything before asking for a
review is the minimum, and it is the habit this step is really teaching.

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
