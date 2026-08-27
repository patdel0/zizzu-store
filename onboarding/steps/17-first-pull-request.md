You have made a change, committed it, and caused and resolved a conflict. The
work is still on your machine and nobody has seen it.

This step closes the loop. It is the whole contribution process — push, open,
review, respond — on a change small enough that none of your attention goes on
the code.

===
## Why do this on something trivial

The process is the thing being learned, not the change. A one-line edit to a
heading means every minute goes on the mechanics: what a pull request is, what
a reviewer does with it, what happens to the comments.

Do it for the first time on a database model and an endpoint and you are
learning two things at once, badly. You will do exactly that in week two, and it
will be easier because this is behind you.

=== check=sandbox-branch,pushed-small,nothing-unpushed
## Push it

```bash
git push -u origin sandbox/your-name
```

`origin` is the name for the copy of this repository on GitHub. `-u` links your
local branch to the one it just created, so from now on a bare `git push` and
`git pull` know where to go.

If it fails with `Permission denied (publickey)`, the authentication you set up
in {{step:git-setup}} is not working. That is a different problem from the push
being wrong — go back and finish that half.

:::note Pushing is not merging
Your branch now exists in two places and `main` is untouched. Nothing you push
affects anybody until somebody merges it, which is a separate, deliberate act.
:::

=== attest=opened-small,described-small
## Open the pull request

A **[pull request](https://docs.github.com/en/pull-requests)** is a request to
merge your branch into `main`. It is where review happens: the diff,
line-by-line comments, and the conversation, in one place.

On GitHub your freshly pushed branch appears with a **Compare & pull request**
button. Base `main`, compare your branch.

Then write the description. For a change this size, two sentences:

```markdown
## What

Replaces the Next.js starter heading on the home page with the store name,
and adds a tagline underneath.

## How to check it

`./script/dev`, then http://localhost:3000
```

That is the shape you will use for everything: **what changed**, and **how
somebody else can see it working**. On a bigger change a third section — *why* —
carries the judgement calls you made. There are none here, which is the point of
starting here.

:::warn The description is not a formality
It is the first thing a reviewer reads, and it decides how good your review is.
A reviewer who has to work out what a change is for from the diff spends their
attention there instead of on whether it is correct.
:::

=== attest=reviewed-small
## Get it reviewed

Ask your onboarding buddy, or whoever is set up as your reviewer. On GitHub:
**Reviewers**, top right of the pull request.

They will comment. Three things worth knowing before they do:

**It is about the code.** "This could be simpler" is a statement about a
function. There is no version of it that is about you, however it lands the
first time.

**A question is usually a question.** "Did you mean to keep the emerald green?"
means what it says. Both answers are fine — *no, changing it* and *yes, it
matches the brand colour* — and the second is not rude.

**Reply to everything.** Change it, or say why not. An unanswered comment reads
as ignored, and now your reviewer has to decide whether to raise it again.

To change something, commit on the same branch and push. The pull request
updates itself. Do not open a new one.

:::note If nobody is available to review
Do not skip it — this is the half of the process you cannot practise alone. Ask
in your team channel, and while you wait, read somebody else's open pull request
and leave one genuine question on it. That is the other half of review, and it
arrives in your first fortnight whether you feel ready or not.
:::

=== attest=closed-small
## Close it without merging

On the pull request page, below the comment box: **Close pull request**.

This one does not merge, because the whole tutorial is a sandbox and `main`
stays exactly as you found it. Everything up to the button was real — a real
branch, a real diff, a real review — and the button is the only part you are
skipping.

:::note What would have happened
Approved and merged, your commits land on `main`, your branch is deleted, and on
most projects CI runs and it goes to production within minutes. You will see
that laid out properly in {{step:pull-request}}, at the end of week two, when
the change is worth it.
:::

===
## That is week one

You can now do the thing the job is made of: take a change, put it on a branch,
commit it in pieces somebody can read, push it, and take it through review.

Everything in week two is that same loop with a harder change inside it — a
database model, an endpoint, tests, a page. The process does not get more
complicated. Only the code does.

:::try Before you stop
Leave your branch and your local commits alone; week two continues on the same
branch. If you are coming back tomorrow, the one thing worth writing down is how
to restart the tutorial:

```bash
git switch onboarding && ./onboarding/start
```
:::
