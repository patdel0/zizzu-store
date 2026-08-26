You now know that a browser asks a server for a page and gets HTML back. An
**API** is the same conversation, with a different audience.

## Pages are for people, APIs are for programs

Ask this project for `/posts` and you get HTML — headings, layout, styling.
Dressed up for a human.

Ask it for `/api/posts` and you get this:

```json
{
  "data": [
    { "id": "0199c0de…", "title": "Hello", "content": "World" },
    { "id": "0199c0df…", "title": "Second post", "content": null }
  ]
}
```

Same information. No colours, no layout, no words for a person to read — just
the values, because the thing reading it is code that will decide what to do
with them.

**API** stands for Application Programming Interface, which tells you nothing.
Read it as: *the way other code talks to your code.*

## JSON

That format is **JSON**, and it is how nearly all APIs answer. It has six kinds
of thing in it, and that is genuinely all:

```json
{
  "name": "Mug",           // text, in double quotes
  "priceCents": 899,        // a number, no quotes
  "inStock": true,          // true or false
  "description": null,      // deliberately nothing
  "tags": ["kitchen"],      // a list, in square brackets
  "seller": { "id": 12 }    // an object, in curly braces
}
```

Two things catch people out:

- **`null` is not the same as missing.** `"description": null` says "this
  product has no description". Leaving the field out entirely says "I am not
  telling you about descriptions". Endpoints are allowed to treat those
  differently, and this one does.
- **Numbers have no quotes.** `899` is a number; `"899"` is text that happens to
  look like one. An API that expects a number will refuse the second, and it is
  right to.

## Why bother, if the page could just fetch the data itself?

Because pages are not the only thing that needs data.

```mermaid
flowchart LR
    subgraph clients [Things that might ask]
        W[The website]
        M[A phone app]
        S[A warehouse system]
    end
    clients --> API[/api/products]
    API --> DB[(Database)]
```

Write the products API once, and the website, a future phone app, and the
warehouse system all use the same one. The rules about what a valid product is
live in one place instead of three.

There is a second reason, closer to home: parts of a page that change *after* it
has loaded need somewhere to get fresh data. When you submit a form and the list
updates without the page reloading, that is the browser making an API request in
the background.

## What you will build

Two endpoints, which between them are most of what any API does:

```
GET  /api/products     give me the products
POST /api/products     here is a new product, save it
```

Everything else is a variation. Once you have written those two properly —
validating input, choosing honest status codes, testing both — you have the
shape of the job.
