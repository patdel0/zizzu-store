Back in step 2 you ran `npm test`, a list of green ticks scrolled past, and
nobody said what any of it was.

Time to fix that, because everything from here on is built on it.

===
## Read one

Open `__tests__/api/posts.test.ts` and find this:

```typescript
it('returns the newest post first', async () => {
  await createPost({ title: 'Older' });
  await createPost({ title: 'Newer' });

  const response = await GET(getRequest('/api/posts'));
  const { data } = await response.json();

  expect(data.map((post) => post.title)).toEqual(['Newer', 'Older']);
});
```

That is a test. All of it. Read it as three plain sentences:

1. **Put two posts in the database**, one after the other.
2. **Ask the endpoint for the list.**
3. **Check that the newer one came back first.**

Set up a situation, run the code, compare the answer to what you claimed it
would be. Everything else in a test file is a variation on those three lines.

:::note The words in it
`it(...)` is one test, and the sentence you pass it is its name — the thing
printed when it fails, which is why it reads like a description rather than a
label.

`expect(x).toEqual(y)` is the comparison. If they differ, the test fails and
prints both.

`describe(...)` just groups related tests so the output is readable.
:::

=== attest=saw-it-catch
## Watch one do its job

Reading it is not the same as believing it. Break the thing it checks.

**1.** Open `app/api/posts/route.ts` and find the ordering, around line 54:

```typescript
const posts = await db.orm.public.Post.orderBy((post) =>
  post.createdAt.desc(),
)
```

**2.** Change `.desc()` to `.asc()` — newest-first becomes oldest-first. Save.

**3.** Run just that file:

```bash
npm test -- __tests__/api/posts.test.ts
```

It fails. And look at *how* it fails:

```
FAIL  returns the newest post first
  expected [ 'Older', 'Newer' ] to deeply equal [ 'Newer', 'Older' ]
```

It names the test, so you know which behaviour broke. It shows both lists, so
you know what happened instead. Nobody had to open a browser, click anything, or
remember that ordering was a thing worth checking.

**4.** Change it back to `.desc()`.

=== check=ordering-restored quiz=what-a-test-is
## What that replaced

Without that test, here is how you find out you broke the ordering:

You start the app. You go to the posts page. You add a post, then another. You
look at which one is on top. Every time you change anything nearby, you do it
again — and you do not, because it is tedious and you are fairly sure it is
fine.

**A test is that manual check, written down once, so a computer does it every
time instead of you doing it never.**

:::why Which is why the suite stayed green earlier
When you changed the title limit to 5, every test passed, because a test can
only check a behaviour somebody described. Nobody had described the title limit.

Tests are not a safety net that catches everything. They are exactly as good as
the list of things people bothered to write down — which is a reason to write
them, not a reason to distrust them.
:::

=== ask=what-tests-buy
## Why a team writes them

Catching your own mistakes today is the smallest of the reasons.

**They make code changeable by strangers.** Six months from now someone edits a
line near your endpoint. They have never seen it and do not know what it
guarantees. Thirty seconds of `npm test` tells them whether they broke anything
anybody wrote down. Without that, the safe move is to not touch it — and code
nobody dares touch is where projects go to die.

**They say what the code is supposed to do.** `returns the newest post first`,
`rejects an author who does not exist`. Reading the test names of a file you
have never opened tells you what it promises, and unlike a comment, a test that
stops being true fails.

**They let you tidy up.** You will want to rewrite something you wrote a week
ago. With tests, that is fifteen minutes and a green suite. Without, it is a
gamble, so you leave the mess.

**They mean nobody has to remember.** The person who knew that ordering
mattered will leave, or forget. The test does not.

:::note Two words you will hear
Someone breaking an old behaviour by accident is a **regression** — that is what
the suite is really guarding against.

**Coverage** is the fraction of your code that any test has run. It is useful
and it is not a score: the title-limit line had coverage. Nothing checked what
it did.
:::

===
## What they do not do

Worth knowing before you write your first one, so you are not disappointed.

- **A passing suite does not mean the code is correct.** It means the described
  behaviours still work.
- **Tests do not prove there are no bugs.** They prove the bugs you thought of
  are not there.
- **They cost real time.** Roughly half the lines in this project's `posts`
  feature are tests. That is normal, and it is a trade — slower to write, far
  cheaper to change.
- **A bad test is worse than none**, because it looks like protection. One that
  never fails, or fails at random, gets ignored and then deleted.

Which leaves one question, and it is the subject of the next step: how do you
know a test you wrote is any good?
