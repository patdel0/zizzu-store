Before writing anything, get the project running and the tests passing. This is
your baseline: from here on, if something is red, you did it.

You need two things installed: **Docker** and **Node.js**. Docker runs the app
and the database; Node runs the tests and the tooling from your own terminal.

- Docker: [docs.docker.com/get-started/get-docker](https://docs.docker.com/get-started/get-docker/)
- Node.js 20 or newer: [nodejs.org](https://nodejs.org)

=== check=fixtures,env,node-modules
## Set up

In the project folder:

```bash
./script/setup
```

That copies `.env.example` to `.env` and installs dependencies. `.env` holds
settings that differ per machine — database passwords, that sort of thing. It is
deliberately never committed, which is why there is an `.env.example` to copy
from.

While that runs, here is what the second half of it is doing.

===
## The code you did not write

`npm install` just downloaded several hundred folders into `node_modules/`. Two files decide what lands there.

**`package.json`** is the list you maintain. Open it — `dependencies` are what
the app needs to run, `devDependencies` are what only you need while working
(the test runner, the linter, the TypeScript compiler). Versions may be written as
ranges: `^4.1.0` means "4.1.0 or any later 4.x", while a bare `16.3.2` pins one
exact version.

**`package-lock.json`** is generated, enormous, and the one that actually
matters. It records the exact version of every package, and every package those
packages needed. It is committed on purpose — without it, a range like `^15.5.4`
could resolve differently on your machine than on your colleague's, and you
would spend an afternoon on a bug that only exists for one of you.

| Command | What it does | When |
| --- | --- | --- |
| `npm install` | Resolves the ranges, may update the lockfile | Adding or changing a dependency |
| `npm install <name>` | Adds one package and records it | New dependency |
| `npm ci` | Installs exactly the lockfile, ignoring the ranges | Automated builds, and when yours is a mess |

:::warn `node_modules` is never committed
It is enormous, machine-specific, and completely reconstructible from the two
files above. It is in `.gitignore` for those reasons. Committing it is a
memorable first-week mistake.
:::

:::note Adding a dependency is a decision, not a detail
Every package is code you now ship and have to keep updated, and it usually
brings others with it. Before adding one, ask whether it is worth it and whether
the team already uses something for this. It is a normal thing to raise on the
issue before you do it.
:::

=== check=app-up
## Start it

```bash
./script/server
```

That starts two containers: the app on port 3000 and Postgres on port 5432.
Give Next.js a few seconds to compile, then open
[localhost:3000](http://localhost:3000). You should see the starter page.

Now a second command, in another terminal tab, and leave it running:

```bash
docker compose watch
```

**You need this from the first edit onwards.** The container was built with a
*copy* of your code, so without it nothing you type on your laptop reaches the
app — you edit a file, reload, and see the old page with no error to explain
it. `watch` syncs your edits in as you save.

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

A **test** is a small piece of code that runs part of this project and checks
the answer is what somebody said it would be. There are a few dozen of them
here, and `npm test` runs the lot.

That is all you need for now — {{step:what-tests-are}} takes them apart properly,
and you will write your own shortly after.

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

`docker compose logs -f app` is the first command to reach for when the app
misbehaves. It shows you what the server is actually saying. Get used to
reaching for it before you start guessing.

