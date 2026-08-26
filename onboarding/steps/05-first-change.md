Time to change something and watch it appear in the browser.

Open `app/page.tsx`. That is the home page — the thing at
[localhost:3000](http://localhost:3000).

===
## Why *that* file is the home page

Before you edit it, one rule that will save you a lot of hunting. In
[Next.js](https://nextjs.org/docs), **a folder is a URL**. There is no routing
configuration anywhere; the folders under `app/` are the site's addresses.

```
app/
  page.tsx              →  /
  posts/
    page.tsx            →  /posts
  api/
    posts/
      route.ts          →  /api/posts
```

Two filenames carry all the meaning:

- **[`page.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/page)**
  renders something a person looks at.
- **[`route.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/route)**
  answers a request from code.

Put either one in a folder, and that folder's path becomes its URL. So
`app/page.tsx` is the page at `/`, which is why it is the file you are about to
edit.

:::note Working backwards
This works in reverse too, and that is how you will use it most. Something is
wrong on `/posts`? The file is `app/posts/page.tsx`. It is the fastest way to
get from a URL to the code behind it.
:::

===
## This is not quite HTML

What you see inside the `return (...)` looks like HTML, and mostly behaves like
it. It is **[JSX](https://react.dev/learn/writing-markup-with-jsx)**: [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)-shaped syntax inside a JavaScript file, which React turns
into real elements. Three differences will trip you up:

- `class` is written **`className`**, because `class` is already a JavaScript
  keyword.
- Every tag must close. `<br>` is written `<br />`.
- `{ }` drops back into JavaScript. `<p>{2 + 2}</p>` renders "4".

Everything else — `<h1>`, `<p>`, `<a href>` — is exactly what you already know.

===
## And the styling is not quite CSS

There is no stylesheet with rules in it. Instead each class does one small
thing, and you combine them on the element:

```html
<p className="mt-2 text-lg font-medium text-zinc-600">Hello</p>
```

`mt-2` is a top margin, `text-lg` a larger font, `font-medium` a heavier weight,
`text-zinc-600` a grey. That is **[Tailwind](https://tailwindcss.com/docs/styling-with-utility-classes)** — and it is [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) underneath, written a particular way.

It looks noisy at first. The trade is that you never invent a class name, never
hunt through a stylesheet to find what a name does, and never break another page
by editing a shared rule. What an element looks like is written on the element.

A few patterns worth recognising as you read:

| Class | Meaning |
|---|---|
| `text-3xl` | Font size. `xs` … `sm` `base` `lg` `xl` `2xl` `3xl` … |
| `text-emerald-600` | Text colour: a palette name, and a shade from 50 to 950. |
| `mt-4` / `px-6` | Margin top / horizontal padding. The number is a spacing step. |
| `flex` `flex-col` `gap-4` | Lay children out in a column, with a gap between them. |
| `dark:text-zinc-50` | Only in dark mode. |
| `sm:items-start` | Only on screens above a breakpoint. |

Those last two are why some class lists get long: one element is describing how
it looks in several situations at once.

=== check=sandbox-branch,heading,tagline,served
## Your change

In `app/page.tsx`:

1. Change the `<h1>` so it says **Zizzu Store**. Delete what is inside it now,
   including the `<code>` bit and the surrounding `{" "}`, and put your text
   there instead.
2. Under the heading, add a tagline as its own paragraph, styled in green:

```html
<p className="text-lg text-emerald-600">Everything you need, and some things you don't.</p>
```

Write your own tagline. Keep the `text-emerald-600` class — the check below
looks for it.

Save. Look at the browser.

:::warn If the page has not changed
`docker compose watch` is not running. That is the command from
{{step:running}} that syncs your edits into the container — without it the app
keeps serving the copy it was built with, and your change is invisible with no
error to explain why.

Start it in a second terminal and leave it there for the rest of the tutorial.
:::

:::note When you break the page
You will, shortly — a missing `}` or an unclosed tag. Next.js will show you a
red error page with the file and line number.
Read the first line, go to that line, look one line above it too.
:::
