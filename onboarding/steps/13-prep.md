Your plan has a task on it: *reject invalid input with 400 (missing name, bad
price)*.

That is still too big to type straight into an editor. What counts as a bad
price? Is `"899"` a price? Is `9.99`? Is `0`?

Those are not implementation questions — they are questions about what the
function *is*. **PREP** is a four-step habit for answering them before you write
any code, and it takes about two minutes.

| | | |
|---|---|---|
| **P** | Parameters | What goes in, and what could it be? |
| **R** | Returns | What comes out, in every case? |
| **E** | Examples | Concrete input → output pairs. These become your tests. |
| **P** | Pseudocode | The steps, in plain English. |

You are going to apply it to one small function, and end up with a real, tested
piece of code that the endpoint uses later.

===
## The function

`parsePriceCents` takes something that arrived over HTTP — so it could be
literally anything — and decides whether it is a usable price.

===
### P — Parameters

**What goes in:** one value, from a JSON body. Its type is `unknown`.

That word is doing real work.
[`unknown`](https://www.typescriptlang.org/docs/handbook/2/functions.html) is
TypeScript's way of saying "a value, but I refuse to let you use it until you
have checked what it is". The alternative, `any`, switches the checking off and
lets the bug through in silence.

So: what could actually arrive?

```
899          a valid price
"899"        a number as text — a very common mistake in a form
9.99         pounds, not cents
0            free?
-100         negative
undefined    the field was left out entirely
null         the field was sent, deliberately empty
"banana"     nonsense
1e400        bigger than a number can hold; becomes Infinity
```

Writing that list is most of the work. Every line of it is a decision waiting to
be made, and you have now seen all of them at once rather than discovering them
one crash at a time.

===
### R — Returns

Two outcomes: a valid price, or a reason it is not. This project already has a
shape for that — you saw it in `app/api/posts/route.ts`:

```typescript
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
```

So `parsePriceCents` returns `Parsed<number>`. Never throws, never returns
`null` — the caller gets either a number or a sentence explaining the refusal.

:::note Why not just throw?
Because this is not an exceptional situation. A user typing a bad price is a
normal Tuesday. Returning the reason makes the handler's job obvious — if it is
not `ok`, answer 400 with the message — and it means the reason is a string you
can put in front of a person.
:::

===
### E — Examples

Now the decisions. Write down what each input produces:

| Input | Result | Because |
|---|---|---|
| `899` | ok, `899` | An ordinary price. |
| `"899"` | error | Text, not a number. Be strict at the boundary. |
| `9.99` | error | Not a whole number of cents. |
| `0` | error | Not for sale at zero. |
| `-100` | error | Someone gets paid to take it. |
| `undefined` | error | Required field, missing. |
| `null` | error | Same. |
| `"banana"` | error | Nonsense. |

Eight examples, eight decisions made — on paper, before any code exists to argue
with.

:::warn These *are* your tests
This is the part people skip, and it is the part that pays. An example is a test
with the syntax not written yet. You do not have to invent test cases later,
because you already have them.
:::

===
### P — Pseudocode

Now, and only now, the steps:

```
if it is not a number, refuse
if it is not a whole number, refuse
if it is not greater than zero, refuse
otherwise it is fine
```

Four lines, and every one of them traces back to a row in the examples table.
Notice how short it turned out. That is normal: the thinking was the work.

=== check=sandbox-branch,prep-notes,exported,examples-are-tests,passes
## Write it

**1. Create `lib/products.ts`** with your PREP as the comment, then the
function:

```typescript
/**
 * Parses a price arriving from an untrusted JSON body.
 *
 * Parameters: `raw` — unknown, straight from `request.json()`.
 * Returns:    { ok: true, value } with a positive whole number of cents,
 *             or { ok: false, error } with a reason to show the caller.
 * Examples:   899 → ok. "899", 9.99, 0, -100, undefined, null → error.
 * Pseudocode: not a number → refuse; not whole → refuse; not > 0 → refuse.
 */
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parsePriceCents(raw: unknown): Parsed<number> {
  // your code
}
```

Keeping the PREP as a comment is not decoration. In six months it tells the next
person *why* `"899"` is refused, which the code alone does not.

**2. Turn every example into a test**, in `__tests__/products.test.ts`:

```typescript
import { parsePriceCents } from '@/lib/products';

describe('parsePriceCents', () => {
  it('accepts a positive whole number of cents', () => {
    expect(parsePriceCents(899)).toEqual({ ok: true, value: 899 });
  });

  it('rejects a number sent as text', () => {
    expect(parsePriceCents('899').ok).toBe(false);
  });

  // ...one `it` per row of your table
});
```

One `it` per example. When a test fails, its name should tell you what broke
without opening the file.

**3. Run them, and watch them fail:**

```bash
npm test -- __tests__/products.test.ts
```

:::note Postgres has to be running, even for this
`parsePriceCents` never touches the database — but `npm test` prepares the test
database once before *any* test runs, whichever file you asked for. If you see
`ECONNREFUSED ... :5432`, that is what it means: `./script/server`, then try
again.
:::

They must fail first. A test you have never seen fail is a test you have no
reason to trust — you do not know whether it is wired up to anything.

**4. Now write the function** until they pass. Your pseudocode is the
implementation; you are mostly translating it.

:::note `Number.isInteger` does more than you think
`Number.isInteger(raw)` is `false` for `"899"` (a string), for `9.99` (not
whole), for `undefined`, for `null`, and for `Infinity`. One check covers most
of your table — which you can only see *because* you wrote the table.
:::

===
## This is the habit

You just did test-driven development, without the phrase being used. Examples
before code, watch them fail, make them pass.

The next few steps do the same thing on the endpoint itself, where there is a
database involved and it is harder to see. It is the same four questions every
time:

**What goes in? What comes out? What are the cases? What are the steps?**

:::try
Commit it — the test and the function, as two separate commits, test first:

```bash
git add __tests__/products.test.ts
git commit -m "Add failing tests for parsePriceCents"
git add lib/products.ts
git commit -m "Add parsePriceCents"
```

Then tick the line off your `PLAN.md`.
:::
