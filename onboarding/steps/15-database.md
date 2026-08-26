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

=== check=seller-field,seller-relation,emitted-again
## Changing a table that already exists

`db init` made the table. It will not change it — it only ever adds what is
missing, and it will not touch a table that already exists.

That matters, because almost every schema change you make from now on will be to
a table that is already there, often with rows in it. So do one now.

Products need a seller. Open `lib/prisma/contract.ts` and change your `Product`
model:

```typescript
const Product = model('Product', {
  fields: {
    id: field.id.uuidv7String(),
    name: field.text(),
    priceCents: field.int(),
    sellerId: field.uuidString().optional(),
    createdAt: field.temporal.createdAt(),
    updatedAt: field.temporal.updatedAt(),
  },
});
```

And in the `models` block at the bottom, give it the other half:

```typescript
Product: Product.relations({
  seller: rel.belongsTo(User, { from: 'sellerId', to: 'id' }),
}),
```

Then regenerate, as always:

```bash
npx prisma-cli contract emit
```

=== attest=dry-run-read
## Look before you leap

Do not apply it yet. Ask what it *would* do:

```bash
docker compose exec app npx prisma-cli db update --dry-run
```

`--dry-run` prints the operations and changes nothing. Read them. This is a
habit worth building now: on a database with real customers in it, the dry run
is the difference between a change and an incident.

When you are happy:

```bash
docker compose exec app npx prisma-cli db update
```

:::note If it asks you to type the database name
That is the safety catch. `db update` applies an operation that could destroy
data only after you confirm it by typing the name — so a careless `--yes` cannot
drop a column. Read what it is about to do before you type anything.
:::

===
## Two things just happened

**One: you added a foreign key.** `sellerId` holds the `id` of a row in `User`,
and `rel.belongsTo` is what tells the database and the query builder that those
two columns are connected. That is all a relation is — a column holding another
table's key, plus a written-down statement of what it points at.

Now the query builder can follow it, and you never write the join yourself:

```typescript
const products = await db.orm.public.Product.include({ seller: true }).all();

products[0].seller?.name;
```

**Two: you made it optional, and you had no choice.** `Product` may already have
rows. A required column has to have a value in every row, and nobody can say
what the seller of an existing product should be — so the database would refuse,
and it would be right to.

That is the shape of most schema changes on a live table:

| You want | What actually happens |
| --- | --- |
| Add an optional column | Fine. Existing rows get `null`. |
| Add a required column | Rejected, unless you supply a default |
| Rename a column | Two steps — add the new, backfill, drop the old |
| Drop a column | Data is gone. Confirm carefully. |

:::why Where migrations come in
On your machine, `db update` compares and applies. A production database cannot
work that way: the change has to be reviewed before it runs, and it has to run
the same way everywhere, in the same order. That is what a *migration* is — the
change written to a file and committed, so it can be read in review and replayed
on every environment.

`npx prisma-cli migration plan` writes one, and `npx prisma-cli migrate` applies
the pending ones. You will use them the first time you change a table that has
real data behind it. Today, on a database only you can see, the direct route is
fine — and knowing that it is the direct route is the point.
:::

:::try
Commit the change and the regenerated files together, as before.

```bash
git add lib/prisma
git commit -m "Add a seller relation to Product"
```
:::
