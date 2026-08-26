You already have [git](https://git-scm.com/docs) — you used it to get this
project onto your machine. But a fresh install does not know who you are, and
until it does, `git commit` will simply refuse:

```
Author identity unknown

*** Please tell me who you are.

fatal: unable to auto-detect email address
```

Five minutes now saves hitting that wall in three steps' time.

===
## Why git wants this

Every commit records **who made it and when**, permanently. That is not
paperwork — it is what lets someone six months from now find the person who
wrote a confusing line and ask them about it.

Because it is permanent, and because this project is on GitHub, use your real
name and a real address.

=== check=name,email
## Tell it who you are

```bash
git config --global user.name "Your Name"
```

```bash
git config --global user.email "you@example.com"
```

Use the email address on your GitHub account. If they do not match, GitHub will
not link your commits to your profile — your work shows up as an unnamed
stranger's.

:::note What `--global` means
It writes to `~/.gitconfig`, so it applies to every project on this machine,
not just this one. That is what you want.

If you ever need a different identity for one project — a work address on work
repositories — run the same command without `--global` inside that project.
:::

=== check=editor
## Choose an editor you can escape

`git commit` opens a text editor for the commit message. On many machines the
default is [vim](https://www.vim.org/docs.php), and a first encounter with vim
usually goes badly: it has modes, it ignores what you type, and quitting it is
not obvious.

Pick something else now.

| Editor | Command |
|---|---|
| VS Code | `git config --global core.editor "code --wait"` |
| Nano — simple, in the terminal | `git config --global core.editor "nano"` |
| Sublime Text | `git config --global core.editor "subl -n -w"` |
| Vim, deliberately | `git config --global core.editor "vim"` |

[Nano](https://www.nano-editor.org/docs.php) is the safe choice if you are unsure: it lists its own shortcuts at the
bottom of the screen. Save and exit is **Ctrl+O**, **Enter**, **Ctrl+X**.

:::note If you picked vim anyway
Press `i` to start typing. Then `Esc`, then type `:wq` and press Enter to save
and quit — or `:q!` to quit without saving. That really is the escape hatch
people search for.
:::

===
## Two more worth setting

```bash
git config --global init.defaultBranch main
```

Names the first branch `main` in any repository you create from now on. This
project already uses `main`; the setting stops you creating one called `master`
by accident and having to rename it.

```bash
git config --global pull.rebase false
```

Tells git how to combine your work with other people's when you `git pull`.
Without it, git nags on every pull until you choose. `false` is the
straightforward option, and matches what this project expects.

=== check=identity-check
## Check your work

```bash
git config --list --global
```

You should see your name, your email, and your editor. If something looks wrong,
run the same `git config` command again — the last one wins.

:::warn Not covered yet: pushing to GitHub
Sending your work *to* GitHub needs authentication as well as identity, and it
is a separate job with its own choices. That comes in step 20, at the point you
actually need it — there is no sense setting up credentials for a push you are
not making for another few hours.
:::
