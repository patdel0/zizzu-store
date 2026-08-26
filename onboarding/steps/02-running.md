Before writing anything, get the project running and the tests passing. This is
your baseline: from here on, if something is red, you did it.

You need two things installed: **Docker** and **Node.js**. Docker runs the app
and the database; Node runs the tests and the tooling from your own terminal.

- Docker: [docs.docker.com/get-started/get-docker](https://docs.docker.com/get-started/get-docker/)
- Node.js 20 or newer: [nodejs.org](https://nodejs.org)

=== check=fixtures
## Set up

In the project folder:

```bash
./script/setup
```

That copies `.env.example` to `.env` and installs dependencies. `.env` holds
settings that differ per machine — database passwords, that sort of thing. It is
deliberately never committed, which is why there is an `.env.example` to copy
from.

=== check=app-up
## Start it

```bash
./script/server
```

That starts two containers: the app on port 3000 and Postgres on port 5432.
Give Next.js a few seconds to compile, then open
[localhost:3000](http://localhost:3000). You should see the starter page.

:::note What a container is
A container is a small, sealed box holding a program and everything it needs.
The database runs in one, so you never install Postgres on your laptop and
everyone on the team gets the same version. `docker compose` starts them
together.
:::

=== check=db-up,suite-green
## Run the tests

```bash
npm test
```

The first run is slow: it creates a separate `zizzu_test` database and its
tables. Every run after that is quicker.

:::warn Two databases, on purpose
The test suite **empties every table before each test**. That is what lets tests
run in any order without depending on each other — but it means the test
database must never be the one you are developing against. That is why `.env`
has both `DATABASE_URL` and `TEST_DATABASE_URL`.
:::

===
## When something goes wrong

| What you see | What it means |
|---|---|
| `Cannot connect to the Docker daemon` | Docker is not running. Start Docker Desktop. |
| `port is already allocated` | Something else is on 3000 or 5432. Stop it, or find it with `lsof -i :3000`. |
| `Could not reach Postgres` | The containers are not up. `./script/server`. |
| The page never loads | Next.js is still compiling. Watch it with `docker compose logs -f app`. |

`docker compose logs -f app` is the single most useful command when the app
misbehaves. It shows you what the server is actually saying. Get used to
reaching for it before you start guessing.

:::note Keep this card in mind
Nothing to do here — this is the card to come back to when something breaks,
which it will. `docker compose logs -f app` is the first thing to reach for.
:::
