## Getting Started

The app and its database run in Docker containers. You also need Node 20+ on your machine, for `npm test`, the linter, and the Prisma CLI.
This means you should have Docker installed on your machine.

See https://docs.docker.com/get-started/get-docker/ for installation instructions on your OS.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
