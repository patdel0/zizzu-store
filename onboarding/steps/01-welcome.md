Welcome. This tutorial assumes you know nothing about how a web project works,
because most people starting their first one don't, and pretending otherwise
just wastes your time.

So it starts at the beginning: what a server is, what happens when you open a
website, what an API is, what a database is for. Only then does it touch this
project's code.

## What you will end up doing

By the end you will have added a working feature to a real codebase — a
database table, an endpoint, a page, and tests for all of it — and taken it
through the process a working team actually uses: a branch, small commits, a
pull request, a review.

It takes about a day. There is no prize for rushing.

## Nothing you do here counts

You will work on your own throwaway branch, and at the end you will close your
pull request **without merging it**. The project ends up exactly as you found
it.

That is deliberate. It means there is no way to break anything, so you can stop
being careful in the way that makes people slow — clicking nothing, changing
nothing, asking permission for everything. Delete things. See what happens.

:::note If you break something badly
`git switch main` puts you back to the untouched project, and every step here
tells you how to undo it. Nothing in this tutorial is one-way.
:::

## How it works

Each step explains an idea, asks you to do something in your editor and your
terminal, then **checks your real repository** — your files, your branch, your
commits, your tests.

Nothing is simulated. When a check goes green, the thing really works. When it
goes red, it tells you what it looked for and what to do next.

Some steps ask questions instead. Those are not a test you can fail; you can
answer as many times as you like. They exist because reading something and
having understood it are different, and it is better to find out now.

:::warn Leave this running
Keep the tutorial server running in its own terminal tab for the whole day. It
loaded everything it needs when it started, so you can switch git branches
freely without disturbing it.

Your progress is saved outside the project, so closing the browser tab, or your
laptop, loses nothing.
:::

## Two things worth knowing up front

**Being stuck is the job.** Not a phase you get through. People with twenty
years of experience are stuck several times a week; they have just got faster at
recognising it and asking. There is a whole step on how to ask well.

**You are not expected to remember this.** Nobody holds a codebase in their
head. They know roughly where to look, and they look. This tutorial is trying to
give you the "roughly where", not a memorised map.

Ready. One question, then we start from the beginning.
