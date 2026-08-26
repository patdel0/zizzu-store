Last step. Close the loop, put the repository back how you found it, and take
the cheat sheet with you.

## Finish up

1. **Close your pull request without merging it.** On the PR page: "Close pull
   request", below the comment box.
2. **Move your issue to Done** on the board.
3. **Go back to `main`:**

```bash
git switch main
```

Your branch still exists, and so do all your commits — closing a PR does not
delete anything. If you want it gone:

```bash
git branch -D sandbox/your-name
git push origin --delete sandbox/your-name
```

Deleting a merged branch is normal housekeeping on a real project. The work is
in `main`; the label is just clutter.

---

## The loop, from here on

Every piece of work you do looks like this:

```mermaid
flowchart TD
    A[Pick an issue<br/>assign yourself, move to In progress] --> B[git switch main && git pull]
    B --> C[git switch -c feature/12-short-name]
    C --> D{{"Write a failing test<br/>Make it pass<br/>Tidy up"}}
    D -->|commit as you go| D
    D --> E[npm test<br/>the whole suite, not just yours]
    E --> F[git push -u origin branch]
    F --> G[Open a PR<br/>move to In review]
    G --> H[Respond to review<br/>push more commits]
    H --> I[Merge<br/>move to Done, delete the branch]
    I --> A
```

## Commands

**Every day**

```bash
./script/server                  # start the containers
docker compose watch             # sync your edits into the app container
docker compose logs -f app       # what is the server actually saying?
npm test                         # the Vitest suite
npm test -- path/to/one.test.ts  # just one file
npm run test:e2e                 # Playwright (stop the app container first)
```

**Git**

```bash
git status                       # when in doubt, run this
git diff                         # what have I changed?
git switch -c feature/12-thing   # new branch
git add <file>                   # stage a change
git commit                       # record it
git commit --amend               # fix the last commit (before pushing)
git log --oneline                # recent history
git push -u origin <branch>      # first push of a branch
```

**Database**

```bash
npx prisma-cli contract emit                                   # after editing contract.ts
docker compose exec app npx prisma-cli db init --no-interactive --yes
docker compose restart app                                     # reload the contract
```

## Where to look things up

| Question | Where |
|---|---|
| How do I add an endpoint? | `docs/api-routes.md`, and `app/api/posts/route.ts` |
| How do I write a test? | `docs/testing.md`, and `__tests__/api/posts.test.ts` |
| How do I query the database? | `docs/prisma-next.md` |
| How does a page work? | `app/posts/page.tsx` and `app/posts/posts-board.tsx` |

When those do not answer it, ask. Two hours is enough.

## What to actually remember

Most of what you did today was mechanics, and mechanics you will absorb without
trying. Four things are worth carrying deliberately:

**Write the test first.** Not because it is virtuous — because a test you have
watched fail is the only kind you have any reason to trust.

**Commit small, and say what the commit does.** The commit message is the only
part of today's work someone reads in six months.

**Copy the existing pattern.** A codebase where every feature looks the same is
one you can move around in. Consistency beats your better idea, most of the
time.

**Ask at two hours.** Nobody remembers the question you asked. They remember the
week you spent stuck.

Welcome to the team.
