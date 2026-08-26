import {
  asJson,
  commitsOnBranch,
  commitThatAdded,
  currentBranch,
  exists,
  fetchLocal,
  gitOut,
  isAncestor,
  read,
  run,
} from './lib/shell.mjs';

/**
 * Every step of the tutorial, and the checks that decide whether it is done.
 *
 * A check is `{ id, label, run }`. `run` returns `{ pass, detail }` — `detail`
 * is the whole feedback loop, so it should say what was looked for and what to
 * do next, never just "failed".
 *
 * Checks only ever read: they run `git log`, read files and make HTTP requests.
 * The browser posts a step id and nothing else, so nothing the page sends can
 * become part of a command.
 */

const APP = 'http://localhost:3000';

/** Trainee branches are `sandbox/<name>`, never `main`. */
const SANDBOX_PREFIX = 'sandbox/';

/** `npm test` is slow enough that the page needs to warn before running it. */
const SLOW = true;

// ---------------------------------------------------------------------------
// Shared checks
// ---------------------------------------------------------------------------

const onSandboxBranch = {
  id: 'sandbox-branch',
  label: 'You are on your sandbox branch',
  async run() {
    const branch = await currentBranch();

    if (branch.startsWith(SANDBOX_PREFIX)) {
      return { pass: true, detail: `On \`${branch}\`.` };
    }

    return {
      pass: false,
      detail:
        branch === 'main'
          ? 'You are on `main`. Go back to step 8 and switch to your `sandbox/…` branch — nothing in this tutorial should ever be committed to `main`.'
          : `You are on \`${branch}\`, which is not a \`sandbox/…\` branch. Run \`git switch sandbox/your-name\`.`,
    };
  },
};

/** Runs the Vitest suite, optionally filtered to one file. */
async function runVitest(filter) {
  const args = ['test'];

  if (filter) args.push('--', filter);

  const result = await run('npm', args, { timeout: 300_000 });
  const output = `${result.stdout}\n${result.stderr}`;

  return { passed: result.ok, output, timedOut: result.timedOut };
}

/** The last few meaningful lines of a command's output, for the detail text. */
function tail(output, lines = 12) {
  return output
    .split('\n')
    .map((line) => stripAnsi(line).trimEnd())
    .filter((line) => line.trim() !== '')
    .slice(-lines)
    .join('\n');
}

/** Removes terminal colour codes so command output reads cleanly in HTML. */
function stripAnsi(text) {
  return text.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[a-zA-Z]`, 'g'), '');
}

function databaseHint(output) {
  return /Could not reach Postgres|ECONNREFUSED|ENOTFOUND/i.test(output)
    ? '\n\nPostgres is not reachable. Run `./script/server` and try again.'
    : '';
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export const steps = [
  {
    id: 'welcome',
    phase: 'What all this is',
    title: 'Start here',
    minutes: 10,
    quiz: [
      {
        id: 'sandbox',
        prompt:
          'What happens to the code you write during this tutorial?',
        options: [
          { id: 'a', label: 'It gets merged into the project once you finish.' },
          { id: 'b', label: 'Nothing — you close it without merging, and the project is unchanged.' },
          { id: 'c', label: 'A senior developer decides whether to keep it.' },
          { id: 'd', label: 'It is deleted the moment you make a mistake.' },
        ],
        answer: 'b',
        explain:
          'This is a sandbox. You will do every step for real — real branch, real tests, real pull request — and then close it unmerged. Nothing you do here can damage the project, which means there is no reason to be careful in the wrong way. Try things.',
      },
    ],
  },

  {
    id: 'web-basics',
    phase: 'What all this is',
    title: 'What happens when you open a website',
    minutes: 20,
    quiz: [
      {
        id: 'who-runs-what',
        prompt:
          'You open a shop\u2019s website on your phone. Where does the code that decides which products to show actually run?',
        options: [
          { id: 'a', label: 'On your phone.' },
          { id: 'b', label: 'On the shop\u2019s server.' },
          { id: 'c', label: 'On both at once, in sync.' },
          { id: 'd', label: 'In the internet.' },
        ],
        answer: 'b',
        explain:
          'Your phone runs the *browser*. The browser asks a server for a page, and the server is the machine that holds the products and decides what to send. That split — one machine asks, another answers — is the shape of nearly everything you will build.',
      },
      {
        id: 'what-arrives',
        prompt: 'What does the server actually send back to your browser?',
        options: [
          { id: 'a', label: 'A picture of the page.' },
          { id: 'b', label: 'The whole website.' },
          { id: 'c', label: 'Text — HTML describing the page, which the browser then draws.' },
          { id: 'd', label: 'The database.' },
        ],
        answer: 'c',
        explain:
          'It is all text. HTML says what is on the page, CSS says what it looks like, and the browser turns that into the thing you see. "View source" in any browser shows you the actual text that arrived.',
      },
    ],
  },

  {
    id: 'http',
    phase: 'What all this is',
    title: 'Requests, methods, and status codes',
    minutes: 25,
    quiz: [
      {
        id: 'method-choice',
        prompt:
          'You are adding a form that creates a new customer account. Which method should the request use?',
        options: [
          { id: 'a', label: 'GET, because it is simpler.' },
          { id: 'b', label: 'POST, because it creates something.' },
          { id: 'c', label: 'Either — they do the same thing.' },
          { id: 'd', label: 'DELETE, because the form is submitted.' },
        ],
        answer: 'b',
        explain:
          'GET means "give me something" and should change nothing. POST means "here is some data, do something with it". The distinction is not cosmetic: browsers and caches are allowed to repeat a GET whenever they like, so a GET that creates an account could create several.',
      },
      {
        id: 'status-meaning',
        prompt:
          'Your app asks a server for a page and gets back a **404**. What does that tell you?',
        options: [
          { id: 'a', label: 'The server is broken.' },
          { id: 'b', label: 'Your internet connection dropped.' },
          { id: 'c', label: 'The server answered fine — there is just nothing at that address.' },
          { id: 'd', label: 'You are not allowed to see it.' },
        ],
        answer: 'c',
        explain:
          'A 404 is a successful conversation with a disappointing answer. The server heard you and replied. That is the difference between a 4xx — "the problem is with what you asked for" — and a 5xx, which means the server itself fell over.',
      },
      {
        id: 'who-is-at-fault',
        prompt:
          'Which of these means **the server** broke, rather than the request being wrong?',
        options: [
          { id: 'a', label: '400' },
          { id: 'b', label: '404' },
          { id: 'c', label: '422' },
          { id: 'd', label: '500' },
        ],
        answer: 'd',
        explain:
          'Anything starting with 4 blames the request; anything starting with 5 blames the server. It matters because it tells you where to look: a 400 means fix the caller, a 500 means read the server log.',
      },
    ],
  },

  {
    id: 'apis',
    phase: 'What all this is',
    title: 'What an API is',
    minutes: 20,
    quiz: [
      {
        id: 'api-vs-page',
        prompt:
          'What is the difference between `/products` and `/api/products` in an app like this one?',
        options: [
          { id: 'a', label: 'One is faster than the other.' },
          {
            id: 'b',
            label:
              '`/products` returns a page for a person to look at; `/api/products` returns data for code to use.',
          },
          { id: 'c', label: 'They are the same thing with different names.' },
          { id: 'd', label: '`/api/products` is only for other companies.' },
        ],
        answer: 'b',
        explain:
          'Same information, two audiences. A page is HTML dressed up for a human. An API answers with plain data — no colours, no layout — because the thing reading it is a program that will decide what to do with it.',
      },
      {
        id: 'why-json',
        prompt: 'Why do APIs answer with JSON rather than HTML?',
        options: [
          { id: 'a', label: 'JSON is smaller.' },
          { id: 'b', label: 'HTML is out of date.' },
          {
            id: 'c',
            label:
              'A program needs the values themselves, not a description of how to display them.',
          },
          { id: 'd', label: 'Browsers cannot read HTML from an API.' },
        ],
        answer: 'c',
        explain:
          'If your code wants a price it wants `899`, not `<p class="price">\u00a38.99</p>` to pick apart. JSON is just a text format for values — numbers, text, lists, and nested objects — that every language can read.',
      },
    ],
  },

  {
    id: 'databases',
    phase: 'What all this is',
    title: 'Where the data actually lives',
    minutes: 20,
    quiz: [
      {
        id: 'why-database',
        prompt:
          'Why keep products in a database instead of a file the app reads and writes?',
        options: [
          { id: 'a', label: 'Files are not allowed on servers.' },
          {
            id: 'b',
            label:
              'A database handles many people reading and writing at once, and finds things without reading everything.',
          },
          { id: 'c', label: 'Databases are newer.' },
          { id: 'd', label: 'Files cannot hold enough data.' },
        ],
        answer: 'b',
        explain:
          'Two customers buying the last item at the same moment is the whole problem. A database is built for exactly that — simultaneous access without corruption — and it can find one row among millions without reading the rest.',
      },
      {
        id: 'row-column',
        prompt: 'In a `Product` table, what is a **row**?',
        options: [
          { id: 'a', label: 'One kind of information, like "price".' },
          { id: 'b', label: 'One product.' },
          { id: 'c', label: 'The whole table.' },
          { id: 'd', label: 'A database query.' },
        ],
        answer: 'b',
        explain:
          'A table is a grid. Each **column** is a kind of information every product has — name, price. Each **row** is one actual product, with a value in each column. A spreadsheet is the same idea, which is not a coincidence.',
      },
    ],
  },

  {
    id: 'the-map',
    phase: 'What all this is',
    title: 'Where things are in this project',
    minutes: 20,
    quiz: [
      {
        id: 'where-endpoint',
        prompt:
          'You need to add an endpoint that answers `GET /api/orders`. Which file do you create?',
        options: [
          { id: 'a', label: 'app/orders.ts' },
          { id: 'b', label: 'app/api/orders/route.ts' },
          { id: 'c', label: 'lib/prisma/orders.ts' },
          { id: 'd', label: 'app/api/orders.tsx' },
        ],
        answer: 'b',
        explain:
          'Next.js maps folders to URLs. A folder under `app/api/` becomes the path, and the file inside it must be called `route.ts` \u2014 that is what tells Next.js "this answers HTTP requests" rather than "this renders a page".',
      },
      {
        id: 'where-page',
        prompt: 'And which file renders the page at `/orders`?',
        options: [
          { id: 'a', label: 'app/orders/page.tsx' },
          { id: 'b', label: 'app/orders/route.ts' },
          { id: 'c', label: 'pages/orders.tsx' },
          { id: 'd', label: 'app/orders.tsx' },
        ],
        answer: 'a',
        explain:
          'Same rule, different filename. `page.tsx` renders a page, `route.ts` answers an API request. The folder is the URL either way.',
      },
      {
        id: 'where-to-copy',
        prompt:
          'You are asked to add a `reviews` feature. What is the first thing to do?',
        options: [
          { id: 'a', label: 'Search the internet for a Next.js reviews tutorial.' },
          { id: 'b', label: 'Design it from scratch so it is not constrained by old code.' },
          {
            id: 'c',
            label: 'Read how `posts` is built, and follow the same shape.',
          },
          { id: 'd', label: 'Ask someone to build the first version for you.' },
        ],
        answer: 'c',
        explain:
          '`posts` exists to be copied. A codebase where every feature is built the same way is one you can find your way around \u2014 and matching the existing pattern is a thing reviewers actively want, not a lack of ambition.',
      },
    ],
  },

  {
    id: 'running',
    phase: 'Getting set up',
    title: 'Get it running',
    minutes: 20,
    checks: [
      {
        id: 'env',
        label: '`.env` exists',
        async run() {
          if (await exists('.env')) {
            return { pass: true, detail: 'Found `.env`.' };
          }

          return {
            pass: false,
            detail:
              'No `.env` file. Run `./script/setup` — it copies `.env.example` to `.env` and installs dependencies.',
          };
        },
      },
      {
        id: 'node-modules',
        label: 'Dependencies are installed',
        async run() {
          if (await exists('node_modules/next')) {
            return { pass: true, detail: 'Found `node_modules`.' };
          }

          return {
            pass: false,
            detail:
              'Dependencies are missing. Run `npm install` (or `./script/setup`, which does it for you).',
          };
        },
      },
      {
        id: 'app-up',
        label: 'The app answers on http://localhost:3000',
        async run() {
          const response = await fetchLocal(APP, { timeout: 8_000 });

          if (response === null) {
            return {
              pass: false,
              detail:
                'Nothing is listening on port 3000. Run `./script/server` to start the containers, wait a few seconds for Next.js to compile, then check again.',
            };
          }

          if (response.status >= 500) {
            return {
              pass: false,
              detail: `The app answered ${response.status}. Look at the error with \`docker compose logs app\`.`,
            };
          }

          return { pass: true, detail: `The app answered ${response.status}.` };
        },
      },
      {
        id: 'db-up',
        label: 'Postgres is reachable',
        slow: SLOW,
        async run() {
          const script = [
            "import { Client } from 'pg';",
            "import { testDatabaseUrl } from './test/database-url.ts';",
            'const url = new URL(testDatabaseUrl);',
            "url.pathname = '/postgres';",
            'const client = new Client({ connectionString: url.toString() });',
            'await client.connect();',
            'await client.end();',
          ].join('\n');

          const result = await run('node', ['--input-type=module', '-e', script], {
            timeout: 30_000,
          });

          if (result.ok) {
            return { pass: true, detail: 'Connected to Postgres on port 5432.' };
          }

          return {
            pass: false,
            detail: `Could not connect to Postgres. Run \`./script/server\` and give it a few seconds.\n\n\`\`\`\n${tail(result.stderr, 4)}\n\`\`\``,
          };
        },
      },
      {
        id: 'suite-green',
        label: 'The existing test suite passes',
        slow: SLOW,
        async run() {
          const { passed, output, timedOut } = await runVitest();

          if (timedOut) {
            return {
              pass: false,
              detail:
                'The test run timed out. That almost always means Postgres is not up — run `./script/server`.',
            };
          }

          if (passed) {
            return {
              pass: true,
              detail:
                'Green. This is your baseline: from here on, a red suite means *you* broke something.',
            };
          }

          return {
            pass: false,
            detail: `\`npm test\` failed before you have changed anything, so this is an environment problem rather than your code.${databaseHint(output)}\n\n\`\`\`\n${tail(output)}\n\`\`\``,
          };
        },
      },
    ],
  },

  {
    id: 'branch',
    phase: 'Your first change',
    title: 'Make yourself a branch',
    minutes: 15,
    checks: [
      onSandboxBranch,
      {
        id: 'from-main',
        label: 'Your branch started from `main`',
        async run() {
          const branch = await currentBranch();

          if (!branch.startsWith(SANDBOX_PREFIX)) {
            return { pass: false, detail: 'Create the branch first.' };
          }

          const base = await gitOut('merge-base', 'main', 'HEAD');

          if (base === '') {
            return {
              pass: false,
              detail:
                'Your branch has no commit in common with `main`. Delete it and create it again: `git switch main`, then `git switch -c sandbox/your-name`.',
            };
          }

          return {
            pass: true,
            detail: `Branched from \`main\` at ${base.slice(0, 7)}.`,
          };
        },
      },
    ],
  },

  {
    id: 'first-change',
    phase: 'Your first change',
    title: 'Change something you can see',
    minutes: 30,
    checks: [
      onSandboxBranch,
      {
        id: 'heading',
        label: 'The home page heading says "Zizzu Store"',
        async run() {
          const source = await read('app/page.tsx');

          if (source === null) {
            return { pass: false, detail: 'Could not read `app/page.tsx`.' };
          }

          if (!source.includes('Zizzu Store')) {
            return {
              pass: false,
              detail:
                'The text `Zizzu Store` is not in `app/page.tsx` yet. Find the `<h1>` and replace what is inside it.',
            };
          }

          return { pass: true, detail: 'Found the new heading.' };
        },
      },
      {
        id: 'tagline',
        label: 'You added a tagline styled with Tailwind',
        async run() {
          const source = await read('app/page.tsx');

          if (source === null) {
            return { pass: false, detail: 'Could not read `app/page.tsx`.' };
          }

          const hasColour = source.includes('text-emerald-600');
          const hasParagraph = /<p[\s>]/.test(source);

          if (hasColour && hasParagraph) {
            return {
              pass: true,
              detail: 'Found a `<p>` and the `text-emerald-600` class.',
            };
          }

          return {
            pass: false,
            detail: hasColour
              ? 'The class is there but there is no `<p>` element. The tagline should be its own paragraph.'
              : 'No `text-emerald-600` class in `app/page.tsx`. Add it to the `className` of your new paragraph.',
          };
        },
      },
      {
        id: 'served',
        label: 'The running app is serving your change',
        async run() {
          const response = await fetchLocal(APP, { timeout: 8_000 });

          if (response === null) {
            return {
              pass: false,
              detail: 'The app is not running. Start it with `./script/server`.',
            };
          }

          if (response.body.includes('Zizzu Store')) {
            return { pass: true, detail: 'The browser is getting your edit.' };
          }

          return {
            pass: false,
            detail:
              'The file has your change but the running app does not.\n\nThe container was built with a copy of the code, so it does not pick up edits on its own. In a second terminal, run:\n\n```\ndocker compose watch\n```\n\nLeave it running — it syncs your edits into the container. Then reload the page and check again.',
          };
        },
      },
    ],
  },

  {
    id: 'first-commit',
    phase: 'Your first change',
    title: 'Your first commit',
    minutes: 30,
    checks: [
      onSandboxBranch,
      {
        id: 'has-commit',
        label: 'You have at least one commit on this branch',
        async run() {
          const commits = await commitsOnBranch();

          if (commits.length === 0) {
            return {
              pass: false,
              detail:
                'No commits on this branch yet. Stage your change with `git add app/page.tsx`, then `git commit`.',
            };
          }

          return {
            pass: true,
            detail: `${commits.length} commit${commits.length === 1 ? '' : 's'} on this branch.`,
          };
        },
      },
      {
        id: 'message-style',
        label: 'Your commit messages follow the house style',
        async run() {
          const commits = await commitsOnBranch();

          if (commits.length === 0) {
            return { pass: false, detail: 'Commit something first.' };
          }

          const problems = [];

          for (const { sha, subject } of commits) {
            const short = `\`${sha.slice(0, 7)}\` "${subject}"`;

            if (subject.length > 72) {
              problems.push(
                `${short} — the subject is ${subject.length} characters. Keep it under 72 so it stays readable in a log.`,
              );
            }

            if (subject.endsWith('.')) {
              problems.push(
                `${short} — drop the full stop. A subject is a title, not a sentence.`,
              );
            }

            if (!/^[A-Z]/.test(subject)) {
              problems.push(`${short} — start the subject with a capital letter.`);
            }

            const gerund = subject.match(
              /^(Added|Adding|Fixed|Fixing|Updated|Updating|Changed|Changing|Removed|Removing|Created|Creating)\b/,
            );

            if (gerund) {
              problems.push(
                `${short} — write the subject as a command: what applying this commit *does*. "${gerund[1]}" should be "${imperativeOf(gerund[1])}".`,
              );
            }

            if (/\b(wip|stuff|misc|various|things)\b/i.test(subject)) {
              problems.push(
                `${short} — this does not say what changed. Someone reading the log in six months has to open the diff to find out.`,
              );
            }
          }

          if (problems.length > 0) {
            return {
              pass: false,
              detail: `${problems.join('\n\n')}\n\nRewrite the most recent message with \`git commit --amend\`.`,
            };
          }

          return {
            pass: true,
            detail: `\`\`\`\n${commits
              .map((commit) => `${commit.sha.slice(0, 7)} ${commit.subject}`)
              .join('\n')}\n\`\`\``,
          };
        },
      },
      {
        id: 'clean-tree',
        label: 'Your home page change is committed, not just saved',
        async run() {
          // Scoped to the file this step is about: an unrelated scratch file
          // elsewhere in the tree is not something to fail somebody for.
          const status = await gitOut('status', '--porcelain', '--', 'app/page.tsx');

          if (status === '') {
            return {
              pass: true,
              detail: 'Nothing outstanding in `app/page.tsx` — it is all in the commit.',
            };
          }

          return {
            pass: false,
            detail: `\`app/page.tsx\` still has changes that are not in a commit:\n\n\`\`\`\n${status}\n\`\`\`\n\nSaving a file and committing it are different things. Run \`git add app/page.tsx\` and either \`git commit\`, or \`git commit --amend\` to fold it into the commit you already made.`,
          };
        },
      },
    ],
  },

  {
    id: 'how-it-works',
    phase: 'How this app works',
    title: 'How a request travels through the app',
    minutes: 25,
    quiz: [
      {
        id: 'server-vs-client',
        prompt:
          "Why does `app/posts/posts-board.tsx` start with `'use client'`, when `app/posts/page.tsx` does not?",
        options: [
          { id: 'a', label: 'Because it is faster.' },
          {
            id: 'b',
            label:
              'Because it uses state and event handlers, which only exist in the browser.',
          },
          { id: 'c', label: 'Because it is in a subfolder.' },
          { id: 'd', label: 'Because it talks to the database.' },
        ],
        answer: 'b',
        explain:
          'Components render on the server by default — the browser gets HTML. `useState`, `useEffect` and `onClick` need a running browser, so a component that uses them has to be marked as a Client Component. Note what that rules out: a Client Component cannot query the database, which is exactly why `posts-board.tsx` goes through `/api/posts`.',
      },
      {
        id: 'why-route',
        prompt:
          'The posts page could query the database directly in a Server Component. Why does it go through `/api/posts` instead?',
        options: [
          { id: 'a', label: 'Route Handlers are the only way to reach the database.' },
          { id: 'b', label: 'It is the Next.js convention for all pages.' },
          {
            id: 'c',
            label:
              'The list has to change after the page has loaded, when the user submits the form.',
          },
          { id: 'd', label: 'Server Components cannot be tested.' },
        ],
        answer: 'c',
        explain:
          'For read-only rendering, a Server Component querying the database directly is simpler and faster — one round trip instead of two. You need a Route Handler when data has to change on a page that is already on screen, which is what the create form does.',
      },
      {
        id: 'envelope',
        prompt:
          'Every handler in this project answers with `{ data }` or `{ error }`. What does that buy you?',
        options: [
          { id: 'a', label: 'It makes responses smaller.' },
          {
            id: 'b',
            label:
              'Client code needs one way of reading a response, instead of a different shape per endpoint.',
          },
          { id: 'c', label: 'It is required by Next.js.' },
          { id: 'd', label: 'It makes the database faster.' },
        ],
        answer: 'b',
        explain:
          'Conventions like this are worth more than they look. Every consumer checks `response.ok`, then reads `body.data` or `body.error` — and that will be true of the endpoint you write next, without anyone having to ask.',
      },
      {
        id: 'validation',
        prompt: 'Why does `POST /api/posts` look up the author before creating the post?',
        options: [
          { id: 'a', label: 'To warm up the database connection.' },
          { id: 'b', label: 'To copy the author name onto the post.' },
          {
            id: 'c',
            label:
              'So a bad author id answers 422 with a clear message instead of an opaque database error.',
          },
          { id: 'd', label: 'It is left over and should be deleted.' },
        ],
        answer: 'c',
        explain:
          'The database would reject it anyway — the foreign key sees to that. But the error would arrive as a constraint violation, get caught by the `catch`, and reach the caller as a generic 500. Checking first turns "something broke" into "this author does not exist".',
      },
    ],
  },

  {
    id: 'database',
    phase: 'Building a feature',
    title: 'Add a model to the database',
    minutes: 40,
    checks: [
      onSandboxBranch,
      {
        id: 'model',
        label: '`Product` is in the contract with the right fields',
        async run() {
          const source = await read('lib/prisma/contract.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read `lib/prisma/contract.ts`.' };
          }

          if (!/\bmodel\(\s*'Product'/.test(source)) {
            return {
              pass: false,
              detail:
                "No `model('Product', …)` in `lib/prisma/contract.ts`. Copy the shape of the `Post` model just above it.",
            };
          }

          const required = [
            ['id', /\bid:\s*field\.id\.uuidv7String\(\)/],
            ['name', /\bname:\s*field\.text\(\)/],
            ['description', /\bdescription:\s*field\.text\(\)\.optional\(\)/],
            ['priceCents', /\bpriceCents:\s*field\.int\(\)/],
            ['createdAt', /\bcreatedAt:\s*field\.temporal\.createdAt\(\)/],
            ['updatedAt', /\bupdatedAt:\s*field\.temporal\.updatedAt\(\)/],
          ];
          const missing = required
            .filter(([, pattern]) => !pattern.test(source))
            .map(([name]) => name);

          if (missing.length > 0) {
            return {
              pass: false,
              detail: `The \`Product\` model is missing — or has a different type for — **${missing.join(', ')}**.\n\nTypes matter here: \`priceCents\` has to be \`field.int()\`, and \`description\` has to be \`field.text().optional()\`.`,
            };
          }

          return { pass: true, detail: 'All six fields are declared.' };
        },
      },
      {
        id: 'exported',
        label: '`Product` is listed under `models`',
        async run() {
          const source = await read('lib/prisma/contract.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read the contract.' };
          }

          const returned = source.slice(source.indexOf('models:'));

          if (/\bProduct\b/.test(returned)) {
            return { pass: true, detail: '`Product` is listed under `models`.' };
          }

          return {
            pass: false,
            detail:
              'You declared the model but did not add it to the `models: { … }` object the contract returns. Only models listed there can be queried.',
          };
        },
      },
      {
        id: 'emitted',
        label: 'The generated contract is up to date',
        async run() {
          const json = await read('lib/prisma/contract.json');
          const types = await read('lib/prisma/contract.d.ts');

          if (json === null || types === null) {
            return { pass: false, detail: 'The generated contract files are missing.' };
          }

          if (json.includes('Product') && types.includes('Product')) {
            return {
              pass: true,
              detail: '`contract.json` and `contract.d.ts` both know about `Product`.',
            };
          }

          return {
            pass: false,
            detail:
              '`contract.ts` has the model but the generated files do not. Run:\n\n```\nnpx prisma-cli contract emit\n```\n\nThose two files are what your editor and the running app actually read, which is why they are committed alongside the source.',
          };
        },
      },
    ],
  },

  {
    id: 'tdd-red',
    phase: 'Building a feature',
    title: 'Red — write the test first',
    minutes: 45,
    checks: [
      onSandboxBranch,
      {
        id: 'test-exists',
        label: '`__tests__/api/products.test.ts` exists',
        async run() {
          if (await exists('__tests__/api/products.test.ts')) {
            return { pass: true, detail: 'Found the test file.' };
          }

          return {
            pass: false,
            detail:
              'Create `__tests__/api/products.test.ts`. Copy `__tests__/api/posts.test.ts` and cut it down to the one test described above.',
          };
        },
      },
      {
        id: 'no-route-yet',
        label: 'You have not written the route yet',
        async run() {
          if (await exists('app/api/products/route.ts')) {
            return {
              pass: false,
              detail:
                '`app/api/products/route.ts` already exists.\n\nNot a disaster, but you have skipped the part that matters. Delete it, watch the test fail, then write it back. A test you have never seen fail is a test you have no reason to trust.',
            };
          }

          return { pass: true, detail: 'No route yet — good.' };
        },
      },
      {
        id: 'red',
        label: 'The test fails',
        slow: SLOW,
        async run() {
          const { passed, output, timedOut } = await runVitest(
            '__tests__/api/products.test.ts',
          );

          if (timedOut) {
            return {
              pass: false,
              detail: 'The test run timed out. Is Postgres up? `./script/server`.',
            };
          }

          if (passed) {
            return {
              pass: false,
              detail:
                'The test passed, which at this stage means it is not testing anything. A test that passes before the feature exists will still pass after the feature breaks.\n\nCheck that you are importing `GET` from `@/app/api/products/route` and asserting on the response.',
            };
          }

          // Red is only meaningful if it is red for the *right* reason. A test
          // that fails because Postgres is down proves nothing about the code.
          if (/Could not reach Postgres|ECONNREFUSED|globalSetup/i.test(output)) {
            return {
              pass: false,
              detail: `The test did fail — but because the database is not reachable, not because your route is missing. That is not the red you are looking for.\n\nStart the containers with \`./script/server\`, wait a few seconds, and run it again.\n\n\`\`\`\n${tail(output, 6)}\n\`\`\``,
            };
          }

          const rightReason =
            /api\/products\/route|Failed to resolve import|Cannot find module/i.test(output);

          if (!rightReason) {
            return {
              pass: false,
              detail: `The test failed, but not with the error this step expects — which usually means something else is broken.\n\nRead the output and fix that first; a red you cannot explain is not progress.\n\n\`\`\`\n${tail(output, 12)}\n\`\`\``,
            };
          }

          return {
            pass: true,
            detail: `Red, and red for the right reason: it cannot find \`app/api/products/route.ts\`, because you have not written it yet.\n\n\`\`\`\n${tail(output, 8)}\n\`\`\``,
          };
        },
      },
      {
        id: 'test-committed',
        label: 'The failing test is committed',
        async run() {
          const sha = await commitThatAdded('__tests__/api/products.test.ts');

          if (sha === null) {
            return {
              pass: false,
              detail:
                'The test file is not committed yet. Commit it on its own — the next step checks that this commit comes *before* the one that makes it pass, which is what makes your history show how you worked.',
            };
          }

          return { pass: true, detail: `Committed as \`${sha.slice(0, 7)}\`.` };
        },
      },
    ],
  },

  {
    id: 'tdd-green',
    phase: 'Building a feature',
    title: 'Green — make it pass',
    minutes: 45,
    checks: [
      onSandboxBranch,
      {
        id: 'route-exists',
        label: '`app/api/products/route.ts` exists',
        async run() {
          if (await exists('app/api/products/route.ts')) {
            return { pass: true, detail: 'Found the route.' };
          }

          return { pass: false, detail: 'Create `app/api/products/route.ts`.' };
        },
      },
      {
        id: 'runtime',
        label: 'The runtime is pinned to Node',
        async run() {
          const source = await read('app/api/products/route.ts');

          if (source === null) return { pass: false, detail: 'No route file.' };

          if (/export\s+const\s+runtime\s*=\s*'nodejs'/.test(source)) {
            return { pass: true, detail: "Found `export const runtime = 'nodejs'`." };
          }

          return {
            pass: false,
            detail:
              "Add `export const runtime = 'nodejs';` near the top.\n\nWithout it, Next.js may run the handler on the Edge runtime, which has no Node APIs — and the Postgres driver needs them. It would work locally and fail in production, which is the worst kind of bug.",
          };
        },
      },
      {
        id: 'green',
        label: 'The test passes',
        slow: SLOW,
        async run() {
          const { passed, output, timedOut } = await runVitest(
            '__tests__/api/products.test.ts',
          );

          if (timedOut) {
            return { pass: false, detail: 'Timed out. Is Postgres up? `./script/server`.' };
          }

          if (passed) return { pass: true, detail: 'Green.' };

          return {
            pass: false,
            detail: `Still failing.${databaseHint(output)}\n\n\`\`\`\n${tail(output)}\n\`\`\``,
          };
        },
      },
      {
        id: 'order',
        label: 'The test was committed before the code',
        async run() {
          const testSha = await commitThatAdded('__tests__/api/products.test.ts');
          const routeSha = await commitThatAdded('app/api/products/route.ts');

          if (testSha === null) {
            return { pass: false, detail: 'The test is not committed on this branch.' };
          }

          if (routeSha === null) {
            return {
              pass: false,
              detail: 'The route is not committed yet. Commit it as its own change.',
            };
          }

          if (testSha === routeSha) {
            return {
              pass: false,
              detail:
                'The test and the route went in as one commit, so the history cannot show that you wrote the test first.\n\nThis matters beyond the exercise: a reviewer who can see the test commit on its own can check out that commit and watch it fail. Split them with `git reset --soft HEAD~1`, then commit the test and the route separately.',
            };
          }

          if (await isAncestor(testSha, routeSha)) {
            return {
              pass: true,
              detail: `\`${testSha.slice(0, 7)}\` (test) → \`${routeSha.slice(0, 7)}\` (route). Your history reads red, then green.`,
            };
          }

          return {
            pass: false,
            detail:
              'The route was committed before the test. Not fatal — but the order was the point of the exercise.',
          };
        },
      },
    ],
  },

  {
    id: 'post-happy',
    phase: 'Building a feature',
    title: 'POST — creating something',
    minutes: 45,
    checks: [
      onSandboxBranch,
      {
        id: 'asserts-201',
        label: 'A test asserts a 201 and the saved product',
        async run() {
          const source = await read('__tests__/api/products.test.ts');

          if (source === null) return { pass: false, detail: 'No test file.' };

          if (!/\b201\b/.test(source)) {
            return {
              pass: false,
              detail:
                'No test asserts a **201**. Write that one first, and watch it fail before you write the handler.',
            };
          }

          if (!/POST/.test(source)) {
            return {
              pass: false,
              detail:
                'Your test file never calls `POST`. Import it from `@/app/api/products/route`, next to `GET`.',
            };
          }

          return { pass: true, detail: 'Found a `POST` test asserting 201.' };
        },
      },
      {
        id: 'post-exported',
        label: 'The route exports `POST`',
        async run() {
          const source = await read('app/api/products/route.ts');

          if (source === null) return { pass: false, detail: 'No route file.' };

          if (/export\s+async\s+function\s+POST\s*\(/.test(source)) {
            return { pass: true, detail: 'Found the `POST` handler.' };
          }

          return {
            pass: false,
            detail:
              'No `export async function POST(request)` in the route. One named export per HTTP method — that is how Next.js knows which one to call.',
          };
        },
      },
      {
        id: 'green',
        label: 'Your products tests pass',
        slow: SLOW,
        async run() {
          const { passed, output, timedOut } = await runVitest(
            '__tests__/api/products.test.ts',
          );

          if (timedOut) {
            return { pass: false, detail: 'Timed out. Is Postgres up? `./script/server`.' };
          }

          if (passed) return { pass: true, detail: 'Green.' };

          return {
            pass: false,
            detail: `Still failing.${databaseHint(output)}\n\n\`\`\`\n${tail(output)}\n\`\`\``,
          };
        },
      },
    ],
  },

  {
    id: 'post-validation',
    phase: 'Building a feature',
    title: 'Refusing bad input',
    minutes: 45,
    checks: [
      onSandboxBranch,
      {
        id: 'cases',
        label: 'Your tests cover the failure cases',
        async run() {
          const source = await read('__tests__/api/products.test.ts');

          if (source === null) return { pass: false, detail: 'No test file.' };

          const wanted = [
            ['400 on invalid input', /\b400\b/],
            ['422 on a duplicate name', /\b422\b/],
          ];
          const missing = wanted
            .filter(([, pattern]) => !pattern.test(source))
            .map(([name]) => name);

          if (missing.length > 0) {
            return {
              pass: false,
              detail: `No test asserts: **${missing.join(', ')}**.\n\nThe happy path is the easy half. Most of what a handler actually does is refuse bad input politely.`,
            };
          }

          return { pass: true, detail: 'Both failure statuses are asserted.' };
        },
      },
      {
        id: 'suite',
        label: 'The whole suite passes',
        slow: SLOW,
        async run() {
          const { passed, output, timedOut } = await runVitest();

          if (timedOut) {
            return { pass: false, detail: 'Timed out. Is Postgres up? `./script/server`.' };
          }

          if (passed) {
            return {
              pass: true,
              detail:
                'Everything is green, including the tests you did not write. That is the check that matters before you ask anyone to review your work.',
            };
          }

          return {
            pass: false,
            detail: `Something is red.${databaseHint(output)}\n\nIf it is a \`posts\` test rather than a \`products\` one, you have broken something you did not mean to touch — most likely the contract.\n\n\`\`\`\n${tail(output)}\n\`\`\``,
          };
        },
      },
      {
        id: 'live-400',
        label: 'The live endpoint refuses a bad request',
        async run() {
          const response = await fetchLocal(`${APP}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nope: true }),
            timeout: 15_000,
          });

          if (response === null) {
            return {
              pass: false,
              detail:
                'The app is not running, so this could not be checked against a real server. Start it with `./script/server`, and `docker compose watch` so it picks up your new files.',
            };
          }

          if (response.status === 404) {
            return {
              pass: false,
              detail:
                'The running app answered 404 — it has not picked up your new route file. Make sure `docker compose watch` is running, then try again.',
            };
          }

          const body = asJson(response.body);

          if (response.status === 400 && body && typeof body.error === 'string') {
            return {
              pass: true,
              detail: `The server answered 400 with \`{ error: "${body.error}" }\`. Your handler works over HTTP, not just inside a test.`,
            };
          }

          return {
            pass: false,
            detail: `Expected 400 with an \`{ error }\` body. Got ${response.status}:\n\n\`\`\`\n${response.body.slice(0, 300)}\n\`\`\``,
          };
        },
      },
    ],
  },

  {
    id: 'ui',
    phase: 'Building a feature',
    title: 'Put a page on top of it',
    minutes: 60,
    checks: [
      onSandboxBranch,
      {
        id: 'page',
        label: '`app/products/page.tsx` exists',
        async run() {
          if (await exists('app/products/page.tsx')) {
            return { pass: true, detail: 'Found the page.' };
          }

          return {
            pass: false,
            detail:
              'Create `app/products/page.tsx`. `app/posts/page.tsx` is a few lines of structure around a component — copy it.',
          };
        },
      },
      {
        id: 'labels',
        label: 'Your form inputs have real labels',
        async run() {
          const board = (await read('app/products/products-board.tsx')) ?? '';
          const page = (await read('app/products/page.tsx')) ?? '';
          const source = board + page;

          if (source.trim() === '') {
            return { pass: false, detail: 'No component to look at yet.' };
          }

          if (/<label[\s>]/.test(source)) {
            return {
              pass: true,
              detail:
                'Found `<label>` elements. That is what makes `getByLabel` work in a test — and what makes the form usable with a screen reader.',
            };
          }

          return {
            pass: false,
            detail:
              "No `<label>` in your component. Wrap each input in one, the way `Field` does in `app/posts/posts-board.tsx`.\n\nThis is not box-ticking: `page.getByLabel('Name')` in your Playwright test only works if the label is really there, and so does a screen reader.",
          };
        },
      },
      {
        id: 'served',
        label: 'http://localhost:3000/products renders',
        async run() {
          const response = await fetchLocal(`${APP}/products`, { timeout: 15_000 });

          if (response === null) {
            return { pass: false, detail: 'The app is not running. `./script/server`.' };
          }

          if (response.status === 404) {
            return {
              pass: false,
              detail:
                '404 — the container has not picked up the new page. Is `docker compose watch` running?',
            };
          }

          if (response.status >= 400) {
            return {
              pass: false,
              detail: `The page answered ${response.status}. Check \`docker compose logs app\` for the error.`,
            };
          }

          return { pass: true, detail: `The page answered ${response.status}.` };
        },
      },
      {
        id: 'e2e-file',
        label: '`e2e/products.spec.ts` follows the house style',
        async run() {
          const source = await read('e2e/products.spec.ts');

          if (source === null) {
            return {
              pass: false,
              detail: 'Create `e2e/products.spec.ts`, modelled on `e2e/posts.spec.ts`.',
            };
          }

          if (/waitForTimeout/.test(source)) {
            return {
              pass: false,
              detail:
                'Your test has a `waitForTimeout`. Remove it.\n\nA fixed wait is either too short — and the test fails at random on a slow day — or too long, and every future run pays for it. `expect(...).toBeVisible()` already waits.',
            };
          }

          if (!/getBy(Role|Label|Text)/.test(source)) {
            return {
              pass: false,
              detail:
                'Your test does not use `getByRole`, `getByLabel` or `getByText`. Find elements the way a person would; CSS classes change every time somebody restyles the page.',
            };
          }

          return { pass: true, detail: 'The test looks like the house style.' };
        },
      },
    ],
    attest: [
      {
        id: 'e2e-passes',
        label: 'I ran `npm run test:e2e` and my products test passes',
        hint: 'Stop the containerised app first (`docker compose stop app`). Playwright starts its own dev server pointed at the *test* database, and it will reuse whatever is already on port 3000 if you leave it up.',
      },
    ],
  },

  {
    id: 'issues',
    phase: 'Working with the team',
    title: 'Issues and the board',
    minutes: 20,
    attest: [
      { id: 'assigned', label: 'I assigned an issue to myself' },
      { id: 'in-progress', label: 'I moved it to In progress on the project board' },
      {
        id: 'commented',
        label: 'I commented on the issue saying how I plan to approach it',
        hint: 'Even one sentence. It is the cheapest possible way to find out you misread the issue.',
      },
    ],
    quiz: [
      {
        id: 'stuck',
        prompt:
          'You have been stuck on the same problem for two hours. What is the right move?',
        options: [
          { id: 'a', label: 'Keep going — asking makes you look like you cannot do the job.' },
          {
            id: 'b',
            label:
              'Say where you are stuck: what you expected, what happened, what you have already tried.',
          },
          { id: 'c', label: 'Move the issue back to To do and pick another one.' },
          { id: 'd', label: 'Open a PR and let the reviewer work it out.' },
        ],
        answer: 'b',
        explain:
          'Two hours is roughly where a question stops being cheaper to avoid. Nobody is impressed by a silent week. Asking well is a skill in itself, and that three-part shape — expected, actual, tried — is most of it: it shows you did the work, and it lets someone help you in one reply instead of five.',
      },
    ],
  },

  {
    id: 'pull-request',
    phase: 'Working with the team',
    title: 'Open a pull request',
    minutes: 45,
    checks: [
      onSandboxBranch,
      {
        id: 'pushed',
        label: 'Your branch is pushed to GitHub',
        async run() {
          const branch = await currentBranch();
          const remote = await gitOut('rev-parse', '--verify', `origin/${branch}`);

          if (remote === '') {
            return {
              pass: false,
              detail: `\`origin/${branch}\` does not exist yet. Push it:\n\n\`\`\`\ngit push -u origin ${branch}\n\`\`\``,
            };
          }

          const ahead = await gitOut('rev-list', '--count', `origin/${branch}..HEAD`);

          if (ahead !== '' && Number(ahead) > 0) {
            return {
              pass: false,
              detail: `You have ${ahead} commit(s) that are not pushed yet. Run \`git push\`.`,
            };
          }

          return { pass: true, detail: `\`origin/${branch}\` is up to date.` };
        },
      },
      {
        id: 'readable-history',
        label: 'Your history reads as a story, not a pile',
        async run() {
          const commits = await commitsOnBranch();

          if (commits.length < 3) {
            return {
              pass: false,
              detail: `Only ${commits.length} commit(s) on the branch. By now there should be at least three — the page change, the failing test, the route.\n\nOne enormous commit is the easiest thing to write and the hardest thing to review.`,
            };
          }

          return {
            pass: true,
            detail: `\`\`\`\n${commits
              .slice()
              .reverse()
              .map((commit) => `${commit.sha.slice(0, 7)} ${commit.subject}`)
              .join('\n')}\n\`\`\``,
          };
        },
      },
    ],
    attest: [
      { id: 'opened', label: 'I opened a pull request against `main`' },
      {
        id: 'description',
        label: 'My description says what changed and how to check it',
        hint: 'A reviewer should not have to reverse-engineer your intent from the diff.',
      },
      { id: 'linked', label: 'I linked the issue with `Closes #<number>`' },
      { id: 'reviewer', label: 'I requested a review' },
      {
        id: 'responded',
        label: 'I responded to every review comment',
        hint: 'Changed it, or explained why not. Silence reads as "ignored".',
      },
    ],
    quiz: [
      {
        id: 'review-feedback',
        prompt:
          'A reviewer writes: "This works, but could it live in a plain function so it can be tested directly?" What are they doing?',
        options: [
          { id: 'a', label: 'Saying your code is bad.' },
          {
            id: 'b',
            label:
              'Proposing a change, and asking rather than telling because you may have context they lack.',
          },
          { id: 'c', label: 'Blocking the PR until you rewrite it.' },
          { id: 'd', label: 'Being passive-aggressive.' },
        ],
        answer: 'b',
        explain:
          'Review comments are about the code, and a question is usually a real question. Two replies are both fine: "good idea, done", and "I tried that and it needs the request object — happy to change it if you still think so". What is not fine is resolving the thread without answering it.',
      },
    ],
  },

  {
    id: 'cleanup',
    phase: 'Working with the team',
    title: 'Close the loop and tidy up',
    minutes: 15,
    attest: [
      {
        id: 'closed',
        label: 'I closed my pull request without merging it',
        hint: 'This one was practice. Real work gets merged; this branch does not, so `main` stays exactly as you found it.',
      },
      { id: 'issue-done', label: 'I moved my issue to Done on the board' },
    ],
    checks: [
      {
        id: 'back-on-main',
        label: 'You are back on `main`',
        async run() {
          const branch = await currentBranch();

          if (branch === 'main') return { pass: true, detail: 'On `main`.' };

          return {
            pass: false,
            detail: `Still on \`${branch}\`. Run \`git switch main\`.\n\nStarting every new piece of work from an up-to-date \`main\` is a habit worth having: branch, work, merge, delete, branch again.`,
          };
        },
      },
      {
        id: 'main-untouched',
        label: '`main` is exactly as you found it',
        async run() {
          const ahead = await gitOut('rev-list', '--count', 'origin/main..main');

          if (ahead === '' || Number(ahead) === 0) {
            return {
              pass: true,
              detail: 'No commits of yours on `main`. The sandbox stayed a sandbox.',
            };
          }

          return {
            pass: false,
            detail: `\`main\` has ${ahead} commit(s) that are not on \`origin/main\`, so some of your work landed there by mistake.\n\nNothing is lost. \`git log main\` shows you what they are, and \`git reset --hard origin/main\` puts \`main\` back — do that only once you are sure the work you want is on your branch.`,
          };
        },
      },
    ],
  },
];

/** Maps a past-tense or gerund subject verb back to the imperative. */
function imperativeOf(verb) {
  const map = {
    Added: 'Add',
    Adding: 'Add',
    Fixed: 'Fix',
    Fixing: 'Fix',
    Updated: 'Update',
    Updating: 'Update',
    Changed: 'Change',
    Changing: 'Change',
    Removed: 'Remove',
    Removing: 'Remove',
    Created: 'Create',
    Creating: 'Create',
  };

  return map[verb] ?? verb;
}

export const stepsById = new Map(steps.map((step) => [step.id, step]));

/** Everything the page needs to draw a step, minus the answers to the quizzes. */
export function publicSteps() {
  return steps.map((step, index) => ({
    id: step.id,
    number: index + 1,
    phase: step.phase,
    title: step.title,
    minutes: step.minutes,
    checks: (step.checks ?? []).map(({ id, label, slow }) => ({
      id,
      label,
      slow: Boolean(slow),
    })),
    attest: step.attest ?? [],
    quiz: (step.quiz ?? []).map(({ id, prompt, options }) => ({ id, prompt, options })),
  }));
}

/** Runs every check for a step, in order. */
export async function runChecks(stepId) {
  const step = stepsById.get(stepId);

  if (!step?.checks) return [];

  const results = [];

  for (const check of step.checks) {
    try {
      const outcome = await check.run();

      results.push({ id: check.id, label: check.label, ...outcome });
    } catch (error) {
      results.push({
        id: check.id,
        label: check.label,
        pass: false,
        detail: `The check itself broke: ${error.message}`,
      });
    }
  }

  return results;
}

/** Grades one quiz answer. The answers live here, on the server, not in the page. */
export function gradeQuiz(stepId, questionId, choice) {
  const question = stepsById.get(stepId)?.quiz?.find((entry) => entry.id === questionId);

  if (!question) return null;

  // The explanation only comes back for a correct answer, so a wrong guess does
  // not hand over the right one. Guessing costs another read of the step.
  const correct = choice === question.answer;

  return correct ? { correct, explain: question.explain } : { correct };
}
