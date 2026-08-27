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

Twenty-nine steps in two parts, about eighteen hours of focused work. The
sidebar calls them weeks, which is how most teams run it — the first part on day
one or two, the second across the rest of the fortnight, with real tickets in
between. Each step is sized to be finished in a sitting and shows its budget.

It assumes no prior knowledge, and introduces each idea **at the point it is
needed, attached to something the trainee runs** — there is no theory phase to
sit through.

### Week one — contributing to a project · 8.8 hr

| Part | | Steps |
|---|---|---|
| Getting set up | 1½ hr | Docker; git identity and GitHub auth; dependencies and the lockfile; branch names |
| Your first change | 1½ hr | A JSX and Tailwind edit; the first commit; a conflict, made and resolved |
| Reading the code | 3 hr | Everyday JavaScript; TypeScript; promises; naming; using AI without outsourcing the thinking |
| How the app works | 2¼ hr | HTTP by `curl`; proving server and browser are different machines; components and props, and writing one; `'use client'` |
| Your first pull request | ¾ hr | Push, open, describe, get reviewed, reply, close |

### Week two — building a feature · 9.4 hr

| Part | | Steps |
|---|---|---|
| Taking on a task | 1 hr | Decomposition; claiming an issue and moving the card |
| Storing it | 1 hr | A `Product` model, a schema change and a foreign key |
| Building it, tested | 4¼ hr | What a test is for; red/green; PREP and docblocks; `POST`; validation, injection and secrets |
| When it breaks | ¾ hr | Four windows, three deliberate breaks, and print debugging |
| Putting a page on it | 1¼ hr | A page, three planted bugs, accessible names, a browser test |
| Shipping it | 1¼ hr | Lint and CI; being reviewed and reviewing; what merging does; cleanup |

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

Sixteen questions across the course ask the trainee to produce an answer rather
than pick one. The case for that is the testing effect: retrieving something is
itself a learning event, and producing an answer is a stronger one than
recognising it among four. Rowland's meta-analysis reports free recall at g=0.81
against recognition at g=0.36 — though those come from his high-exposure subset;
in the full data set the two are level, so read it as a reason to prefer recall,
not a settled margin. Three of the sixteen are deliberately spaced: they ask for
something learned hours earlier, at the moment it comes up again.

The answer is **recorded the moment it is submitted**, and the author's model
answer is always revealed to compare against. Two things then comment on it,
and neither can stop anybody:

- **Offline, always.** `conceptsCovered` marks which of the author's points the
  answer touched, by generous word overlap. So a trainee with no key still
  learns which idea they missed rather than only seeing a model answer.
- **Via Groq, if a key is present.** A sentence of feedback on their actual
  wording.

One question, `decomposition.plan-review`, is the exception that motivated the
whole feature: the trainee pastes their own task list and the model comments on
the breakdown. Whether a task is really *one* task is the single judgement in
this course that no check can make — `plan-tasks` can count items and
`plan-ordered` can catch a page built before its storage, and that is the limit
of what reading a file can tell you. That question sets `structural: true`,
which turns the offline word match off: its rubric describes the shape of a task
list, and a good answer is a list that never uses those words.

**The AI verdict never gates anything.** The card unlocks on having written an
answer of at least 40 characters — checked server-side, offline. That is a
liveness check, not a grade, and it is deliberately not one: the retrieval
benefit comes from attempting, and a gate that can strand somebody on their
first morning is worse than a gate that lets a weak answer through. A trainee
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

A `:::blank` marks its answers as `{{shape:answer|other}}`. The shape — `kebab`,
`camel`, `pascal`, `screaming`, `bool` — is graded when the exact wording is not
the lesson: a name of the right shape is accepted and told what this project
would have called it. Requiring one exact string marks correct answers wrong,
which is the worst thing a practice exercise can do.

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
