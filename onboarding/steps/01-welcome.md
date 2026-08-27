Welcome. This tutorial assumes you know nothing about how a web project works,
because most people starting their first one don't, and pretending otherwise
just wastes your time.

So it starts at the beginning: what a server is, what happens when you open a
website, what an API is, what a database is for. Only then does it touch this
project's code.

===
## What you will end up doing

By the end you will have added a working feature to a real codebase — a
database table, an endpoint, a page, and tests for all of it — and taken it
through the process a working team actually uses: a branch, small commits, a
pull request, a review.

Expect two days, and longer is common — the estimates on each step assume you
are not stopping to understand anything, which you should be. Nobody is timing
you.

=== quiz=sandbox
## Nothing you do here counts

You will work on your own throwaway branch, and at the end you will close your
pull request **without merging it**. The project ends up exactly as you found
it.

That is deliberate. It means there is no way to break anything, so you can stop
being careful in the way that makes people slow — clicking nothing, changing
nothing, asking permission for everything. Delete things. See what happens.

:::note If you break something badly
You cannot damage the real project. Your work happens on your own branch, and
every step that changes something tells you how to put it back.

Two things do not come back on their own, and it is better to know now than to
be surprised:

- **Files you made but never committed.** They follow you when you switch
  branches, because git is not tracking them yet.
- **The development database.** It lives in Docker, not in git, so a branch
  switch does nothing to it.

{{step:cleanup}} resets both, and tells you the commands.
:::

===
## How it works

Each step explains an idea, asks you to do something in your editor and your
terminal, then **checks your real repository** — your files, your branch, your
commits, your tests.

Nothing is simulated. When a check goes green, the thing really works. When it
goes red, it tells you what it looked for and what to do next.

Some steps ask questions instead. Those are not an exam; you can answer as many
times as you like. They exist because reading something and
having understood it are different, and it is better to find out now.

:::warn Leave this running — and note how to restart it
Keep the tutorial server in its own terminal tab. It loaded everything it needs
when it started, so you can switch git branches freely without disturbing it.

This takes a few days, so at some point you will close that tab or restart your
machine. **Write this down somewhere outside the project**, because the command
lives on a branch you are about to switch away from:

```bash
git switch onboarding && ./onboarding/start
```

Then reopen [localhost:4000](http://localhost:4000). Set `ONBOARDING_PORT` if
4000 is taken. Switch back to your own branch afterwards — the server does not
care which branch you are on once it is running.

Your progress is saved outside the project, so closing the browser tab, or your
laptop, loses nothing.
:::

===
## Three things worth knowing up front

**Being stuck is the job.** Not a phase you get through. People with twenty
years of experience are stuck several times a week; they have just got faster at
recognising it and asking. There is a whole step on how to ask well.

**You are not expected to remember this.** Nobody holds a codebase in their
head. They know roughly where to look, and they look. This tutorial is trying to
give you the "roughly where", not a memorised map.

The handbook in the sidebar is the rest of that: the ten tools this project
uses and what each one is for, every convention, and the commands. It is there
to be consulted, not read — nothing in it is on the path through the course.

**Feeling lost never fully goes away.** Every developer feels it dropping into
an unfamiliar codebase — on their first day, again at their next job, and again
in the corner of this system they have not opened yet. What experience changes
is not the feeling but how long it lasts: fundamentals let you recognise the
shape of things faster, so the fog clears in an afternoon instead of a
fortnight.

Next, get the thing running.
