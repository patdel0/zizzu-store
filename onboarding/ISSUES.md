# Seed issues

Paste these into GitHub before a trainee starts, and put them in the **To do**
column of the project board. Step 19 of the tutorial asks them to assign one to
themselves and move it across the board — that only works if there is something
there to claim.

The `gh` CLI makes this quick:

```bash
gh issue create --title "Add a Product model and /api/products endpoint" --body-file - <<'EOF'
…
EOF
```

The first three are the work the tutorial actually walks through, split the way
a real team would split it. The rest are genuine small jobs in this repository —
good second tasks, and none of them are invented busywork.

---

## 1. Add a Product model and `GET /api/products`

**Labels:** `good first issue`, `onboarding`

A store needs something to sell. Add a `Product` model to the data contract and
an endpoint to list products.

**The model**

| Field | Type | Notes |
|---|---|---|
| `id` | `field.id.uuidv7String()` | |
| `name` | `field.text()` | Required |
| `description` | `field.text().optional()` | |
| `priceCents` | `field.int()` | Whole cents — never a decimal |
| `createdAt` / `updatedAt` | `field.temporal.*` | |

**The endpoint**

`GET /api/products` returns products newest first, in the project's
`{ data }` envelope. Follow `app/api/posts/route.ts` — it is the template.

**Done when**

- [ ] `Product` is in `lib/prisma/contract.ts`, and `contract emit` has been run
- [ ] `GET /api/products` returns `{ data: [...] }`
- [ ] There is a test in `__tests__/api/products.test.ts`, committed *before*
      the route that makes it pass

Prices are stored as integer cents on purpose: decimal arithmetic rounds, and
rounding errors in money end up on someone's invoice.

---

## 2. Add `POST /api/products`

**Labels:** `good first issue`, `onboarding`
**Blocked by:** #1

Accept `{ name, description, priceCents }` and create a product.

| Situation | Status |
|---|---|
| Created | 201 |
| Body is not valid JSON | 400 |
| `name` missing or empty | 400 |
| `priceCents` is not a positive integer | 400 |
| A product with that name already exists | 422 |

Validate before touching the database, the way `parseCreatePost` does in
`app/api/posts/route.ts`. Check the duplicate name up front so it answers 422
rather than surfacing as a 500.

**Done when**

- [ ] Every row in the table above has a test
- [ ] `npm test` is green

---

## 3. Add a products page

**Labels:** `good first issue`, `onboarding`
**Blocked by:** #2

A page at `/products` that lists products and has a form to add one. Model it on
`app/posts/page.tsx` and `app/posts/posts-board.tsx`.

**Done when**

- [ ] `/products` lists products and can create one
- [ ] Prices are shown in pounds, converted at display time
- [ ] Every input is inside a `<label>`
- [ ] There is a happy-path Playwright test in `e2e/products.spec.ts`, using
      `getByRole` / `getByLabel` and no fixed waits

---

## 4. The home page is still the Next.js starter

**Labels:** `good first issue`

`app/page.tsx` is whatever `create-next-app` generated — Vercel logo, "Deploy
Now", links to the Next.js templates gallery. Replace it with something that
says what this site is.

No new dependencies, and keep it working in dark mode.

---

## 5. `README.md` says Node is not needed, but it is

**Labels:** `good first issue`, `documentation`

The README opens with "you don't need Node installed locally". That is not true:
`./script/setup` runs `npm i`, and both `npm test` and `npm run test:e2e` run on
the host.

Fix the setup instructions to say Docker **and** Node, with the version we
expect.

---

## 6. `./script/server` does not pick up code changes

**Labels:** `bug`, `developer-experience`

`script/server` runs `docker compose up -d`. The image is built with `COPY . .`,
and `up -d` does not start the `develop.watch` sync — so editing a file does
nothing until the container is rebuilt. Every new person hits this within an
hour and has no way to know why.

`docker compose watch` does the right thing. Either make `script/server` use it,
or add a `script/dev` that does and say which is which in the README.

---

## 7. The README has an empty Postgres line

**Labels:** `good first issue`, `documentation`

Under "Services":

```
- PostgresSQL:
```

No value, and "PostgresSQL" is a typo for "PostgreSQL". Should read
`postgresql://zizzu:zizzu@localhost:5432/zizzu`.

---

## 8. `npm run test:e2e` can silently run against the development database

**Labels:** `bug`, `testing`

`playwright.config.ts` sets `reuseExistingServer: !process.env.CI`. If the
containerised app is up on port 3000, Playwright reuses it — and that server is
pointed at `DATABASE_URL`, not `TEST_DATABASE_URL`. The suite then seeds
fixtures into the test database while the browser reads development data, so
tests fail confusingly. Worse, a destructive test would be pointed at real data.

Options: fail fast if the server on 3000 is not the one Playwright started, use
a different port for the test server, or document `docker compose stop app` as a
required step. The first is the only one that cannot be forgotten.

---

## 9. There is no CI

**Labels:** `infrastructure`

Nothing runs the tests when a pull request is opened, so "did you run the
tests?" is a question a human has to remember to ask.

A GitHub Actions workflow that runs `npm test` against a Postgres service
container on every PR. Playwright can come later; the Vitest suite is the one
that catches most things.

---

## 10. Products cannot be deleted

**Labels:** `enhancement`
**Blocked by:** #2

Once the products endpoint exists, there is no way to remove one.

`DELETE /api/products/[id]` — note that in a `[id]` route the `params` argument
is a promise and has to be awaited. 204 on success, 404 if there is no such
product.
