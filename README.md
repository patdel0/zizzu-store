## Getting Started

The app and its database run in Docker containers, so you need Docker installed.
You also need **Node.js 20 or newer** on your machine — `npm test`, the linter
and the Prisma CLI all run from your own terminal, not from the container.

- Docker: https://docs.docker.com/get-started/get-docker/
- Node.js: https://nodejs.org

Once installed, run:
``` bash
./script/setup;
./script/server;
```

### Services
- Next.js: http://localhost:3000
- PostgresSQL: 

### API

`GET`/`POST` on `/api/posts`, with a demo page at http://localhost:3000/posts.
See [docs/api-routes.md](docs/api-routes.md) — it is the template to copy when
adding an endpoint.

### Tests

``` bash
npm test;          # Vitest — plain functions and Route Handlers
npm run test:e2e;  # Playwright — pages and components
```

Both need Postgres running. See [docs/testing.md](docs/testing.md).

## New here? Start with the onboarding

There is an interactive onboarding tutorial for developers joining this project
— particularly a first job. It goes from "what is a server" through git,
branches, a real feature with tests, and opening a pull request, checking your
actual repository as you go.

It lives on the **`onboarding` branch**, which is deliberately never merged. Two
commands:

``` bash
git switch onboarding;
./onboarding/start;
```

Then open http://localhost:4000 and follow it from there.

Once it is running you can `git switch` back to `main` and work normally — the
server loads everything it needs at startup, so switching branches does not
disturb it. Your progress is saved outside the repository, in
`~/.zizzu-onboarding/`, so it survives branch switches and restarts.

It has no dependencies and needs no install. To restart it later, run the same
two commands again. See
[onboarding/README.md](https://github.com/patdel0/zizzu-store/blob/onboarding/onboarding/README.md)
for what it covers, how long it takes, and the notes for whoever is setting a
new starter up.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
