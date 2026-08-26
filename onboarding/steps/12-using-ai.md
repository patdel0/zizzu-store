From here on you are writing real code, and you will be tempted to ask an AI to
write it for you.

This team has two rules about that. Unlike most of this tutorial, they are not
advice.

===
## The two rules

**1. [cs50.ai](https://cs50.ai/) is the only assistant you use while you are
onboarding.** Not ChatGPT, not Claude, not Copilot, not the chat window built
into your editor. Turn the editor one off — it suggests as you type, which is
the failure mode this whole step is about.

**2. No code that you did not write yourself enters this repository.** Not from
the assistant, not from Stack Overflow, not from the worked examples in this
tutorial. Nothing is pasted in. Nothing is transcribed while you look at it.

The second rule is stricter than it sounds, so the next card is about what it
asks of you.

:::note Why cs50.ai specifically
It is Harvard's [CS50](https://cs50.harvard.edu/) assistant — same class of
model underneath, deliberately configured to lead you toward an answer rather
than hand you one. Ask it to write your endpoint and it will decline and ask you
a question back.

That refusal is the feature. It is free, it needs a GitHub account, and it is
what CS50's own academic-honesty policy permits while it forbids general
assistants.
:::

===
## What "write it yourself" means

Most of the code blocks in this tutorial are complete, on purpose. Reading a
worked example is how you learn a shape you have never seen, and skipping them
would make this harder, not better.

So the rule is not "never look at code". It is about what happens next.

| | |
| --- | --- |
| **Paste it** | Nothing was read. Tests go green. You could not write it again. |
| **Transcribe it** | You read every character while copying. Better. Still copying. |
| **Write it** | Read it, understand it, look away, then produce it. |

**Read the example. Then stop looking at it, and write the thing.** Get stuck,
look back, close it again, keep going. What you end up with does not have to
match the example — if it works and you can explain it, it is better than a
copy, because it is yours.

That third row is the one with the evidence behind it, and it is a bigger claim
than "typing is good for you".

:::why What the research actually says, including where it is thin
Two findings, one strong and one narrower than people usually claim.

**Producing beats reading.** The generation effect: people remember material
they generated far better than material they read.
[Bertsch et al. (2007)](https://link.springer.com/article/10.3758/BF03193441)
pooled 86 studies and found **d = 0.40** overall — and, importantly for you,
**d = 0.64** when the test came more than a day later. The advantage grows with
delay, which is exactly the case you care about: writing this again next week
without help.

**But the effect is in the generating, not in the keystrokes.** There is no good
evidence that typing something out while looking at it does much. Transcription
is copying with extra steps; it makes you read every character, which is worth
something, but it is not generation, because the answer was in front of you.
That is why the rule here is "look away", and not just "do not paste".

**And the counterweight, which is why the examples exist.** Cognitive load
research finds novices learn *better* from studying worked examples than from
being made to solve problems unaided — the
[worked example effect](https://link.springer.com/article/10.1007/s10648-011-9181-8),
which reverses only once you are experienced. So: study the example, then
generate from it. Doing only one of those is the mistake in either direction.
:::

=== quiz=find-the-bug
## The other reason, which is about the code

Here is a function. Imagine you asked for it and this is what came back.

```typescript
/** Returns the newest post first. */
export function newestFirst(posts: Post[]): Post[] {
  return posts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
```

It has a docblock. It has types. It reads well. It is wrong in two separate
ways, and the tests you would write from its name would look fine.

Read it before you answer — both bugs are visible.

===
## Which means you have to be able to read it

That is the practical problem with code you did not write. Something has to
check it, and the only thing available is you.

A senior developer reads that function and sees the mutation bug in two seconds,
because they have written it themselves and been bitten by it. That recognition
is built by producing code and getting it wrong. It is what does not get built
by accepting code that is already right.

So **the tool is most dangerous while it is most useful to you.** It closes the gap between what you can
produce and what you need, which feels like progress and is why the gap stops
closing on its own.

:::note You will not feel this happening
In the study on the next card, motivation and enjoyment were measured and came
out **unchanged**. Students who were quietly learning less enjoyed it exactly as
much.

So you cannot detect this by checking how you feel. You detect it later, sitting
down to do something similar unaided and finding that you cannot.
:::

===
## What happens when the guardrail comes off

About a thousand high-school students, randomly assigned, in a real school.

- The group given an ordinary AI assistant improved their **practice** scores by
  **48%**.
- Then the assistant was taken away for the exam. They scored **17% worse than
  students who never had AI at all**.
- A second group got the same model with guardrails — hints instead of answers.
  They came out **level** with the no-AI group.

Read that middle line again. Not "learned less than they could have". *Worse
than never having had it.* The practice gains were real and they were not
learning.

Note what the guardrails did: they bought back the harm and added nothing.
Breaking even was the best result available.

[Bastani et al., *Generative AI without guardrails can harm learning*, PNAS
2025](https://www.pnas.org/doi/10.1073/pnas.2422633122)

:::note This is the whole argument for both rules
Rule one is the guardrail — cs50.ai is the hint-giving version, and it is the
only condition in that experiment that did not go backwards.

Rule two is because a guardrail you can paste around is not one.
:::

=== attest=write-not-copy ask=why-type-it
## Committing to it

This is the point where you decide. Nobody can check it — no gate in this
tutorial can tell typed code from pasted code, and the tests go green either
way, which is exactly why it is easy to skip and hard to notice you skipped.

:::note Where the tutorial stops giving you code
Deliberately, and gradually. Early steps hand you the whole file. The middle
ones give you the shape with the interesting parts blanked out. The last ones
describe what is needed and leave you to write it.

If the later steps feel like a cliff, the honest diagnosis is almost always that
the earlier ones got copied.
:::

=== quiz=good-use
## How to use the duck, then

Four things to ask it. All four keep the work with you:

**"Explain what this code does, line by line."** Your code or someone else's.
The safest and most useful thing you can ask — you are asking it to read, not to
write.

**"I expected X, I got Y, here is the code. Where should I look? Do not fix
it."** The refusal at the end matters. Without it you get a rewritten file and
learn nothing.

**"What does this error message mean?"** — *after* you have read the error
yourself and formed a guess. Then you are checking a theory rather than
outsourcing one.

**"What am I not thinking about here?"** Good for edge cases you have not
considered, and it leaves the deciding to you.

Two more rules with no exceptions:

- **Never commit anything you could not explain in review.** You will be asked.
  "The AI wrote it" is the one answer that has no follow-up.
- **Never trust it about this codebase.** It has not read our contract, our
  conventions or our tests, and it will confidently invent a Prisma method that
  does not exist. `posts` is the reference, not the model.

:::warn After onboarding
Ask your lead what the team's rule is for everyday work — it is a different
question, with different tradeoffs, and it is theirs to answer, not this
tutorial's.

These two rules are for while you are learning the codebase. The reason is not
that the tools are bad. It is that you are currently building the judgement you
would need in order to use them safely, and that judgement is built by doing the
work.
:::
