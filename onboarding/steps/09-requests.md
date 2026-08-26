=== check=app-up
You have changed a page and committed it. Now find out what is actually
happening when that page appears — by watching it, not by being told.

Everything in this step is a command you run. Have a terminal open, and the app
running.

===
## 1. What your browser is really doing

Open [localhost:3000/posts](http://localhost:3000/posts). Now open your
browser's [developer
tools](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools) — **F12**, or right-click and "Inspect" — and click
the **Network** tab. Reload the page.

Every row that appears is one **request**: your browser asking a server for
something and getting an answer. Each row shows three things worth noticing:

- the **method** — `GET` for nearly all of them
- the **path** — `/posts`, `/api/posts`, some `.js` and `.css` files
- the **status** — `200` on a good day

That is the whole conversation. Your browser did not receive "a page". It made
one request for the page and then a handful more for the things the page needed.

:::try Find one specific row
Look for the row whose path is `/api/posts`. Click it, then click **Response**.
That is data, not a page — hold that thought for thirty seconds.
:::

===
## 2. The same conversation, without a browser

[`curl`](https://curl.se/docs/manpage.html) is a program that makes one request and prints the answer. Nothing else.
It is the smallest possible browser, which makes it perfect for seeing what is
going on.

```bash
curl -s http://localhost:3000/posts | head -20
```

A wall of HTML. **That is exactly what your browser received** — the browser
just draws it instead of printing it. That is all a browser is: something that
asks for text and renders it.

Now the other one:

```bash
curl -s http://localhost:3000/api/posts
```

```json
{"data":[]}
```

=== quiz=html-vs-json
## 3. Pages are for people, APIs are for programs

You just asked the same server for the same information twice and got two
completely different answers.

`/posts` gave you HTML: headings, layout, styling. Dressed up for a human.

`/api/posts` gave you **[JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)**: the values themselves, no decoration, because
whatever is reading it is a program that will decide what to do with them.

That second one is an **API** — *Application Programming Interface*, which
tells you nothing useful. Read it as: **the way other code talks to your code.**

If your code wants a price, it wants `899`, not `<p class="price">£8.99</p>` to
pick apart. JSON is a text format for plain values:

```json
{
  "name": "Mug",
  "priceCents": 899,
  "inStock": true,
  "description": null,
  "tags": ["kitchen"]
}
```

Text is quoted, numbers are not, and `null` means "deliberately nothing" — which
is different from a field being absent. Endpoints are allowed to treat those
differently, and this one does.

=== quiz=empty-post,missing-path
## 4. Status codes: provoke a few

The `-i` flag makes curl print the response's first line, which is where the
server says how it went.

```bash
curl -i -s http://localhost:3000/api/posts | head -1
```

```
HTTP/1.1 200 OK
```

Now ask for something that does not exist:

```bash
curl -i -s http://localhost:3000/api/nope | head -1
```

A **404**. Read that carefully: the server answered you. It is working
perfectly. There is simply nothing at that address. That is a different thing
from the server being down, which gives you no answer at all.

Now send it something it cannot use — an empty body where a post should be:

```bash
curl -i -s -X POST http://localhost:3000/api/posts \
  -H 'Content-Type: application/json' \
  -d '{}' | head -1
```

A **400**, and if you drop the `| head -1` you will see it explains itself:

```json
{"error":"`title` is required"}
```

Somebody wrote that check by hand. In a few steps, that somebody is you.

The pattern behind the numbers — [MDN has the full list](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status):

| Range | Meaning | Where to look |
|---|---|---|
| **2xx** | It worked | — |
| **4xx** | Your request was wrong | Fix the caller |
| **5xx** | The server broke | Read the server log |

The ones you will actually use:

| Code | When |
|---|---|
| **200** OK | Here is what you asked for. |
| **201** Created | I made the thing. Answers a successful `POST`. |
| **400** Bad Request | I cannot make sense of what you sent. |
| **404** Not Found | Nothing exists at that path. |
| **422** Unprocessable | I understood you, and it still cannot be done. |
| **500** Server Error | I fell over. Not your fault. |

You will meet 201 and 422 properly when you are choosing them yourself.

:::warn A status code is a promise
Returning `200 OK` with `{"error": "..."}` inside it is a real and common bug.
Every caller then has to read the body to find out whether it worked — which is
exactly the job the status code was there to do.
:::

=== ask=get-repeat
## 5. Why GET and POST are not interchangeable

Run this three times:

```bash
curl -s http://localhost:3000/api/posts
```

Same answer every time, and nothing on the server changed. A `GET` **reads**.

That property is not a nicety, and here is the practical consequence. Your
browser re-issues GETs constantly without asking anyone: you press back, you
press refresh, you restore a tab, a search engine crawls a link. All of those
repeat a GET.

So if creating an account were a `GET /create-account?name=…`, then a crawler
wandering past that link would create an account. Pressing back would create
another.

`POST` is the method that says "this changes something". Nothing repeats a POST
on its own — browsers will actually stop and ask before re-sending one.

**The rule: GET reads, POST changes.** ([Every method, on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods).) You saw the reading half above. You will
build the changing half in {{step:post-happy}}.

One more question, answerable from what you just ran.
