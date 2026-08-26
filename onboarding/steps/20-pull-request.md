Your work is on your branch, on your machine. Two things have to happen: it has
to reach GitHub, and someone has to read it.

## First: let GitHub know it is you

In step 3 you told git *who you are*, which is what stamps your name on a
commit. Sending commits to GitHub needs something different: proof that you are
allowed to. Identity is not permission.

If you have never pushed from this machine, set that up now. Pick one:

**GitHub CLI — easiest.** Install [`gh`](https://cli.github.com/manual/), then:

```bash
gh auth login
```

Answer the prompts and it handles everything, including configuring git.

**SSH keys — the usual choice for daily work.** You generate a key, give GitHub
the public half, and never type a password again. GitHub's
[step-by-step guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
is genuinely good; follow it start to finish.

**A personal access token over HTTPS.** Create a token in GitHub's settings and
use it in place of your password when git asks. [The
instructions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
cover which scopes it needs.

:::warn Your GitHub password will not work
Git asking for a "password" and rejecting the right one is a confusing five
minutes that most people have once. Password authentication for git was turned
off years ago — that prompt wants a **token**.
:::

## Push

```bash
git push -u origin sandbox/your-name
```

`origin` is the name for the copy of the repository on GitHub. `-u` links your
local branch to the remote one, so from now on plain
[`git push`](https://git-scm.com/docs/git-push) and `git pull` know where to go.

If it fails, read the error before trying again. "Permission denied
(publickey)" means the authentication above is not set up yet, not that you did
the push wrong.

## Open the pull request

A **[pull request](https://docs.github.com/en/pull-requests)** is a request to merge your branch into `main`. It is where
the review happens: the diff, line-by-line comments, and the conversation, all
in one place.

On GitHub, your freshly pushed branch appears with a "Compare & pull request"
button. Base: `main`. Compare: your branch.

## Writing it

The description is the first thing a reviewer reads and it decides how good your
review is. Three things:

```markdown
## What

Adds `GET` and `POST /api/products`, a `Product` model, and a page at
`/products`.

## Why

Closes #12. The store needs products before anything can be sold.

## How to check it

1. `./script/server`
2. `npm test`
3. Visit http://localhost:3000/products and add a product

Prices are stored as integer cents — `priceCents` — rather than a decimal,
to avoid floating point rounding on money.
```

`Closes #12` is not just a note: GitHub links the two, and closes the issue
automatically when the PR merges.

That last paragraph is the one people leave out and reviewers most want. If you
made a judgement call, say what it was. Otherwise the reviewer has to guess
whether you considered the alternative or never thought about it.

:::note Keep it small
This PR is on the large side — a model, an endpoint, a page. A reviewer reading
600 lines finds fewer problems than the same reviewer reading 150, three times.
Real work is easier to review, and lands faster, when split: the model and
endpoint in one PR, the page in the next.
:::

## Being reviewed

Someone will comment on your code. Some things they say will be right, some will
be based on something they have misread, and some are preferences.

Three things worth internalising early:

**It is about the code.** "This could be simpler" is a statement about a
function. There is no version of it that is about you, however it lands at
first.

**A question is usually a question.** "Could this live in a plain function so it
can be tested directly?" means what it says. Two answers are both fine: *good
idea, done*, and *I tried that and it needs the request object — happy to change
it if you still think so*.

**Reply to everything.** Change it, or say why not. An unanswered comment reads
as ignored, and the reviewer has to decide whether to raise it again.

Then push more commits to the same branch — the PR updates itself. Do not open a
new one.

## Reviewing others

You will be asked to review before you feel qualified. Do it anyway. "I do not
understand this bit" is one of the most useful comments there is: if you cannot
follow it after an honest read, it probably needs a comment or a better name,
and the person who wrote it can no longer tell.

Say what is good, too. A review that is only criticism is exhausting to receive
and tells the author nothing about what to keep doing.

:::warn Do not merge this one
This tutorial is a sandbox. Open the PR, get it reviewed, respond to the
comments — then **close it without merging**. Real work gets merged; this branch
does not, so `main` stays exactly as you found it.
:::
