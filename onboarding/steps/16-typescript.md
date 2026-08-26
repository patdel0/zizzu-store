Every file you are about to write ends in `.ts` or `.tsx`. That is
[TypeScript](https://www.typescriptlang.org/docs/), and it is JavaScript with
one addition: you can say what kind of thing a value is.

This step is short. You need four ideas, and you will meet all of them in the
next hour.

===
## Saying what something is

A colon after a name, then the kind of thing it is:

```typescript
const name: string = 'Mug';
const price: number = 899;
const inStock: boolean = true;
```

Same for what a function takes and gives back:

```typescript
function double(n: number): number {
  return n * 2;
}
```

Read that as: *`double` takes a number, and gives back a number.*

You will not write many of these yourself. Most of the time TypeScript works it
out — `const name = 'Mug'` is already known to be a string. You write them where
a value arrives from outside, which is exactly what an endpoint does.

===
## Two you will see everywhere in this project

**`|` means "one or the other".**

```typescript
content: string | null
```

A post's content is either some text or nothing at all. TypeScript will not let
you call `.length` on it until you have checked which one you have — and that
check is the thing it is making you remember.

**`?` means "may be left out".**

```typescript
function createPost(overrides?: { title?: string })
```

Both the argument and the `title` inside it can be missing. That is different
from `null`, which means *present, and deliberately empty*.

:::why There is a third one, and it turns up in two steps
`unknown` means "a value, but I refuse to let you use it until you have checked
what it is". It is what a JSON body from the internet is, and it is the subject
of a whole card later.

Its evil twin is `any`, which means "stop checking". `any` makes the red
underline go away without making the problem go away, which is why you will
almost never see it in this project.
:::

===
## Getting out of `unknown`

`unknown` refuses everything, so at some point you have to convince TypeScript
you have checked. That takes two steps, and you will write this exact pair
whenever a request body arrives.

Open `parseCreatePost` in `app/api/posts/route.ts` and find them:

```typescript
if (typeof body !== 'object' || body === null || Array.isArray(body)) {
  return { ok: false, error: 'Request body must be a JSON object' };
}

const { title, content, authorId } = body as Record<string, unknown>;
```

**The `if` is the real check.** It runs, and it rejects anything that is not a
JSON object — a string, a number, `null`, an array.

**The `as` is not a check.** `as` is a *type assertion*: you telling the
compiler "I know more than you do about this value, treat it as this type". It
generates no code and tests nothing at runtime.

Which makes it the one construct here you can use to lie. Say `body as string`
and TypeScript will believe you, and your code will break at runtime with a
type error you disabled the machine that finds. The pair above is safe only
because the `if` above it did the work.

| | Checks at runtime? | Safe? |
| --- | --- | --- |
| `typeof x === 'string'` | Yes | Yes |
| `x as string` | No | Only if you already proved it |
| `x as any` | No | Never — this switches off the checking |

Note what the assertion says: `Record<string, unknown>` — an object whose keys
are strings and whose **values are still `unknown`**. It claims only what the
`if` proved. Every field then gets checked individually, which is exactly what
{{step:post-validation}} has you do.

:::note Two more you will see and should leave alone
`Char<36>` in `route.ts` and `test/helpers.ts` is a *branded type* — a string
the library has marked as a UUID so a plain string cannot be passed by mistake.
You do not need to write one. When a function asks for it, pass the id you were
given and it works.

And a `!` after a value — `user!.name` — is another assertion, meaning "this is
not null, trust me". Same warning as `as`: it silences the compiler without
checking anything.
:::

=== attest=saw-editor-error
## See it catch something

**1.** Open `__tests__/api/posts.test.ts`. Find a line like this one:

```typescript
await createPost({ title: 'Older' });
```

**2.** Change the title to a number — delete the quotes:

```typescript
await createPost({ title: 42 });
```

**3.** Look at that line in your editor. It is underlined, before you have run
anything at all. Hover it:

> Type 'number' is not assignable to type 'string'.

**4.** Ask the whole project at once:

```bash
npx tsc --noEmit
```

Same error, with the file and line number. No server started. No database
touched. No test run.

**5.** Put the quotes back.

===
## Why that matters more than it looks

`createPost` says its `title` is a string. Handing it a number contradicts
something already written down — and a contradiction can be found by *reading*
the code.

That is the whole trade. You write a few extra words saying what things are, and
in exchange a large family of mistakes stops being something you discover at
runtime, and starts being something your editor points at while you type.

The mistakes it catches are the boring ones — a misspelled field, a number where
text goes, forgetting that something might be `null`. They are also, in most
codebases, the majority.

:::why It disappears before the code runs
The browser and Node cannot read TypeScript. The types are stripped out before
anything runs, and what executes is ordinary JavaScript.

So types cost nothing at runtime, and they cannot protect you at runtime either.
A JSON body arriving from outside can still be anything at all, whatever your
types claim — which is why the endpoint you are about to write checks
its input by hand.
:::

===
## Where a type goes

There is no `types/` folder in this project, and that is on purpose. **A type
lives in the file that owns it**, and is exported only if something else needs
it.

Every hand-written type in this codebase follows that. There are four:

| Type | Where | Exported? |
| --- | --- | --- |
| `Parsed<T>` | `app/api/posts/route.ts` | No — only that file parses |
| `CreatePostInput` | `app/api/posts/route.ts` | No |
| `SerializedPost` | `app/posts/posts-board.tsx` | Exported — see below |
| `CreateState` | `app/posts/posts-board.tsx` | No |

`SerializedPost` is the interesting row: it is exported, and right now nothing
outside that file imports it. Check for yourself — `grep -rn SerializedPost app`
finds two hits, both in `posts-board.tsx`.

So it is exported speculatively, which is a small mess: an exported type is part
of a file's public surface, and a reader has to assume something depends on it.
Export when something needs it, not in case. (You will meet this again in
{{step:ui}}, where the products page genuinely does need one.)

Two house rules go with it.

**Use `type`, not `interface`.** Both work and the differences rarely matter.
This project uses `type` in all four, so use `type` — the handbook rule applies
here as much as anywhere: consistency beats your better idea.

**Only name a type when the name earns it.** `CreateState` is named because
`useActionState` refers to it three times. A shape used once is clearer written
where it is used:

```typescript
function badge(product: { name: string; priceCents: number }) { … }
```

Naming that would add a line and tell the reader nothing.

===
## The one type worth looking at twice

`SerializedPost` describes a post *as it arrives over JSON*, and it is nearly —
but not quite — the database model:

```typescript
export type SerializedPost = {
  id: string;
  title: string;
  content: string | null;
  authorId: string;
  createdAt: string;   // a Date in the database
  updatedAt: string;   // and here too
};
```

JSON has no date type. `createdAt` leaves the server as a `Date` and arrives in
the browser as a string, so a type describing what the browser receives has to
say `string` — even though the same field is a `Date` two files away.

That is why it is written by hand rather than taken from the contract: it
describes the **wire**, not the table.

:::warn And that is its weakness
Nothing connects the two. Add a field to `Post` in the contract, regenerate, and
`SerializedPost` does not change — it just quietly stops describing what the
endpoint sends.

This is the same drift you met between `contract.ts` and `contract.json`, one
level further out, and here nothing catches it. When you change a model, search
for the hand-written type that mirrors it. There is usually one.
:::

:::why What about `.d.ts` files?
You will see two in this project — `next-env.d.ts` and `lib/prisma/contract.d.ts`
— and **both are generated**. Do not edit either.

A `.d.ts` holds type declarations and no code. They are written for two reasons:
to describe a JavaScript library that has no types of its own, and to declare
things that exist globally at runtime. Neither comes up in ordinary application
work, so you can go years without writing one. If you ever need to, you will
know why — and until then, a `.d.ts` you did not generate is a smell.
:::

=== check=tsc-clean quiz=union-meaning ask=why-annotations
## Check and clean up

Make sure the quotes are back, then:

```bash
npx tsc --noEmit
```

It prints nothing when there is nothing wrong.

:::note If you left the mistake in
```bash
git restore __tests__/api/posts.test.ts
```
:::
