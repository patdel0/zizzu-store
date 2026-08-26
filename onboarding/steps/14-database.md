Your plan starts with the table. This step makes the database able to store a
product.

Six short cards, one thing each. Nothing to memorise.

===
## Look at one that already exists

Open `lib/prisma/contract.ts` in your editor and find this near the top:

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

Read it as a sentence: *there is a table called `Post`, and every row in it has
an id, a title, some content, an author, and two timestamps.*

That block is called a **model** — the description of one table. Not the data in
it; the shape of it.

:::why What a table is, if you have not met one
A database holds **tables**. A table is a grid, like a spreadsheet:

| id | title | content |
|---|---|---|
| `0199…a1` | Hello | World |
| `0199…b2` | Second post | *(nothing)* |

Each **column** is one kind of information every row has. Each **row** is one
actual thing — here, one post.

Every column has a type, and the database enforces it. `title` holds text,
`createdAt` holds a timestamp. Try to save the word "banana" where a number
belongs and it refuses. A whole class of bad data simply cannot get in.
:::

:::why Why a file describes the tables
In many projects you would create tables by writing SQL by hand. Here, this one
file describes them, and [Prisma](https://www.prisma.io/docs) builds both the
real [Postgres](https://www.postgresql.org/docs/) tables *and* the TypeScript
types from it.

That is why your editor autocompletes every column name, and why a typo is an
error before you ever run the code.
:::

===
## Try the shape before you write it

A product needs a name, an optional description, and a price.

Three of the four answers are in the `Post` model above. The fourth is `int` —
there is no whole-number column in `Post`, so you could not have got that one by
looking.

:::blank Complete the Product model
const Product = {{camel:model}}('Product', {
  fields: {
    id: field.id.uuidv7String(),
    name: field.{{camel:text|string}}(),
    description: field.text().{{camel:optional|nullable}}(),
    priceCents: field.{{camel:int|integer|number}}(),
    createdAt: field.temporal.createdAt(),
    updatedAt: field.temporal.updatedAt(),
  },
});
:::

Two of those are worth a second look: `description` is `.optional()`, so a
product may have none. `priceCents` is `field.int()` — a whole number.

:::why Why the price is in cents
Money is stored as a whole number of cents, everywhere, always. £9.99 is `999`.

Decimal numbers in computers are approximations: `0.1 + 0.2` really does come to
`0.30000000000000004` in JavaScript. That rounding error is invisible until it
lands in someone's invoice. Store cents as an integer, divide by 100 when you
show it, and the problem never exists.
:::

=== check=sandbox-branch,model,exported
## Now write it for real

In `lib/prisma/contract.ts`, add the `Product` model next to `Post` — the block
you just completed.

Then add it to the list the file returns at the bottom, next to `User` and
`Post`:

```typescript
return {
  models: {
    User: User.relations({
      posts: rel.hasMany(Post, { by: 'authorId' }),
    }),
    Post: Post.relations({
      author: rel.belongsTo(User, { from: 'authorId', to: 'id' }),
    }),
    Product,
  },
};
```

Declaring the model is not enough on its own — only models in that list can be
queried.

=== check=emitted
## Rebuild the generated files

```bash
npx prisma-cli contract emit
```

:::why What that command just did
It read `contract.ts` and rewrote two files next to it: `contract.json`, which
the running app reads, and `contract.d.ts`, which your editor reads. Both are
committed, because the app needs them to run.

Run it every time you change the contract. Forgetting is the most common way to
get an error that makes no sense — your editor insisting `Product` does not
exist while you are looking straight at it.
:::

=== check=reset
## Tell the tests about it

Open `test/helpers.ts` and find `resetDatabase`. Add one line at the top of it:

```typescript
await db.orm.public.Product.where((product) => product.id.isNotNull()).deleteAll();
```

:::warn Skip this and you lose an hour
That function empties the tables before every test, and it lists them by hand —
so a table it does not know about keeps its rows between tests.

Nothing breaks now. It breaks three steps from now, when a test says there is
one product and finds two. The failure shows up in a test you did not write, in
a file that looks correct, and points at your handler instead of at this line.

**The bug and its cause are often in different files.** When something fails in
code you did not change, ask what you *did* change that it depends on.
:::

===
## Create the actual table

Describing a table is not the same as making one. There are two databases:

**The test database** — nothing to do. `npm test` creates whatever the contract
declares and the database lacks, before the suite runs.

**The development database**, which the app in the container uses:

```bash
docker compose exec app npx prisma-cli db init --no-interactive --yes
```

```bash
docker compose restart app
```

:::why Why that one runs inside the container
`.env` points the app at `db:5432` — a hostname that only exists on the
container network, so the command has to run where that name resolves.
:::

:::why This is not how schema changes usually work
`db init` only adds what is missing. It will not rename a column or change a
type on a table that already holds data — that needs *migrations*, ordered
scripts that move a database from one shape to the next without losing
anything. You will meet them the first time you change an existing model. For a
brand new table, `db init` is enough.
:::

:::try
Commit the contract and both generated files together — a `contract.ts` without
its regenerated `contract.json` is a broken checkout for whoever pulls it.

```bash
git add lib/prisma test/helpers.ts
git commit -m "Add a Product model"
```

Then tick the line off your `PLAN.md`.
:::
