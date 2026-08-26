In a few steps you create your first files. Three rules bite at that moment; the
rest is in the handbook.

===
## The shape tells you what it is

| Shape | Looks like | Used for |
|---|---|---|
| camelCase | `parseLimit` | functions, variables |
| PascalCase | `PostsBoard` | components, types |
| kebab-case | `posts-board.tsx` | **file names** |
| SCREAMING_SNAKE | `MAX_LIMIT` | fixed values at the top of a file |

You get that for free, from capital letters.

:::try Check it yourself
```bash
git ls-files '*.ts' '*.tsx' | grep -v node_modules
```

Every file: lowercase, hyphens. No exceptions in the whole repository.
:::

=== quiz=file-case,which-extension
## The two that will actually bite you

**Three filenames are not yours to choose.** Next.js reserves `page.tsx` (a
page), `route.ts` (an endpoint) and `layout.tsx` (the shell). Exactly lowercase.
Call it `Page.tsx` and Next.js does not find it — no error, just a 404 and
twenty minutes.

**`.tsx` if the file contains JSX**, `.ts` otherwise. Put JSX in a `.ts` and the
error you get will not mention JSX.

:::why Why files are lowercase when the component inside is not
`posts-board.tsx` exports `PostsBoard`. macOS and Windows treat
`PostsBoard.tsx` and `postsboard.tsx` as **the same file**; Linux — which is
what production runs — does not. A repository casual about capitals builds on
the laptop it was written on and fails on the server, complaining about a module
that is plainly there.
:::

=== quiz=function-name
## Naming a function

Start with a verb, and name **what it does, not how**.

```
parseLimit    parseCreatePost    createUser    resetDatabase
```

`parsePriceCents` survives a rewrite. `checkPriceWithRegex` becomes a lie the
day you stop using a regex — and a name that lies is worse than a vague one.

Avoid `handleX`, `doX`, `processX`: the emptiest verbs there are.

:::blank Name these the way this project would
A file holding the products board component
   app/products/{{kebab:products-board|product-board|products-list}}.tsx

The component it exports
   export function {{pascal:ProductsBoard|ProductBoard|ProductsList}}()

A function turning an unknown value into a price or a reason
   export function {{camel:parsePriceCents|parsePrice}}(raw: unknown)
:::

The **shape** is marked, not the exact word — there is more than one sensible
name for most things.

:::note When you are unsure, go and look
Find the nearest thing that already does what you are doing, and match it.
`posts` is that thing for almost everything you are about to write.

A convention you match without understanding beats one you invent.
:::
