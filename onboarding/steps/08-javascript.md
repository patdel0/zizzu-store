You already write some JavaScript. This project uses four bits of it constantly,
in every file you are about to read, and they are worth ten minutes each.

Nothing to install. Open `app/api/posts/route.ts` and follow along — every
example below is a line from a file in this repository.

===
## Files are sealed boxes

Top of `route.ts`:

```typescript
import { db } from '@/lib/prisma/db';
```

And in `lib/prisma/db.ts`:

```typescript
export const db = postgres<Contract>({ ... });
```

**Nothing outside a file can see anything inside it unless the file offers it.**
`export` is the offer. `import` is another file asking for it by name.

Two shapes you will see:

```typescript
import { db } from '@/lib/prisma/db';        // a named export
import type { NextRequest } from 'next/server';  // a type, erased at runtime
```

`import type` says "I only need this for type-checking" — it disappears when the
code runs.

:::note What `@/` means
The top of the project, set up in `tsconfig.json`. `@/lib/prisma/db` means
`lib/prisma/db` from the project root, so a file can move without every import
in it breaking.
:::

=== quiz=what-import-does
## Functions written as expressions

```typescript
db.orm.public.Post.orderBy((post) => post.createdAt.desc())
```

That `(post) => post.createdAt.desc()` is a **function being passed as an
argument**. Longhand it would be:

```typescript
function (post) { return post.createdAt.desc(); }
```

The arrow form drops the word `function`, and when the body is a single
expression it returns it without you writing `return`.

You will see it everywhere: `.map()`, `.filter()`, `onClick={() => …}`, and every
Prisma query in the codebase. `()` with nothing in it just means it takes no
arguments.

===
## Taking things out by shape

```typescript
const { data } = await response.json();
```

That is shorthand for `const data = body.data`. The braces are a **pattern**
describing what you want out of the object.

Square brackets do it for arrays, by position:

```typescript
const [posts, setPosts] = useState(null);
```

Which is why the two things `useState` hands back can be called anything — they
are just the first and second items, and you name them as you unpack them.

It works on arguments too. In `posts-board.tsx`:

```typescript
function Field({ label, name, required }) {
```

That takes **one** object and pulls three properties out of it on the way in.

=== quiz=destructure
## Two small operators

```typescript
content: content ?? null
```

`a ?? b` means *a, unless a is missing, then b*. Only `null` and `undefined`
count as missing — `0` and `''` are values and are kept, which is the whole
reason to use it instead of `||`.

```typescript
body?.choices?.[0]
```

`?.` stops rather than throwing if the thing on the left is missing. Without it,
reaching into an object that turned out to be `undefined` crashes.

:::note You have now met everything in a route handler except one thing
Open `app/api/posts/route.ts` again and read the `GET` function. Imports,
arrow functions, destructuring, `??` — you can now name all of it.

Except the word `await`, which is on nearly every line. That is the next step,
and it is the one that bites hardest when you get it wrong.
:::
