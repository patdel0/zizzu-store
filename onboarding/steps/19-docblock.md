You wrote your PREP as a comment above `parsePriceCents`. That comment was for
you, while you were deciding.

Now turn it into one for the next person — and for your editor, which can read a
particular shape of comment and show it to whoever is calling your function.

===
## See what one does first

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

=== check=sandbox-branch,has-docblock,docblock-useful attest=saw-hover
## Write yours

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
