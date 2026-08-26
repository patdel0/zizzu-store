# Vendored

`mermaid.min.js` — Mermaid 11.17.2, MIT licensed, copied unmodified from the
published package's `dist/`.

It is committed rather than installed so the tutorial keeps its promise: a
trainee can run it before `npm install` has ever finished, and on a train with
no network. The bundle is self-contained — no dynamic chunk loading — and sets
`globalThis.mermaid`.

To update: `npm pack mermaid`, then copy `package/dist/mermaid.min.js` here.
