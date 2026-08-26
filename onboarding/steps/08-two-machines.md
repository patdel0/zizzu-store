Two files sit next to each other in `app/posts/`. One runs on the server, one
runs in your browser. Nothing about their names or their location tells you
which is which.

Rather than take that on trust, prove it. This step is one experiment, and it
has a result you can see.

=== check=server-log,browser-log
## Add two log lines

`console.log(...)` prints a message. Where it prints is the entire point.

**1.** Open `app/posts/page.tsx`. Add a line as the first thing inside the
function:

```tsx
export default function PostsPage() {
  console.log('[server] posts page rendered');

  return (
```

**2.** Open `app/posts/posts-board.tsx`. Add one inside the `useEffect`, just
above `const controller = ...`:

```tsx
useEffect(() => {
  console.log('[browser] posts board mounted');

  const controller = new AbortController();
```

Do not worry about what `useEffect` is yet — you are only putting a line inside
it. It comes up properly in the next step.

===
## Open two windows

You need to be able to see both at once:

**The server's output.** In a terminal:

```bash
docker compose logs -f app
```

**The browser's output.** In your browser's developer tools, the **Console**
tab.

=== attest=saw-split quiz=where-logged
## Now reload

Reload [localhost:3000/posts](http://localhost:3000/posts) and watch both.

- `[server]` appears **in the terminal**.
- `[browser]` appears **in the browser console**.
- Neither one appears in the other.

=== attest=found-source quiz=why-secret
## What you just proved

`console.log` prints wherever it runs. These two lines are in the same folder,
in the same project, written in the same language — and they printed in two
different places.

That is because they ran on **two different computers**.

`page.tsx` ran on the server. Its output went to the server's log, and its code
was never sent anywhere — your browser only received the HTML it produced.

`posts-board.tsx` was **sent to your browser as code**, and ran there.

:::try See the code that was sent
In developer tools, open the **Sources** tab — **Debugger** in Firefox. Find
`posts-board.tsx` in the file tree on the left.

It is really there. You are reading a file from this project inside a browser
that never had the project on it.
:::

That last experiment has a consequence worth stating plainly:

:::warn Code in the browser cannot keep a secret
Everyone using your app has a copy of `posts-board.tsx`. Minifying it does not
help; it is still there and still readable.

So passwords, API keys and database connection strings live in server code, and
never in a file that reaches the browser. A component running in the browser
that needs data has to *ask* the server for it — which is what `fetch('/api/posts')`
near the top of its `useEffect` is doing.
:::

===
## Leave the logs in for now

The next step uses the same two files. You will clean up at the end of it.
