# Onboarding

An interactive tutorial that takes a developer who has never worked on a project
before from their first HTML change to an open pull request, using this
repository as the material.

It lives on the `onboarding` branch and is never merged into `main`.

## Running it

```bash
git switch onboarding
node onboarding/server.mjs
```

Then open [localhost:4000](http://localhost:4000).

Leave it running and switch back to `main` to work — the server reads its pages
and step content into memory at boot, so it keeps serving after its own source
is no longer checked out. Set `ONBOARDING_PORT` if 4000 is taken.

There is nothing to install. It has no dependencies, which is the point: a
trainee can start it before `npm install` has ever finished.

## What it covers

Twenty-two steps, around twelve hours of focused work — so two days for most
people, and longer is normal. It assumes no prior knowledge, and
introduces each idea **at the point it is needed, attached to something the
trainee runs** — there is no theory phase to sit through.

| Phase | Steps |
|---|---|
| Getting started | The app running in Docker; configuring git so `git commit` works |
| Your first change | Branching; a JSX and Tailwind edit; the first commit |
| Seeing how it works | HTTP by `curl`; proving server and browser are different machines; `'use client'`; the request lifecycle |
| Building a feature | Decomposition; PREP; a `Product` model; TDD red/green; `POST`; validation; a page and a browser test |
| Working with the team | Issues and the board, pull requests, review, cleanup |

Concepts are taught by experiment rather than assertion. "Code in the browser
cannot keep a secret" is a paragraph anyone can skim past; finding your own
component in the browser's Sources tab is not. Two examples:

- **Server vs. browser** — the trainee adds a `console.log` to a page and
  another to a component, then watches one appear in the container log and the
  other in the browser console.
- **`'use client'`** — they build a working counter with `useState`, then delete
  the marker and read the error, then try `useState` in a Server Component and
  read that error too.

Two steps teach method rather than syntax. **Decomposition** has them write a
real `PLAN.md` task list before touching the feature, checked for being ordered
bottom-up. **PREP** — parameters, returns, examples, pseudocode — is applied to
one small function, `parsePriceCents`, which they then import and use for real
five steps later.

The trainee works on a `sandbox/<name>` branch and **closes their pull request
without merging it**. Nothing they do reaches `main`.

Every technology mentioned links to its own documentation, on the assumption
that the tutorial's job is to make the real docs approachable rather than to
replace them.

## How the checking works

Each step ends with checks that run against the real repository — `git log`,
the files on disk, `npm test`, and HTTP requests to the running app. Nothing is
simulated, and a failing check explains what it looked for and what to do next.

Three kinds of gate, mixed per step:

- **Checks** — automated, in `checks.mjs`.
- **Quizzes** — graded on the server, so the answers are not in the page source
  and a wrong guess does not reveal the right one.
- **Attestations** — tick-boxes, for things no program can verify (opening a
  pull request, moving a card on the board).

Some checks are less obvious than they look:

- Commit subjects are linted for imperative mood, length, and vagueness.
- The `tdd-red` check confirms the test fails **for the right reason** — a suite
  that fails because Postgres is down is not a red.
- The `tdd-green` check compares commit ancestry to confirm the test was
  committed *before* the code that makes it pass.

## Written answers, and the optional AI comment

Four steps ask the trainee to explain something in their own words —
`two-machines`, `decomposition`, `tdd`, `prep`, the four that teach method
rather than syntax. Articulating an idea is what makes it stick, and that works
whether or not anything reads the answer afterwards.

So the answer is **recorded the moment it is submitted**, and the author's model
answer is always revealed to compare against. If a Groq key is present, the
answer also gets a sentence of feedback. If it is not, nothing is lost and
nothing is mentioned.

**The AI verdict never gates anything.** The card unlocks on having written a
substantive answer — checked server-side, offline, deterministically. A trainee
with no key, no wifi, an expired key, a rate limit, or a retired model id
progresses exactly as anyone else does. There is no path where a third party
can stop somebody on their first morning.

### Setting it up

Optional. Put a key in `~/.zizzu-onboarding/env` — the same directory the
progress file uses:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
```

Outside the repository on purpose. `onboarding/.env` would be deleted from disk
the moment the trainee switches off this branch, which happens within a few
steps — it would appear to work until the next restart, then break somewhere
else entirely.

`ONBOARDING_LLM=off` disables the feature without removing the key.

### What is sent

The question, the rubric and model answer written by the step author, and the
trainee's typed answer. **Nothing from disk and nothing from git, ever** — not
their code, not their commits, not their name or email. The repository is
private and the deterministic checks grade the code better than a model would.
Answers are not stored; progress records only that a question was answered.

Say this to the trainee before they type. On day one they will write things like
"I don't really understand why this works" into that box, and they deserve to
know where it goes.

## Layout

```
server.mjs        zero-dependency HTTP server; loads everything at boot
checks.mjs        every step, its checks, its quiz, its attestations
lib/shell.mjs     read-only helpers: git, files, HTTP
steps/NN-<id>.md  the prose for each step (filename maps to the step id)
public/           the page: index.html, styles.css, app.js, markdown.js
public/vendor/    Mermaid, committed rather than installed
ISSUES.md         seed issues to paste into GitHub before a trainee starts
```

Diagrams are ```mermaid fences in the step markdown, rendered in the browser by
the vendored bundle. If Mermaid ever fails to load, the diagram source stays
visible in a `pre` rather than leaving a hole in the page.

Progress is stored in `~/.zizzu-onboarding/progress.json`, outside the
repository, so switching branches never loses it. "Start over" in the sidebar
clears it.

## Editing it

Add or reword a step by editing its file in `steps/`. Add a check by adding an
entry to the step's `checks` array in `checks.mjs`; a check is
`{ id, label, run }` where `run` returns `{ pass, detail }`. Mark anything that
shells out to `npm test` with `slow: SLOW` so the page warns before running it.

`detail` is the whole feedback loop. Say what was looked for and what to do
next — never just that something failed.

Restart the server after any change; it caches at boot deliberately.

## Security

The server binds to `127.0.0.1` and rejects other `Host` headers. Every command
it runs is hard-coded — the browser only ever posts a step id — and it never
writes to the repository.

## Before a trainee starts

1. Create the issues in `ISSUES.md` on GitHub and put them in the **To do**
   column of the project board.
2. Check that they have Docker and Node installed.
3. Agree who is reviewing their pull request, and tell that person it is coming.
