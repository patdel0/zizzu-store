You have changed something you can see. Before building something new, here is
what happens between a person clicking a button and a row landing in the
database.

Everything below is really happening on your machine right now, at
[localhost:3000/posts](http://localhost:3000/posts). Open it in one tab and read
this in the other.

## The trip

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant P as page.tsx
    participant C as posts-board.tsx<br/>(in the browser)
    participant R as route.ts
    participant D as Postgres

    B->>P: you visit /posts
    P-->>B: HTML for the page
    Note over C: the page appears,<br/>then the component wakes up
    C->>R: GET /api/posts
    R->>D: SELECT * FROM "Post"
    D-->>R: rows
    R-->>C: { data: [ ... ] }
    Note over C: the list renders

    Note over B,D: you submit the form
    C->>R: POST /api/posts
    R->>R: validate the body
    R->>D: does that author exist?
    D-->>R: yes
    R->>D: INSERT INTO "Post"
    D-->>R: the new row
    R-->>C: 201 { data: { ... } }
    Note over C: the new post joins the list
```

Four files, and each has one job:

| File | Job |
|---|---|
| `app/posts/page.tsx` | The page's structure. Runs on the server. |
| `app/posts/posts-board.tsx` | The interactive part. Runs in the browser. |
| `app/api/posts/route.ts` | Answers HTTP requests. Runs on the server. |
| `lib/prisma/contract.ts` | Says what a `Post` is. |

## Server and browser are different worlds

This is the idea that makes Next.js confusing until it clicks.

**By default, components run on the server.** They execute once, produce HTML,
and that HTML is sent to the browser. The component's code never reaches the
user. It can read files, hold secrets, and query the database directly.

**A component marked `'use client'` also runs in the browser.** That is what
`app/posts/posts-board.tsx` does, on its very first line. It has to: it uses
`useState` and `useEffect` and responds to a form submission, and none of that
exists on a server that finished its work milliseconds ago.

The catch is what a Client Component *loses*. Its code is shipped to the user's
browser, so it cannot hold a database password, and it has no direct line to
Postgres. If it needs data, it has to ask the server over HTTP.

That is the entire reason `/api/posts` exists.

:::note So when do you need a Route Handler?
Only when data has to move **after** the page has loaded. A page that just
displays things is better as a Server Component querying the database directly —
one round trip instead of two, and less code.

`posts-board.tsx` needs one because the list changes when the user submits the
form, long after the server has moved on.
:::

## What the endpoint does

Open `app/api/posts/route.ts` and read the `POST` function. Ignore the details;
notice the shape:

1. Try to parse the body as JSON. If that fails → **400**.
2. Validate the fields. Missing title, title too long, author id not a UUID → **400**.
3. Check the author actually exists → if not, **422**.
4. Create the row → **201**, with the new post.
5. Anything unexpected → log it on the server, answer **500** with a generic message.

Five outcomes, and only one of them is the happy path. That ratio is normal, and
it is most of why endpoints are longer than you would expect.

Those are the status codes from step 3, doing their job: the 422 is "I
understood you, but that author does not exist", which is a different problem
from the 400s above it and deserves a different answer.

:::warn Never let an error leak
Look at `internalError` at the bottom of the file. It logs the real error where
the team can see it, and sends the caller a flat message. A raw database error
sent to a browser can contain table names, queries, sometimes connection
strings. Log the detail, return the summary.
:::

## One shape for every response

Every handler in this project answers `{ data }` or `{ error }`. Never a bare
array, never a different field name.

That is a convention, not a rule Next.js enforces — and conventions are what let
a codebase stay readable as it grows. Anyone can consume any endpoint here
without reading it first, and your new endpoint will be no exception.

Four questions before you build one.
