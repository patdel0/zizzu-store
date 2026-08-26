Nearly every line you are about to write starts with `await`. It appears 31
times in the code this course asks you to type, and so far nobody has told you
what it means.

It is also the single easiest thing to get wrong in a way that produces **no
error at all**.

===
## A receipt, and the thing itself

Reading a database takes time. So does a network request. JavaScript does not
stop and wait — it hands you a **promise**: a receipt that says *the answer will
be here later*.

```typescript
const posts = db.orm.public.Post.all();   // a receipt
const posts = await db.orm.public.Post.all();   // the posts
```

`await` is "wait for the receipt to be honoured, then give me the thing".

Two rules that follow from that:

- **`await` only works inside a function marked `async`.** That is why you see
  `export async function GET` — the `async` is what buys you the `await`s inside.
- **An `async` function always hands back a promise**, even if its body returns
  a plain number. So callers of your function will `await` it too.

=== attest=saw-undefined
## Get it wrong on purpose

**1.** Open `__tests__/api/posts.test.ts` and find, in the newest-post-first
test:

```typescript
const { data } = await response.json();
```

**2.** Delete the word `await`. Save.

**3.** Run it:

```bash
npm test -- __tests__/api/posts.test.ts
```

You get something like:

```
TypeError: Cannot read properties of undefined (reading 'map')
```

Not "you forgot an await". A different error, about a different line, blaming
`data` — because `data` came out `undefined`. You destructured `data` from a
**receipt**, and a receipt has no `data` on it.

**4.** Put the `await` back.

=== check=await-restored quiz=forgotten-await
## Why this one is dangerous

Three things a forgotten `await` gives you, and none of them says "await":

| You write | You get |
|---|---|
| `String(promise)` | `[object Promise]` |
| `promise.data` | `undefined` |
| `JSON.stringify(promise)` | **`{}`** |

That last one is the bad one. Forget an `await` in a route handler and the
caller gets `{}` — a valid, successful, empty response. **Nothing throws.
Nothing is logged. The status code is 200.**

This is the shape of bug that costs a junior a whole afternoon: correct-looking
code, a wrong answer, and nothing at all to read.

:::note How to spot it
When something is `undefined` or `{}` and you cannot see why, **look for a
missing `await` first**, before anything else. In this codebase, if a line calls
the database, a `fetch`, or `.json()`, it needs one.

TypeScript catches many of these, which is another reason `npx tsc --noEmit` is
worth running before you push.
:::

=== ask=what-async-returns
## Where you will meet it

Every one of these, from files you have already opened:

```typescript
const body = await request.json();                    // reading a request
const posts = await db.orm.public.Post.all();         // reading the database
const response = await GET(getRequest('/api/posts')); // calling a handler in a test
const { data } = await response.json();               // reading a response
await page.getByLabel('Title').fill('Hello');         // driving a browser
```

Same idea each time: something takes a moment, so you get a receipt, and `await`
turns it into the thing.

:::why The older way, which you will still see
Before `await` there was `.then()`:

```typescript
db.orm.public.Post.all().then((posts) => { ... });
```

Same promise, different syntax for waiting on it. You will meet it in older code
and in documentation. `await` is the same machinery with the nesting flattened
out, which is why it won.
:::
