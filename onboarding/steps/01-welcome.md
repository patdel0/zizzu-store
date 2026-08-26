Welcome. Over the next day or so you are going to take a feature from nothing
to a pull request: a database table, an API endpoint, a page, tests for all of
it, and the workflow that gets it reviewed.

Nothing you do here gets merged. You will work on a throwaway branch and close
your pull request without merging it, so you can make every mistake there is
without consequence. **That is the point.** Break things.

## How this tutorial works

Each step explains something, asks you to do it in your real editor and your
real terminal, and then checks your actual repository — your branch, your files,
your commits, your tests. When a check fails it tells you what it looked for and
what to do next.

Nothing is faked. If a check goes green, the thing really works.

:::note Leave this running
Keep this server running in its own terminal tab. It has already loaded
everything it needs, so you can switch git branches freely without disturbing
it. Your progress is saved outside the project, so closing the tab loses
nothing.
:::

## What Zizzu is

A web shop, built with:

| Piece | What it does |
|---|---|
| **Next.js** | The web framework. Renders pages *and* answers API requests. |
| **React** | How pages are described, as components. |
| **TypeScript** | JavaScript with types, so mistakes are caught before you run anything. |
| **Tailwind CSS** | Styling written as small classes in the markup. |
| **Postgres** | The database. Runs in a container. |
| **Prisma** | How the code talks to the database, in typed TypeScript. |
| **Vitest** | Tests for functions and API endpoints. |
| **Playwright** | Tests that drive a real browser. |
| **Docker** | Runs the app and the database, so everyone's machine matches. |

You do not need to know all of these. You need to know where things live and
what to copy.

## The map

The only rule you need to start: **in Next.js, a folder is a URL.**

```
app/
  page.tsx              →  the home page, at /
  layout.tsx            →  the shell every page sits inside
  posts/
    page.tsx            →  the page at /posts
    posts-board.tsx     →  a component that page uses
  api/
    posts/
      route.ts          →  the endpoint at /api/posts

lib/prisma/
  contract.ts           →  what tables exist and what is in them
  db.ts                 →  the database client you import

__tests__/api/          →  Vitest tests for endpoints
e2e/                    →  Playwright tests that drive a browser
test/                   →  helpers the tests share

docs/                   →  the project's own documentation
script/setup            →  install everything
script/server           →  start the containers
```

Two filenames carry all the meaning:

- **`page.tsx`** renders something a person looks at.
- **`route.ts`** answers an HTTP request from code.

Put either one in a folder, and that folder's path becomes its URL.

## The one thing to copy

`posts` is a complete, working example of everything you are about to build —
model, endpoint, page, tests. It exists to be copied. When you get stuck later,
the answer is almost always "look at how posts does it".

:::try Have a look around
Open these four files in your editor now. Do not try to understand them; just
see that they exist and roughly how long they are.

- `app/api/posts/route.ts`
- `app/posts/posts-board.tsx`
- `__tests__/api/posts.test.ts`
- `lib/prisma/contract.ts`
:::

Now two questions, to check the map made sense.
