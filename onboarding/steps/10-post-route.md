Reading is the easy half. Now the endpoint has to accept data from outside,
which means everything that arrives is a lie until you have checked it.

This is the longest step. Do it in small red-green loops — one test, make it
pass, commit, next test. Do not write all five tests and then all the code.

## The rule

**Anything that comes over HTTP is untrusted.** Not because everyone is
malicious, but because a typo in a form and a deliberate attack arrive through
the same door and are indistinguishable from the server's side.

Look at `parseCreatePost` in `app/api/posts/route.ts`. It is a plain function
that takes `unknown` and returns either a valid value or a reason:

```typescript
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
```

That shape is worth borrowing. The handler stays readable — parse, and if it is
not ok, answer 400 — and the parsing logic is a plain function you can test
directly, with no request and no database.

:::note `unknown` versus `any`
`JSON.parse` could return anything, so the body is typed `unknown`. TypeScript
will not let you touch an `unknown` value until you have checked what it is.
`any` would switch those checks off — which is why `unknown` is the right type
here, and why the parse function is where the checking happens.
:::

## What to build

`POST /api/products` takes `{ name, description, priceCents }` and answers:

| Situation | Status | Body |
|---|---|---|
| Created | **201** | `{ data: product }` |
| Body is not valid JSON | **400** | `{ error: 'Request body must be valid JSON' }` |
| `name` missing or empty | **400** | `{ error: '`name` is required' }` |
| `priceCents` not a positive whole number | **400** | `{ error: … }` |
| A product with that name already exists | **422** | `{ error: … }` |

That last one is the same move `posts` makes with its author check: look first,
so the caller gets a clear answer instead of a database error dressed up as a
500. 400 means "this request is malformed"; 422 means "I understood it perfectly
and it still cannot be done".

:::warn priceCents deserves real checks
`Number.isInteger(price) && price > 0`. Think about what you are refusing and
why: `"9.99"` is a string, `9.99` is not a whole number of cents, `-100` is a
price someone gets paid to take, and `1e400` is `Infinity`. Every one of those
is a bug report someone would otherwise file.
:::

## Work in loops

Red, green, commit. Five times.

1. **201 on success.** Assert the status and that the body contains the name you
   sent. Then write just enough handler to pass.
2. **The row is really saved.** POST, then `GET`, and check it comes back. This
   is the test that would have caught the `{ data: [] }` shortcut from the last
   step.
3. **400 on a body that is not JSON.** `postRawRequest('/api/products', 'not json')`.
4. **400 on a missing name**, and on a bad `priceCents`. One `it` per case —
   when a test fails, its name should tell you what broke without opening it.
5. **422 on a duplicate name.** Arrange by creating the product first, then post
   the same name again.

For step 5 you will want a `createProduct` helper. Add it to `test/helpers.ts`
next to `createPost`, rather than repeating the setup in each test — that file
exists so tests read as what they check.

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

:::note Why a counter and not a fixed name
Two products called "Product" would collide the moment you test uniqueness.
Fixtures should differ by default and be identical only when a test says so.
:::

## Then check the whole suite

```bash
npm test
```

Not just your file — everything. If a `posts` test has gone red, you have broken
something you were not looking at, most likely the contract. Running the full
suite before you ask anyone to look at your work is not optional; it is the
minimum.

:::try
Finally, hit the real thing:

```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mug","priceCents":899}'
```

Then send something broken and watch it refuse politely:

```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"priceCents":-1}'
```
:::
