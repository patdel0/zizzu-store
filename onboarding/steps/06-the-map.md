Last step before you touch anything. This is the project itself: what is in it,
and where.

## What Zizzu is

A web shop. The pieces:

| Piece | What it does |
|---|---|
| **Next.js** | The web framework. Serves pages *and* answers API requests. |
| **React** | How pages are described, as reusable components. |
| **TypeScript** | JavaScript with types, so mistakes are caught before you run anything. |
| **Tailwind CSS** | Styling written as small classes on the markup. |
| **PostgreSQL** | The database. |
| **Prisma** | How the code queries the database, in typed TypeScript. |
| **Vitest** | Tests for functions and API endpoints. |
| **Playwright** | Tests that drive a real browser. |
| **Docker** | Runs the app and the database, so everyone's machine matches. |

Nine names is a lot. You do not need to know them — you need to know that they
exist, so that when one appears in an error message you know which part of the
system is complaining.

## The one rule: a folder is a URL

In Next.js, the folder structure under `app/` *is* the site's addresses. There is
no routing configuration to write.

```
app/
  page.tsx              →  /
  posts/
    page.tsx            →  /posts
  api/
    posts/
      route.ts          →  /api/posts
```

Two filenames carry all the meaning:

- **`page.tsx`** renders something a person looks at.
- **`route.ts`** answers an HTTP request from code.

Put either in a folder, and that folder's path becomes its URL.

## The whole map

```
app/
  page.tsx              the home page
  layout.tsx            the shell every page sits inside
  globals.css           styling that applies everywhere
  posts/
    page.tsx            the page at /posts
    posts-board.tsx     a component that page uses
  api/
    posts/
      route.ts          the endpoint at /api/posts

lib/prisma/
  contract.ts           what tables exist and what is in them
  db.ts                 the database client you import
  contract.json         generated — do not edit
  contract.d.ts         generated — do not edit

__tests__/api/          Vitest tests for endpoints
e2e/                    Playwright tests that drive a browser
test/                   helpers the tests share

docs/                   the project's own documentation
script/setup            install everything
script/server           start the containers
compose.yaml            what containers exist
package.json            dependencies and commands
```

:::note Files you should not edit
`contract.json` and `contract.d.ts` say "generated" because a command writes
them. Editing them by hand works until the next person runs that command and
your changes vanish. Anything labelled generated is an output, not a source.
:::

## The thing to copy

`posts` is a complete, working example of everything you are about to build: a
model, an endpoint, a page, and tests for each. **It exists to be copied.**

When you get stuck later — and you will, around step 13 — the answer is almost
always "look at how posts does it".

This is not a shortcut for beginners. Matching the existing pattern is what
experienced developers do, and what reviewers ask for when you don't. A codebase
where every feature is built the same way is one you can find your way around
after six months away.

:::try Have a look, without trying to understand it
Open these four files in your editor. Do not read them closely — just see that
they exist and roughly how long they are. You are building the `products`
version of each.

- `app/api/posts/route.ts` — the endpoint
- `app/posts/posts-board.tsx` — the page's interactive part
- `__tests__/api/posts.test.ts` — the tests
- `lib/prisma/contract.ts` — the tables
:::

Three questions, then you start the project up.
