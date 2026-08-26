Reading is the easy half. Now the endpoint has to accept data from outside.

This step does only the happy path: a valid product goes in, a **201** comes
back. The next one deals with everything that can go wrong, which is most of the
work.

## What POST looks like in a test

A POST request carries a body. `test/request.ts` builds one for you:

```typescript
postRequest('/api/products', { name: 'Mug', priceCents: 899 })
```

So the test is the same three beats as before — arrange, act, assert:

```typescript
import { GET, POST } from '@/app/api/products/route';
import { getRequest, postRequest } from '@/test/request';

describe('POST /api/products', () => {
  it('creates a product and returns it', async () => {
    const response = await POST(
      postRequest('/api/products', { name: 'Mug', priceCents: 899 }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      data: { name: 'Mug', priceCents: 899 },
    });
  });
});
```

Note [`toMatchObject`](https://vitest.dev/api/expect.html#tomatchobject) rather than `toEqual`. The saved product also has an `id`,
a `createdAt` and an `updatedAt` that you cannot predict, and `toMatchObject`
checks the fields you named while ignoring the rest.

**201, not 200.** The request created something, and the status code should say
so.

Write it, run it, watch it fail:

```bash
npm test -- __tests__/api/products.test.ts
```

## Make it pass

Add a `POST` export next to your `GET`:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await db.orm.public.Product.create({
    name: body.name,
    description: body.description ?? null,
    priceCents: body.priceCents,
  });

  return Response.json({ data: product }, { status: 201 });
}
```

Green.

:::warn That code is not finished, and you should be uncomfortable
It trusts everything it is sent. A body with no `name`, a price of `"banana"`, a
body that is not JSON at all — every one of those crashes it, and a crash
reaches the caller as a 500, which claims the server is broken when in fact the
request was.

Leave it like this for now. Fixing it is the next step, and doing it in that
order is the point: you have a working thing, and now you make it correct.
:::

## Prove it really saved

One test worth writing now, because it catches a whole class of fake
implementation:

```typescript
it('saves the product, so a later request can read it back', async () => {
  await POST(postRequest('/api/products', { name: 'Mug', priceCents: 899 }));

  const { data } = await (await GET(getRequest('/api/products'))).json();

  expect(data).toHaveLength(1);
  expect(data[0].name).toBe('Mug');
});
```

The first test only checks what `POST` *said*. This one checks what it *did* —
POST, then GET, and see it come back. If your handler returned a plausible
object without writing to the database, the first test would pass and this one
would not.

:::note Why every test starts with an empty database
`expect(data).toHaveLength(1)` only works because no other test's products are
lying around. `test/setup.ts` calls `resetDatabase` before each test — including
the `Product` line you added in step 13 — which is
what lets tests run in any order and not interfere.
:::

:::try
Commit as you go — the test, then the handler, then the second test. Small
commits are easier to write than to remember to split up later.
:::
