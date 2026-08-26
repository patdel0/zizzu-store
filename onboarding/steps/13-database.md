Now you build. The feature is **products** — a store needs something to sell —
and you will build it the same way the `posts` feature is built, one layer at a
time, starting with the database.

## Tables, and where they come from

A database holds **tables**. A table has **columns** with types, and each row is
one record. `Post` has a `title` column that holds text, a `createdAt` that
holds a timestamp, and so on.

In many projects you would create tables by writing SQL by hand. Here, one file
describes them: `lib/prisma/contract.ts`. Open it.

```typescript
const Post = model('Post', {
  fields: {
    id: field.id.uuidv7String(),
    title: field.text(),
    content: field.text().optional(),
    authorId: field.uuidString(),
    createdAt: field.temporal.createdAt(),
    updatedAt: field.temporal.updatedAt(),
  },
});
```

That is the whole definition of a post. From it, [Prisma](https://www.prisma.io/docs) produces the real
[Postgres](https://www.postgresql.org/docs/) table *and* the TypeScript types — so when you type
`db.orm.public.Post.` your editor knows every field, and misspelling one is an
error before you run anything.

Reading the field types:

| Declaration | What you get |
|---|---|
| `field.id.uuidv7String()` | The primary key — a unique id, generated for you. |
| `field.text()` | Text. Required: a row cannot exist without it. |
| `field.text().optional()` | Text, or nothing. In TypeScript: `string \| null`. |
| `field.int()` | A whole number. |
| `field.temporal.createdAt()` | Set automatically when the row is created. |
| `field.temporal.updatedAt()` | Updated automatically on every write. |

`.optional()` is the one to think about. It is a decision, not a formality:
required means every row must have it forever, including the ones already there.

## Add the Product model

In `lib/prisma/contract.ts`, next to `Post`, add:

```typescript
const Product = model('Product', {
  fields: {
    id: field.id.uuidv7String(),
    name: field.text(),
    description: field.text().optional(),
    priceCents: field.int(),
    createdAt: field.temporal.createdAt(),
    updatedAt: field.temporal.updatedAt(),
  },
});
```

Then add it to the object the contract returns, alongside `User` and `Post`:

```typescript
return {
  models: {
    User: User.relations({ … }),
    Post: Post.relations({ … }),
    Product,
  },
};
```

Declaring the model is not enough — only models listed under `models` can be
queried.

:::note Why `priceCents` and not `price`
Money is stored as a whole number of cents, everywhere, always. £9.99 is `999`.

Decimal numbers in computers are approximations: `0.1 + 0.2` really does come to
`0.30000000000000004` in JavaScript. That rounding error is invisible until it
lands in someone's invoice. Store cents as an integer, divide by 100 when you
show it, and the problem never exists.
:::

## Regenerate

```bash
npx prisma-cli contract emit
```

This reads `contract.ts` and rewrites its two companion files —
`contract.json`, which the running app reads, and `contract.d.ts`, which your
editor reads. Both are committed, because the app needs them at runtime.

Run it every time you change the contract. Forgetting is the most common way to
produce an error that makes no sense: your editor insists `Product` does not
exist, while you are looking straight at it.

## One more file knows about your models

Open `test/helpers.ts` and look at `resetDatabase`:

```typescript
export async function resetDatabase() {
  // Posts reference users, so children go first.
  await db.orm.public.Post.where((post) => post.id.isNotNull()).deleteAll();
  await db.orm.public.User.where((user) => user.id.isNotNull()).deleteAll();
}
```

That runs before **every single test**, and it is what lets tests run in any
order without tripping over rows another test left behind. It lists the models
by hand — so a model you add is a model it does not know about.

Add yours at the top:

```typescript
await db.orm.public.Product.where((product) => product.id.isNotNull()).deleteAll();
```

:::warn Skip this and you will lose an hour
Nothing breaks now. It breaks in three steps' time, when a test asserts there is
one product and finds two — because the previous test's product is still there.
The failure appears in a test you did not touch, in a file that looks correct,
and points at your handler rather than at this line.

That is worth noticing as a general shape: **the bug and its cause are often in
different files.** When something fails in code you did not change, ask what you
*did* change that it depends on.
:::

## And the real tables?

Describing a table is not the same as creating one. There are two databases, and
they get theirs differently:

- **The test database** — handled for you. `npm test` runs
  `prisma-cli db init` before the suite and creates whatever the contract
  declares and the database lacks. You do nothing.
- **The development database**, which the app in the container uses. Create the
  table there with:

```bash
docker compose exec app npx prisma-cli db init --no-interactive --yes
```

That runs *inside* the container, which is the only place the database's
hostname resolves — `.env` points the app at `db:5432`, a name that only exists
on the container network.

Then restart the app so it reloads the contract:

```bash
docker compose restart app
```

:::note Not how real schema changes work
`db init` only adds what is missing. It will not rename a column or change a
type on a table that already has data — for that a project uses *migrations*,
ordered scripts that move a database from one shape to the next without losing
anything. You will meet them the first time you change an existing model. For a
brand new table, `db init` is enough.
:::

:::try
Make the changes, run both commands, then commit. `git add` the contract and
both generated files together — they belong in the same commit, because a
`contract.ts` without its regenerated `contract.json` is a broken checkout for
whoever pulls it.

Something like: `Add a Product model to the contract`
:::
