One git message frightens people more than any other:

```
CONFLICT (content): Merge conflict in app/page.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

It looks like something broke. Nothing broke. You are going to cause one on
purpose, right now, and it will stop being frightening.

===
## What a conflict actually is

Two branches changed the same lines of the same file.

Git merges different parts of a file without asking — you edit the header,
someone else edits the footer, it takes both. It stops only when two versions
disagree about *the same lines*, because choosing one would mean silently
throwing away somebody's work.

So it stops and asks you.

**A conflict is a question, not an error.** Nobody has lost anything and nothing
is corrupted.

===
## Cause one

Five commands. You are on `sandbox/your-name` with your home page change
committed.

**1.** Make a second branch from `main`, and change the same tagline differently:

```bash
git switch -c sandbox/conflict-demo main
```

Open `app/page.tsx` and change the `<h1>` to say `Zizzu Store — everything`.
Then:

```bash
git add app/page.tsx
git commit -m "Change the heading a different way"
```

**2.** Go back to your own branch and pull that in:

```bash
git switch sandbox/your-name
```

```bash
git merge sandbox/conflict-demo
```

There it is.

=== attest=saw-markers
## Read what it left you

Open `app/page.tsx`. Git has written both versions into the file:

```
<<<<<<< HEAD
          Zizzu Store
=======
          Zizzu Store — everything
>>>>>>> sandbox/conflict-demo
```

Three markers, and they mean exactly one thing each:

| Marker | Meaning |
|---|---|
| `<<<<<<< HEAD` | below this is **your branch's** version |
| `=======` | the dividing line |
| `>>>>>>> other-branch` | above this is **the other branch's** version |

`HEAD` is git's word for *where you are now* — the branch you were on when you
started the merge.

===
## Resolve it

There is no clever command. **You edit the file until it says what it should
say, and you delete all three marker lines.**

Your options are the usual three:

- keep yours
- keep theirs
- write something that takes from both

Keep yours, this time. Edit the file until it reads:

```tsx
          Zizzu Store
```

No `<<<<<<<`, no `=======`, no `>>>>>>>`. Just the line you want.

:::warn The markers are not magic
They are ordinary text that git typed into your file. Leave one in by accident
and you commit a file with `>>>>>>> sandbox/conflict-demo` in the middle of it —
which then fails to compile, in a way that looks baffling if you have forgotten
where it came from.

That is the single most common way this goes wrong. The check below looks for
exactly that.
:::

=== check=sandbox-branch,no-markers,merged ask=what-conflict-is
## Finish the merge

Tell git you have sorted it, and commit:

```bash
git add app/page.tsx
```

```bash
git commit
```

It writes the commit message for you — `Merge branch 'sandbox/conflict-demo'`.
Accept it.

Now look at what happened:

```bash
git log --oneline --graph -5
```

You will see the two lines of history join back together. That fork-and-rejoin
is what a merge *is*, and you have now done one by hand.

Clean up the practice branch:

```bash
git branch -d sandbox/conflict-demo
```

:::note When you are lost mid-merge
```bash
git merge --abort
```

Puts everything back exactly as it was before you started. Nothing is lost, and
you can try again once you know what you want.

Remember that command. It is the reason a conflict can never really trap you.
:::

===
## What this looks like in real work

You will meet conflicts when your branch has been open for a while and `main`
has moved on underneath it. Typically:

```bash
git switch main
git pull
git switch your-branch
git merge main
```

— and if you both touched the same lines, the same three markers appear.

Two habits make it rare and small:

**Pull often.** A branch that is a day behind conflicts in one place. A branch
three weeks behind conflicts everywhere, and each one is harder because you have
forgotten what you were doing.

**Keep branches short.** The same argument as small commits, one level up.

:::why Why you should not just take "theirs" to make it stop
The temptation, at the fourth conflict in a row, is to accept one side wholesale
and move on.

Both sides are somebody's deliberate work. Discarding theirs silently removes a
change that was reviewed and merged; discarding yours means redoing it. When you
genuinely cannot tell which is right, the answer is not a coin toss — it is a
message to whoever wrote the other side. It is a thirty-second conversation and
they will not mind.
:::
