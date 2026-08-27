You proved the two files run in different places. Now find out what decides
that, and what it costs.

Look at the very first line of `app/posts/posts-board.tsx`:

```tsx
'use client';
```

That is the whole mechanism. One line, [with a page of documentation to
itself](https://react.dev/reference/rsc/use-client).

=== check=counter
## Experiment 1: build something that needs the browser

The clearest way to feel the difference is to add something that could only
possibly work in a browser: a button that counts its own clicks.

In `posts-board.tsx`, find the line near the top:

```tsx
const [posts, setPosts] = useState<SerializedPost[] | null>(null);
```

Add yours underneath it:

```tsx
const [clicks, setClicks] = useState(0);
```

Then, just above the closing `</div>` at the end of the component, add a button:

```tsx
<button onClick={() => setClicks(clicks + 1)}>
  Clicked {clicks} times
</button>
```

Two things about that first line. Both are easy to get wrong and neither gives
you an error.

**`onClick` wants a function, not the result of one.** `() =>` is what makes it
one. Write `onClick={setClicks(clicks + 1)}` and it runs immediately, while the
page is being drawn — which sets state, which redraws, which runs it again.

**The braces are the same rule as everywhere else**: the next thing is
JavaScript. `onClick="setClicks(clicks + 1)"` is a string, and a string does
nothing when clicked, silently.

Save, reload the page, and click it a few times. The number goes up.

===
### What that line actually did

```tsx
const [clicks, setClicks] = useState(0);
```

[`useState`](https://react.dev/reference/react/useState) gives you two things,
and the square brackets pull them apart:

- **`clicks`** — the current value. Starts at `0`, the argument you passed.
- **`setClicks`** — the only way to change it.

Changing it is not like an ordinary variable. `setClicks(3)` does two jobs:
store the new value, **and re-run the component so the screen catches up**. That
second job is why you must never write `clicks = 3` directly — the value would
change and nothing on screen would notice.

That is React's whole trick: you describe what the page should look like for a
given state, React re-runs it whenever the state changes.

:::note When the new value depends on the old one
`setClicks(clicks + 1)` is fine here. When several updates can happen before a
redraw, pass a function instead and React hands you the current value:

```tsx
setClicks((current) => current + 1);
```

The same form is already in this file — `setPosts((current) => [body.data,
...(current ?? [])])`. Reach for it whenever the new value is computed from the
old one.
:::

:::try Prove the re-run happens
You still have `console.log('[browser] posts board mounted')` in the
`useEffect`. Add a second log at the very top of the component function, outside
everything:

```tsx
export function PostsBoard() {
  console.log('[browser] component ran');
```

Now click the button and watch the console. `component ran` appears **every
time you click** — React is re-running the whole function to work out what
changed.

`mounted` appears only once, because that is what
[`useEffect`](https://react.dev/reference/react/useEffect) is for: work that
should happen when the component first appears, not on every re-run. Loading the
posts is exactly that kind of work.

**What makes it once is the last line of the effect.** Scroll to the end of it:

```tsx
  return () => controller.abort();
}, []);
```

`useEffect` takes two arguments — a function, and a list of things that should
make it run again. That `[]` is the list, and an empty one means "nothing does;
run after the first render only".

Leave the list out entirely and it runs after *every* render. If the effect then
sets state, that render causes another render, which runs the effect again. It
is not a loop you can see in the code; it is one you see in the network tab.

Take the extra log out again when you have seen it.
:::

=== check=use-client-intact attest=removed-marker
## Experiment 2: take the marker away

Now delete the `'use client';` line from the top of `posts-board.tsx`. Save.
Reload.

The page breaks, and the error is worth reading before you fix it:

> You're importing a component that needs `useActionState`. It only works in a
> Client Component but none of its parents are marked with "use client", so
> they're Server Components by default.

It names whichever hook it finds first, so you may see `useActionState` rather
than `useState` — the one you have not been taught. The point is the same, and
so is the fix.

`useState` needs somewhere to *keep*
the state between clicks, and something to *notice* the click. A server rendered
this page and moved on milliseconds ago. There is nothing left there to hold a
number or hear a button.

**Put the line back.**

=== check=page-clean attest=state-on-server
## Experiment 3: the same thing, from the other side

Now try it the other way round. In `app/posts/page.tsx` — the Server Component,
with no `'use client'` — add an import at the top of the file:

```tsx
import { useState } from 'react';
```

and one line inside the function:

```tsx
export default function PostsPage() {
  const [x, setX] = useState(0);
```

Reload. Same class of error.

**Take it back out.** The check below will tell you if you have left it in.

=== quiz=what-marker-does ask=which-to-use
## What each side gives up

| | Server Component | Client Component (`'use client'`) |
|---|---|---|
| Where its code runs | On the server | In the user's browser |
| Can the user read the code? | No | **Yes** |
| Can it hold a password or API key? | Yes | **No, ever** |
| Can it query the database directly? | Yes | No — it has to ask an API |
| Can it use `useState`, `onClick`? | No | Yes |
| Runs again when state changes? | No, once | Yes, every time |

Read down the last column and the design of this project falls out of it.
`posts-board.tsx` has a form, so it needs state, so it must be a Client
Component, so its code goes to the browser, so it cannot touch the database, so
it has to ask `/api/posts` instead.

**That is why the endpoint exists.** Not tidiness, and not a framework rule.

:::note Which to reach for
Default to a Server Component: less code, one round trip instead of two, and the
data never has to travel as JSON.

Reach for a Client Component when the page must **change after it has loaded** —
a form that adds to a list, a filter, a button that does something. That is the
posts page, which is why it is built this way.
:::

===
## Tidy up

Run the check while your counter is still in place. Then throw away everything
from these two steps:

```bash
git restore app/posts/page.tsx app/posts/posts-board.tsx
```

[`git restore`](https://git-scm.com/docs/git-restore) discards uncommitted
changes to a file and puts it back to its last committed state. It is the undo
button for "I was just poking at this", and you will use it constantly.

:::warn It really does throw the changes away
No confirmation, no undo. That is fine here — these were experiments — but run
`git diff` first when you are less sure what you are about to lose.
:::
