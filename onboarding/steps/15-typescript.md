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

=== attest=saw-editor-error
## See it catch something

This is the part worth doing rather than reading.

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
types claim — which is precisely why the endpoint you are about to write checks
its input by hand.
:::

=== check=tsc-clean quiz=union-meaning ask=why-annotations
## Check and clean up

Make sure the quotes are back, then:

```bash
npx tsc --noEmit
```

Silence is success — it prints nothing when there is nothing wrong.

:::note If you left the mistake in
```bash
git restore __tests__/api/posts.test.ts
```
:::
