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

That word is doing real work — it is the `unknown` from {{step:typescript}}, so
nothing can be done with this value until it has been checked.

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
=== check=sandbox-branch,prep-notes,exported,examples-are-tests,passes ask=why-examples-first
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

Keep the PREP as a comment. In six months it tells the next
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

They must fail first.

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

===
## Now write down what you decided

PREP is done. You have a tested function, and — this is the part that
evaporates — a set of decisions nobody else can see. Why `"899"` is refused.
Why zero is not a price. You reasoned it out an hour ago and the code does not
say any of it.

The rest of this step is about leaving that where the next person finds it,
which in this codebase means a **docblock**: the `/** … */` comment above a
function.

Start by seeing what one buys you.

Open `__tests__/api/posts.test.ts` and find a call to `createPost`. Hover over
the word `createPost`.

Your editor shows you this, without you opening the file it came from:

> Creates a post. Creates an author too unless you pass one.

That text is not magic. It is sitting in `test/helpers.ts`, in a comment
directly above the function:

```typescript
/** Creates a post. Creates an author too unless you pass one. */
export async function createPost(
```

**Two stars.** `/**` is a **docblock**; `/*` and `//` are ordinary comments and
your editor ignores them. That single character is the whole difference between
a note nobody sees and documentation that follows the function around.

===
## The two tags worth using

A docblock can be one line, like the one above. When a function takes something
and gives something back, say both:

```typescript
/**
 * Turns a price from an untrusted request body into a number of cents.
 *
 * Takes the value straight from `request.json()`, which could be anything at
 * all. Gives back the price in cents, or the reason it was refused — never
 * throws.
 */
```

Your editor shows that to whoever is calling it, *while they are typing the
call* — the moment they need it and the moment they are least likely to go
looking.

:::note There is a tag syntax, and this project does not use it
You will see `@param` and `@returns` in other codebases, and your editor
understands them. Every one of the seventeen docblocks in this repository is
plain prose instead.

Match the repository. A convention is only worth anything if it is followed
everywhere, and consistency beats the better idea — which is the same advice
{{step:naming}} closed with.
:::

:::why Why not just describe it in the code
Names carry a lot, and good names beat a comment every time. But some things a
name cannot hold.

`parsePriceCents` says what it does. It cannot say that `"899"` is refused on
purpose, that the answer is in cents rather than pounds, or that it never
throws. Those are decisions, and a reader six months from now cannot recover a
decision from the code — only what was decided, not that it was.
:::

=== check=has-docblock,docblock-useful attest=saw-hover
## Write the docblock

Open `lib/products.ts`. Replace your PREP comment with a docblock, or grow it
into one — it is already most of the way there.

Aim for four lines:

- one sentence on what the function is for
- what goes in, and that it is untrusted
- what comes back, in both cases
- one line on a decision the code cannot explain, such as why the price is in
  cents

Then go to somewhere `parsePriceCents` is called — your test file — and hover
over the name. Your own words come back at you.

:::note Keep the PREP examples if you want them
The table of inputs was useful thinking and it is useful reading. There is
nothing wrong with a docblock that ends with a few example values; several
functions in this project do exactly that.
:::

===
## The habit

Write the docblock when you write the function, not later. Later never comes,
and by then you have forgotten which parts were decisions.

The test for whether it earns its place: **does it say something the code cannot
say for itself?** If it repeats the function name in longer words, delete it.

```typescript
/** Parses the price cents. */          // says nothing
/** Refuses anything that is not a
    positive whole number of cents. */  // says what counts as valid
```

You will meet this again in the next few steps: the endpoint you are about to
finish has decisions in it too — which status code means what, and why the
duplicate check happens before the write.
