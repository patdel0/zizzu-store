# Seed issues

Paste these into GitHub before a trainee starts, and put them in the **To do**
column of the project board. The issues step asks them to assign one to
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

Nothing here is a defect planted for somebody to find. The repository's known
problems were fixed rather than left lying around: the Playwright run had its
own port so it can no longer read development data, `script/dev` syncs your
edits, and the README's setup instructions and service list are correct.

One thing that looks like a defect is not. `app/page.tsx` is still close to what
`create-next-app` generated, because {{step:first-change}} asks the trainee to
change its heading — it is that step's exercise, and replacing it beforehand
would take the exercise away.

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

## 4. There is no CI

**Labels:** `infrastructure`

Nothing runs the tests when a pull request is opened, so "did you run the
tests?" is a question a human has to remember to ask.

A GitHub Actions workflow that runs `npm test` against a Postgres service
container on every PR. Playwright can come later; the Vitest suite is the one
that catches most things.

---

## 5. Products cannot be deleted

**Labels:** `enhancement`
**Blocked by:** #2

Once the products endpoint exists, there is no way to remove one.

`DELETE /api/products/[id]` — note that in a `[id]` route the `params` argument
is a promise and has to be awaited. 204 on success, 404 if there is no such
product.
