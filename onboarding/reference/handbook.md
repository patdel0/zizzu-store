# Handbook

Everything you would otherwise have to remember. Everything you would otherwise have to remember. Nothing here is on the critical
path of the course.

---

## Naming

| Shape | Looks like | Used for |
|---|---|---|
| camelCase | `parseLimit` | functions, variables |
| PascalCase | `PostsBoard` | components, types |
| kebab-case | `posts-board.tsx` | file names |
| SCREAMING_SNAKE | `MAX_LIMIT` | fixed values at the top of a file |

**Files** are kebab-case. Three names are reserved by Next.js and must be exactly
lowercase: `page.tsx` (a page), `route.ts` (an endpoint), `layout.tsx` (the shell
around pages below it). A capital letter gives you a silent 404.

**`.tsx` if the file contains JSX**, `.ts` otherwise.

**Functions start with a verb**, and name *what* they do rather than *how*:
`parsePriceCents` survives a rewrite, `checkPriceWithRegex` becomes a lie.
Avoid `handleX`, `doX`, `processX`, `dataX` — they say nothing.

**Booleans** start with `is` or `has`. **`useState` pairs** are always `x` and
`setX`.

> When unsure: find the nearest thing that already does what you are doing, and
> match it. Consistency beats your better idea.

---

## Branch names

```
type/issue-number-short-description
```

| Prefix | For |
|---|---|
| `feature/` | something the app could not do before |
| `fix/` | something is broken |
| `refactor/` | tidying — **behaviour must not change** |
| `docs/` | documentation only |
| `test/` | tests only |
| `chore/` | dependencies, config, tooling |

Lowercase, hyphens, a few words. Include the issue number. The prefix tells a
reviewer what to look for — `refactor/` means "check nothing changed".

---

## Commit messages

Write the subject as a command: *applying this commit will…*

- Under 50 characters, capital letter, no full stop
- Say what changed, not that something changed
- Body wrapped at 72, for **why** — the diff already shows what

```
Reject a post title longer than 200 characters

The column is text, so a long title was accepted and then broke the
list page's layout. 200 matches the limit the design uses.
```

One commit is one idea — describable in a sentence without "and".

---

## Status codes

| Code | Means |
|---|---|
| **200** | Here it is |
| **201** | I made the thing (answers a successful `POST`) |
| **400** | I cannot make sense of what you sent |
| **404** | Nothing exists at that path |
| **422** | I understood you, and it still cannot be done |
| **500** | I broke. Not your fault |

**4xx blames the request, 5xx blames the server.** Every endpoint here answers
`{ data }` or `{ error }` — never a bare array, never a different field name.

---

## Commands

**Every day**

```bash
./script/server                  # start the containers
docker compose watch             # sync your edits into the app container
docker compose logs -f app       # what is the server actually saying?
npm test                         # the whole Vitest suite
npm test -- path/to/one.test.ts  # one file
npm run test:e2e                 # Playwright (stop the app container first)
```

**Before you push**

```bash
npm test
npx tsc --noEmit                 # type errors, without running anything
npm run lint                     # style and common mistakes
```

**Git**

```bash
git status                       # when in doubt, run this
git diff                         # what have I changed?
git switch -c feature/12-thing   # new branch
git add <file>                   # stage a change
git commit                       # record it
git commit --amend               # fix the last commit (before pushing)
git log --oneline --graph        # recent history
git push -u origin <branch>      # first push of a branch
```

**Database**

```bash
npx prisma-cli contract emit                                    # after editing contract.ts
docker compose exec app npx prisma-cli db init --no-interactive --yes
docker compose exec app npx prisma-cli db update                # when a table already exists
docker compose restart app                                      # reload the contract
```

---

## When git says something alarming

| Message | What it means | What to do |
|---|---|---|
| `CONFLICT (content)` | two branches changed the same lines | edit the file, delete the markers, `git add` then `git commit` — or `git merge --abort` |
| `Your branch is behind 'origin/main'` | somebody else pushed | `git pull` |
| `Updates were rejected` | the remote has commits you do not | `git pull`, resolve, push again |
| `detached HEAD` | you are on a commit, not a branch | `git switch -` to go back |
| `Please commit your changes or stash them` | uncommitted work blocks a switch | `git stash`, switch, `git stash pop` |
| `Permission denied (publickey)` / `403` | authentication or access | see *Pushing to GitHub* below |
| pushed something wrong | — | `git revert <sha>` makes a new commit undoing it. Never rewrite pushed history |

`git merge --abort` and `git stash` are the two escape hatches. Nothing is ever
really lost — committed work in git is very hard to destroy.

---

## Pushing to GitHub

Identity (`git config user.name`) is not permission. You also need auth:

- **`gh auth login`** — easiest, handles everything
- **SSH keys** — [GitHub's guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- **A personal access token** over HTTPS — your GitHub *password* will not work

`Permission denied (publickey)` means auth is not set up. A **403** usually means
you have not been given write access — that is an access problem, not something
you did.

---

## Using AI

While you are onboarding, two rules, no exceptions:

- **[cs50.ai](https://cs50.ai/) is the only assistant.** Not ChatGPT, not
  Claude, not Copilot, and not the one in your editor — turn that off, it
  suggests as you type. The duck is configured to lead you to an answer instead
  of handing you one, and it declines when asked to write your code.
- **No code enters the repo that you did not write yourself.** Not pasted, and
  not transcribed with the example open. Read it, look away, write it.

Then three that hold afterwards too:

- **Never commit anything you could not explain in review.** You will be asked.
- **Never trust it about this codebase.** It has not read our contract or our
  conventions, and will confidently invent a Prisma method that does not exist.
- **Ask it to read, not to write.** "Explain this line by line" and "where should
  I look? do not fix it" keep the work with you.

The evidence for the first two is in {{step:using-ai}}: producing beats reading
([d = 0.40, rising to 0.64 after a day](https://link.springer.com/article/10.3758/BF03193441)),
and students given an unguarded assistant scored
[17% worse than students who never had one](https://www.pnas.org/doi/10.1073/pnas.2422633122)
once it was taken away.

---

## Where to look things up

| Question | Where |
|---|---|
| How do I add an endpoint? | `docs/api-routes.md`, and `app/api/posts/route.ts` |
| How do I write a test? | `docs/testing.md`, and `__tests__/api/posts.test.ts` |
| How do I query the database? | `docs/prisma-next.md`, and `lib/prisma/contract.d.ts` — generated, and readable |
| How does a page work? | `app/posts/page.tsx` and `app/posts/posts-board.tsx` |
| What can `expect` do? | [Vitest](https://vitest.dev/api/expect.html) · [Playwright](https://playwright.dev/docs/locators) |
| What does this git command do? | [git-scm.com/docs](https://git-scm.com/docs) |
| What does this status code mean? | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) |

## Finding things you were never shown

```bash
grep -rn "orderBy" app lib test        # who else does this?
git log -S "parseLimit" --oneline      # when did this appear, and why?
git blame app/api/posts/route.ts       # who wrote this line?
```

In your editor: **go to definition** on any symbol, **find all references**,
and project-wide search. `lib/prisma/contract.d.ts` is generated and lists every
model, field and query method you have.
