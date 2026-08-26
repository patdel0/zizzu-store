You have changed a file. Git knows, but has not recorded anything yet. Check:

```bash
git status
```

It will show `app/page.tsx` as modified. To see exactly what changed:

```bash
git diff
```

Red lines were removed, green lines added. Read your own diff before every
commit — it is the cheapest way to catch the stray `console.log` you left in.

## Staging, then committing

Git records in two moves, which feels like one too many until you need it.

```bash
git add app/page.tsx     # choose what goes in the next commit
git commit               # record it, with a message
```

`git add` puts a change in the **staging area** — a shortlist for the next
commit. `git commit` records whatever is on that list.

The point of the separation: you can commit *some* of your changes. If you fixed
a typo while building a feature, you can commit the typo fix on its own instead
of burying it in an unrelated change.

`git commit` opens an editor for the message. If you get dropped into an
unfamiliar one, that is `vim`: type your message after pressing `i`, then press
`Esc` and type `:wq` and Enter. For short messages you can skip the editor:

```bash
git commit -m "Rename the home page heading to Zizzu Store"
```

## Writing the message

The message is the only part of your work someone reads in six months. The
convention here — and in most projects:

**Write the subject as a command, saying what applying the commit does.**

> Add a tagline to the home page

Read it as: "applying this commit will *add a tagline to the home page*."

The rules that follow from that:

- Start with a capital, no full stop at the end. It is a title, not a sentence.
- Under ~72 characters, so it is readable in a log.
- Say what changed, not that something changed. "Update stuff" tells nobody
  anything.

| Instead of | Write |
|---|---|
| `updated page` | `Rename the home page heading to Zizzu Store` |
| `Fixed bug` | `Reject a post title longer than 200 characters` |
| `wip` | (do not commit "wip" — say what it does so far) |

If a change needs explaining, leave a blank line after the subject and write a
paragraph. Use it for **why**, not what — the diff already shows what.

```
Reject a post title longer than 200 characters

The column is text, so a long title was accepted and then broke the
list page's layout. 200 matches the limit the design uses.
```

## Small commits

One commit should be one idea. Not "a day's work" and not "one line" — one
change you could describe in a sentence without using the word "and".

It costs nothing now and pays back constantly: a reviewer can read your work in
pieces, and if something breaks later, git can find the exact commit that did it.

:::note You can fix the last one
Wrong message? `git commit --amend` reopens it. Forgot a file?
`git add <file>` then `git commit --amend`. Both are safe *before* you push.
After pushing, other people may have your commit, so rewriting gets rude.
:::

:::try
Commit your home page change. Then run `git log --oneline` and see your commit
sitting on top of the project's history.
:::

The check below looks at your commit messages and will tell you specifically
what to fix. Being told "that should be `Add`, not `Added`" is a normal thing to
hear in a code review, and easier to hear from a program.
