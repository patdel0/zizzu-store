Everything from here happens on a branch of your own.

## What git is actually doing

Git records your project's history as a series of snapshots called **commits**.
Each one says: here is what changed, who changed it, and why.

A **branch** is a movable label pointing at one of those commits. `main` is the
branch everyone shares — it is meant to always work. When you start a piece of
work you make your own branch, which is just a second label starting from the
same commit. Your commits move your label forward; `main` stays where it is.

```
main      ──●──●──●
                   \
your branch         ●──●──●
```

Nothing you commit on your branch can affect anyone else until it is merged.
That is the whole reason branches exist: you get to be wrong in private.

## Make yours

```bash
git switch main
git pull
git switch -c sandbox/your-name
```

Use your actual name — `sandbox/maria`, `sandbox/tom`. Three commands, three
jobs:

1. `git switch main` — start from the shared branch.
2. `git pull` — get everyone else's latest work, so you branch from current code.
3. `git switch -c <name>` — create a new branch and move onto it.

:::warn The prefix matters
Name it `sandbox/…`. This tutorial itself lives on a branch called `onboarding`,
and git will not let you have a branch called `onboarding` *and* a branch called
`onboarding/something` at the same time — a name cannot be both a file and a
folder.
:::

## Commands you will use constantly

| Command | What it tells you |
|---|---|
| `git status` | What have I changed? What branch am I on? |
| `git branch` | What branches exist, and which am I on? |
| `git switch <name>` | Move to an existing branch. |
| `git switch -c <name>` | Create a branch and move to it. |
| `git log --oneline` | What has happened here recently? |

`git status` is the one to run whenever you are unsure. It is free, it changes
nothing, and it almost always answers your question. Run it now.

:::note "Detached HEAD" and other frights
Git error messages are famously alarming and almost never mean you have lost
work. Committed work in git is very hard to destroy. If you end up somewhere
confusing, `git status` usually tells you the way out, and asking someone is
faster than guessing.
:::
