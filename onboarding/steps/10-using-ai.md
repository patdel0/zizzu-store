From here on you are writing real code, and you will be tempted to ask an AI to
write it for you.

Nobody is going to tell you not to use these tools. Everyone on this team uses
them. But there is a way of using them that leaves you knowing less each week,
and it is the obvious way, so it is worth thirty minutes now.

===
## What the research actually found

About a thousand students, randomly assigned, four sessions of maths practice.

One group got a normal AI assistant — the kind that answers. Their practice
scores went up **48%**.

Then the assistant was taken away for an exam they sat alone. That group scored
**17% worse than students who had never had AI at all.**

A second group used a version with guardrails: it gave hints instead of answers.
They came out level with the no-AI group — the guardrails bought back the harm,
they did not add anything.

:::why Why the first group did worse than never having it
They were not lazy, and they did not feel like they were cheating. The effect
has a name — *metacognitive laziness* — and the studies that measured it found
motivation and enjoyment **unchanged**.

That is the uncomfortable part. You cannot detect this in yourself by noticing
that you feel bad, because you will not. You detect it later, when you sit down
to do something similar unaided and find you cannot.
:::

===
## The line CS50 draws

Harvard's CS50 — the biggest introductory programming course there is — ran into
this early and drew a sharp line.

Using ChatGPT, Claude, Copilot or Gemini to suggest or complete code is
**academically dishonest** on their courses. Using their own AI, the
[CS50 Duck](https://cs50.readthedocs.io/cs50.ai/), is fine.

The difference is not the model. It is what the tool is willing to do. Their
duck is built to
["behave more like a good tutor, leading students toward answers rather than
spoiling them outright"](https://cs50.readthedocs.io/cs50.ai/) — where a general
assistant is, in their words, "all too willing to provide outright answers".

You are not a student and nobody is grading you. But the distinction is the
useful one to carry:

> **A tool that leads you to the answer makes you better. A tool that hands you
> the answer makes you faster today and worse next month.**

Same model, either way. The difference is what you ask it for.

=== quiz=find-the-bug
## The other reason to be careful

Here is a function. Imagine you asked for it and this is what came back.

```typescript
/** Returns the newest post first. */
export function newestFirst(posts: Post[]): Post[] {
  return posts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
```

It has a docblock. It has types. It reads well. It is wrong in two separate
ways, and the tests you would write from its name would look fine.

Read it before you answer — the bugs are both visible.

===
## Which means you have to be able to read it

That is the practical problem with code you did not write. Something has to
check it, and the only thing available is you.

A senior developer pastes AI code and spots the mutation bug in two seconds,
because they have written that bug themselves and been bitten by it. That
recognition is the thing being built when you write code by hand — and it is
exactly the thing that does not get built when you paste.

Which is the argument for the next card, and for the rest of this tutorial.

=== attest=type-not-paste ask=why-type-it
## Type it, do not paste it

Most of the code blocks in this tutorial are worked examples, given to you
complete on purpose — that is how you learn a shape you have never seen. But
there is a difference between *copying* and *pasting*.

**Type them out.** All of them. It is slower and it feels pointless.

What it actually does:

- You read every line, because you have to, rather than skimming to the end
- You notice the line you could not have written yourself — which is the one
  worth asking about
- You make small mistakes and read small errors, which is most of what learning
  to debug is
- Afterwards you can produce something similar, instead of only recognising it

None of that happens when you paste. The tests still go green either way, which
is why this is easy to skip and hard to notice you have skipped.

:::note Where the tutorial stops giving you code
Deliberately, and gradually. Early steps hand you the whole file. The middle
ones give you the shape with the interesting parts blanked out. The last ones
describe what is needed and leave you to write it.

If the later steps feel like a cliff, the honest diagnosis is usually that the
earlier ones got pasted.
:::

=== quiz=good-use
## How to actually use it, then

Four prompts that keep the work with you:

**"Explain what this code does, line by line."** Your code or someone else's.
This is the safest and most useful use there is — you are asking it to read, not
to write.

**"I expected X, I got Y, here is the code. Where should I look? Do not fix
it."** The refusal at the end matters. Without it you get a rewritten file and
learn nothing.

**"What does this error message mean?"** — *after* you have read the error
yourself and formed a guess. Then you are checking a theory rather than
outsourcing one.

**"What am I not thinking about here?"** Genuinely good for the edge cases you
have not considered, and it leaves the deciding to you.

And two rules with no exceptions:

- **Never paste anything you could not explain in review.** You will be asked.
  "The AI wrote it" is the one answer that has no follow-up.
- **Never trust it about this codebase.** It has not read our contract, our
  conventions or our tests. It will confidently invent a Prisma method that does
  not exist. `posts` is the reference, not the model.
