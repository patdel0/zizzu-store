In a few steps you create your first files. Before that, the conventions this
project already follows — because the fastest way to look like you have worked
here for a year is to name things the way everything else is named.

None of this is a matter of taste. Every rule below is already true of every
file in the repository, and you can check that yourself.

===
## Four shapes, four jobs

You will see these called *casings*. There are four, and each one means
something different here.

| Shape | Looks like | Used for |
|---|---|---|
| **camelCase** | `parseLimit` | functions, variables |
| **PascalCase** | `PostsBoard` | components, types |
| **kebab-case** | `posts-board.tsx` | file names |
| **SCREAMING_SNAKE** | `MAX_LIMIT` | fixed values at the top of a file |

The point is not the shapes. It is that **the shape tells you what kind of thing
you are looking at before you have read anything else.**

`PostsBoard` in the middle of a line is a component. `parseLimit` is something
that runs. `MAX_LIMIT` is a value that never changes. You get that for free,
from capital letters, without looking anything up.

:::try Check that I am not making it up
```bash
git ls-files '*.ts' '*.tsx' | grep -v node_modules
```

Every file: lowercase, hyphens between words. No exceptions in the whole
repository.
:::

===
## File names

**Three names are not yours to choose.** Next.js reserves them, and they must be
exactly this, lowercase:

| File | Means |
|---|---|
| `page.tsx` | the page at this folder's URL |
| `route.ts` | the API endpoint at this folder's URL |
| `layout.tsx` | the shell wrapped around pages below it |

Call it `Page.tsx` and Next.js does not find it. There is no error — the URL just
returns a 404, and you lose twenty minutes.

**Everything else is kebab-case:** `posts-board.tsx`, `global-setup.ts`,
`database-url.ts`.

:::why Why lowercase files, when the component inside is capitalised
`posts-board.tsx` exports `PostsBoard`. That looks inconsistent and it is
deliberate.

macOS and Windows treat `PostsBoard.tsx` and `postsboard.tsx` as **the same
file**. Linux — which is what your app runs on in production — does not. So a
repository that is casual about capitals in filenames works on the laptop it was
written on and fails to build on the server, with an error about a module that
is plainly right there.

Lowercase filenames make that class of bug impossible. Capitalised component
names are just JSX: React treats a lowercase tag as an HTML element, so
`<field />` would be a nonexistent HTML tag while `<Field />` is your component.
:::

===
## `.ts` or `.tsx`?

One letter, one rule: **`.tsx` if the file contains JSX.**

```
app/posts/posts-board.tsx    has markup      → .tsx
app/api/posts/route.ts       returns data    → .ts
test/helpers.ts              no markup       → .ts
```

Put JSX in a `.ts` file and TypeScript reads `<div>` as the start of a generic
type. The error it gives you will not mention JSX, which makes it a memorable
half hour the first time.

=== quiz=file-case,which-extension
## Function names

**Start with a verb**, because a function does something.

Real ones from this project:

```
parseLimit          parseCreatePost       createUser
createPost          resetDatabase         getRequest
```

Every one of those is `verb` + `what it acts on`. You can guess what it does
without opening it, which is the whole job of a name.

Three verbs to avoid:

| Avoid | Why |
|---|---|
| `handleX` | The emptiest verb there is. Handle it *how*? |
| `doX`, `processX` | Same problem. |
| `dataX`, `infoX` | "Data" is every value in the program. |

And a rule worth carrying: **name what it does, not how it does it.**
`parsePriceCents` stays true if you rewrite the inside tomorrow.
`checkPriceWithRegex` becomes a lie the moment you stop using a regex — and a
name that lies is worse than a vague one.

===
## Two more, then an exercise

**Booleans start with `is` or `has`.** From `posts-board.tsx`:

```typescript
const [createState, createPost, isCreating] = useActionState(...)
```

`isCreating` reads as a yes-or-no question where it is used —
`disabled={isCreating}`. Bare `creating` reads like it might be a list of things
being created.

**A `useState` pair is `x` and `setX`.** Always:

```typescript
const [posts, setPosts] = useState(null);
const [clicks, setClicks] = useState(0);
```

You wrote the second one yourself in {{step:use-client}}. Nobody deviates from
this and you should not either.

**Constants that never change go in SCREAMING_SNAKE at the top of the file:**

```typescript
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const TITLE_MAX_LENGTH = 200;
```

That is not decoration either. You will meet `TITLE_MAX_LENGTH` in {{step:tdd}} — it has a
name, at the top of the file, which is why you will be able to find it and change it. A
bare `200` buried in an `if` twelve lines down is a *magic number*: nobody can
tell what it means or find all the places it appears.

=== quiz=function-name
## Your turn

You are about to build the products feature. Fill in what each thing would be
called here.

:::blank Name these the way this project would
A file holding the products board component
   app/products/{{kebab:products-board|product-board|products-list}}.tsx

The component it exports
   export function {{pascal:ProductsBoard|ProductBoard|ProductsList}}()

A function that turns an unknown value into a valid price or a reason
   export function {{camel:parsePriceCents|parsePrice}}(raw: unknown)

The largest price the endpoint will accept, at the top of the file
   const {{screaming:MAX_PRICE_CENTS|MAX_PRICE}} = 100000;

Whether a form is mid-submit
   const [{{bool:isSaving|isSubmitting|isCreating}}, setIsSaving] = useState(false)
:::

:::note What is being marked
The **shape**, not the exact word. There is more than one sensible name for most
of these, and any name in the right casing counts — it will just tell you what
we would have called it here.

A name in the wrong casing does not count, because that is the part that is a
convention rather than a judgement.

:::

:::note When you are unsure, go and look
This is the honest answer for every convention in every codebase: find the
nearest thing that already does what you are doing, and match it. `posts` is
that thing for almost everything you are about to write.

A convention you match without understanding is still better than a convention
you invent.
:::
