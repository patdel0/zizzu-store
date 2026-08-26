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
          ? 'You are on `main`. Go back to step 4 and switch to your `sandbox/…` branch — nothing in this tutorial should ever be committed to `main`.'
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
    title: 'Start here',
    phase: 'Getting set up',
    minutes: 10,
    quiz: [
      {
        id: 'sandbox',
        prompt: 'What happens to the code you write during this tutorial?',
        options: [
          { id: 'a', label: 'It gets merged into the project once you finish.' },
          {
            id: 'b',
            label: 'Nothing — you close it without merging, and the project is unchanged.',
          },
          { id: 'c', label: 'A senior developer decides whether to keep it.' },
          { id: 'd', label: 'It is deleted the moment you make a mistake.' },
        ],
        answer: 'b',
        explain:
          'This is a sandbox. You will do every step for real — real branch, real tests, real pull request — and then close it unmerged. Nothing here can damage the project, which means there is no reason to be careful in the wrong way. Try things.',
      },
    ],
  },

  {
    id: 'running',
    title: 'Get it running',
    phase: 'Getting set up',
    minutes: 25,
    checks: [
      {
        id: 'fixtures',
        label: 'This repository is set up for the tutorial',
        async run() {
          // The tutorial teaches from the `posts` feature and the test suite.
          // If those are not committed, nothing downstream can work — and the
          // failures land much later, looking like the reader's own mistakes.
          const required = [
            '.env.example',
            'vitest.config.mts',
            'playwright.config.ts',
            'test/helpers.ts',
            'test/database-url.ts',
            '__tests__/api/posts.test.ts',
            'e2e/posts.spec.ts',
            'app/posts/page.tsx',
            'app/posts/posts-board.tsx',
            'app/api/posts/route.ts',
          ];
          const missing = [];

          for (const path of required) {
            if (!(await exists(path))) missing.push(path);
          }

          if (missing.length === 0) {
            return { pass: true, detail: 'Everything this tutorial teaches from is here.' };
          }

          return {
            pass: false,
            detail: `This is not your fault, and nothing you do will fix it.\n\nThe tutorial teaches from the \`posts\` feature and the test suite, and this checkout does not have them:\n\n\`\`\`\n${missing.join('\n')}\n\`\`\`\n\nGo back to whoever set this up and tell them these files are missing from \`main\`. Stop here until they are — every step after this one depends on them.`,
          };
        },
      },
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
    id: 'git-setup',
    title: 'Tell git who you are',
    phase: 'Getting set up',
    minutes: 25,
    checks: [
      {
        id: 'name',
        label: 'Your name is configured',
        async run() {
          const name = await gitOut('config', '--get', 'user.name');

          if (name === '') {
            return {
              pass: false,
              detail:
                'No `user.name` set, so git cannot record who made a commit — and `git commit` will refuse to run at all.\n\n```\ngit config --global user.name "Your Name"\n```',
            };
          }

          if (/^(your name|name|test|user|admin)$/i.test(name.trim())) {
            return {
              pass: false,
              detail: `Your name is set to "${name}", which looks like the placeholder rather than you. Every commit you make will carry it, so use your real name.`,
            };
          }

          return { pass: true, detail: `Commits will be authored by **${name}**.` };
        },
      },
      {
        id: 'email',
        label: 'Your email is configured',
        async run() {
          const email = await gitOut('config', '--get', 'user.email');

          if (email === '') {
            return {
              pass: false,
              detail:
                'No `user.email` set.\n\n```\ngit config --global user.email "you@example.com"\n```\n\nUse the address on your GitHub account, or GitHub will not connect your commits to you.',
            };
          }

          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
            return {
              pass: false,
              detail: `\`${email}\` does not look like an email address. Set it again with \`git config --global user.email "you@example.com"\`.`,
            };
          }

          if (/@example\.com$/i.test(email.trim())) {
            return {
              pass: false,
              detail:
                'That is the example address from the instructions, not yours. Use the one on your GitHub account.',
            };
          }

          return { pass: true, detail: `Commits will be attributed to \`${email}\`.` };
        },
      },
      {
        id: 'editor',
        label: 'An editor you can get out of is configured',
        async run() {
          const editor = await gitOut('config', '--get', 'core.editor');

          if (editor === '') {
            return {
              pass: false,
              detail:
                'No `core.editor` set, so `git commit` will open whatever your system defaults to — which on many machines is `vim`. Being trapped in vim on your first commit is a genuinely bad twenty minutes.\n\nPick one from the list above and set it.',
            };
          }

          return { pass: true, detail: `\`git commit\` will open \`${editor}\`.` };
        },
      },
      {
        id: 'identity-check',
        label: 'git agrees you are ready to commit',
        async run() {
          // The same lookup git itself does when composing a commit, so this
          // fails in exactly the cases `git commit` would.
          const result = await run('git', ['var', 'GIT_AUTHOR_IDENT'], { timeout: 10_000 });

          if (result.ok && result.stdout.trim() !== '') {
            return {
              pass: true,
              detail: `git will sign your commits as:\n\n\`\`\`\n${result.stdout.trim()}\n\`\`\``,
            };
          }

          return {
            pass: false,
            detail: `git cannot work out who you are, so \`git commit\` will fail.\n\n\`\`\`\n${tail(result.stderr, 4)}\n\`\`\``,
          };
        },
      },
    ],
  },

  {
    id: 'branch',
    title: 'Make yourself a branch',
    phase: 'Getting set up',
    minutes: 25,
    quiz: [
      {
        id: 'name-it',
        prompt:
          'Issue #204 says: "The total on the cart page is wrong when a discount is applied." Which branch name is best?',
        options: [
          { id: 'a', label: '`patch-1`' },
          { id: 'b', label: '`fix/204-cart-total-with-discount`' },
          { id: 'c', label: '`Fix Cart Total Bug (URGENT)`' },
          { id: 'd', label: '`maria-work`' },
        ],
        answer: 'b',
        explain:
          'It says what kind of change it is, which issue it belongs to, and what it touches — all readable in a list of thirty branches without opening anything. `patch-1` and `maria-work` say nothing. The third has capitals and spaces, which git allows and every command-line tool then makes you quote.',
      },
    ],
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
    title: 'Change something you can see',
    phase: 'Your first change',
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
    title: 'Your first commit',
    phase: 'Your first change',
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

            if (subject.length > 50) {
              problems.push(
                `${short} — the subject is ${subject.length} characters. Keep it under 50: git tools truncate around there, and a subject that does not fit is usually two commits.`,
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
    id: 'conflicts',
    title: 'When two changes collide',
    phase: 'Your first change',
    minutes: 30,
    attest: [
      {
        id: 'saw-markers',
        label: 'I saw the `<<<<<<<` markers in my own file and read them',
      },
    ],
    ask: [
      {
        id: 'what-conflict-is',
        prompt:
          'In your own words: what has actually gone wrong when git reports a conflict?',
        lookFor: [
          'two branches changed the same lines',
          'git will not guess which version was meant',
          'nothing is broken and nothing was done wrong',
        ],
        modelAnswer:
          'Nothing is broken. Two branches edited the same lines, and git will not pick one for me, because picking would mean throwing away somebody\u2019s work on a guess. It merges different parts of a file without asking; it stops only where the changes overlap. It is a question, not an error.',
      },
    ],
    checks: [
      onSandboxBranch,
      {
        id: 'no-markers',
        label: 'No conflict markers left in your files',
        async run() {
          const changed = await gitOut('diff', '--name-only', 'main...HEAD');
          const files = changed.split('\n').filter(Boolean);
          const dirty = [];

          for (const path of files) {
            const source = await read(path);

            if (source && /^<{7} |^={7}$|^>{7} /m.test(source)) dirty.push(path);
          }

          if (dirty.length > 0) {
            return {
              pass: false,
              detail: `These still contain conflict markers:\n\n\`\`\`\n${dirty.join('\n')}\n\`\`\`\n\nOpen each one and delete the \`<<<<<<<\`, \`=======\` and \`>>>>>>>\` lines, leaving the text you want to keep.`,
            };
          }

          return { pass: true, detail: 'Nothing left behind.' };
        },
      },
      {
        id: 'merged',
        label: 'You resolved a merge on this branch',
        async run() {
          const merges = await gitOut('log', 'main..HEAD', '--merges', '--format=%H');

          if (merges === '') {
            return {
              pass: false,
              detail:
                'No merge commit on your branch yet. Follow the steps above — the merge is what creates the conflict, and finishing it is what creates the commit this looks for.',
            };
          }

          const state = await gitOut('status', '--porcelain');

          if (/^(UU|AA|DU|UD)/m.test(state)) {
            return {
              pass: false,
              detail:
                'You are still in the middle of a merge. Once the file looks right: `git add <file>` then `git commit` to finish it.',
            };
          }

          return {
            pass: true,
            detail: `Merged and resolved — commit \`${merges.split('\n')[0].slice(0, 7)}\`.`,
          };
        },
      },
    ],
  },

  {
    id: 'javascript',
    title: 'The JavaScript this project assumes',
    phase: 'How the app works',
    minutes: 30,
    quiz: [
      {
        id: 'what-import-does',
        prompt:
          'A file has `export function parsePriceCents(...)`. Another has `import { parsePriceCents } from \'@/lib/products\'`. What is the `export` for?',
        options: [
          { id: 'a', label: 'It makes the function public on the internet.' },
          {
            id: 'b',
            label:
              'Nothing outside a file can see anything in it unless the file offers it.',
          },
          { id: 'c', label: 'It is required on every function in TypeScript.' },
          { id: 'd', label: 'It runs the function when the file loads.' },
        ],
        answer: 'b',
        explain:
          'A file is a sealed box. `export` is the file offering something outward; `import` is another file asking for it by name. That is why the failing test in a few steps says "Failed to resolve import" — you will be importing from a file that does not exist yet.',
      },
      {
        id: 'destructure',
        prompt: 'What does `const { data } = body;` do?',
        options: [
          { id: 'a', label: 'Copies the whole of `body` into a variable called `data`.' },
          { id: 'b', label: 'Pulls the `data` property out of `body` into its own variable.' },
          { id: 'c', label: 'Creates a new object containing only `data`.' },
          { id: 'd', label: 'Checks that `body` has a `data` property.' },
        ],
        answer: 'b',
        explain:
          'It is shorthand for `const data = body.data;`. The braces are a pattern describing the shape you want out. `const [posts, setPosts] = useState(...)` is the same idea with square brackets, for arrays — which is why the two things `useState` gives back can be named whatever you like.',
      },
    ],
  },

  {
    id: 'requests',
    title: 'Watch the conversation',
    phase: 'How the app works',
    minutes: 35,
    ask: [
      {
        id: 'get-repeat',
        prompt:
          'You ran the same `GET` three times and got the same answer, having changed nothing. Why does it matter that a GET behaves that way?',
        lookFor: [
          'browsers, caches and crawlers repeat GETs without asking',
          'a GET that changed things would change them unpredictably',
          'that is why the create form sends a POST instead',
        ],
        modelAnswer:
          'Because a GET gets repeated by things that never asked me. Pressing back, refreshing, a search engine following a link \u2014 all re-issue it. That is only safe because a GET is meant to read and not change. Anything that does change something has to be a POST, which is why the create form on `/posts` is one.',
      },
    ],
    checks: [
      {
        id: 'app-up',
        label: 'The app is running, so you can make requests to it',
        async run() {
          const response = await fetchLocal(APP, { timeout: 8_000 });

          if (response === null) {
            return {
              pass: false,
              detail:
                'Nothing is listening on port 3000. You need the app running for this step — `./script/server`.',
            };
          }

          return { pass: true, detail: `The app answered ${response.status}.` };
        },
      },
    ],
    quiz: [
      {
        id: 'html-vs-json',
        prompt:
          'You asked for `/posts` and then `/api/posts`. What was different about what came back?',
        options: [
          { id: 'a', label: 'Nothing — they returned the same thing.' },
          {
            id: 'b',
            label:
              '`/posts` returned HTML for a browser to draw; `/api/posts` returned JSON data.',
          },
          { id: 'c', label: '`/api/posts` was faster.' },
          { id: 'd', label: '`/posts` returned an error.' },
        ],
        answer: 'b',
        explain:
          'Same information, two audiences. A page is dressed up for a person — headings, layout, styling. An API answers with the values themselves, because the thing reading it is a program. That is the entire difference, and you just watched it.',
      },
      {
        id: 'empty-post',
        prompt:
          'You sent a `POST` to `/api/posts` with an empty body. What status code came back?',
        options: [
          { id: 'a', label: '200' },
          { id: 'b', label: '201' },
          { id: 'c', label: '400' },
          { id: 'd', label: '500' },
        ],
        answer: 'c',
        explain:
          '400 — "I cannot make sense of what you sent". The handler checked the body before touching the database and refused it politely. Note what it did *not* do: crash, or claim success. You will write that check yourself in a few steps.',
      },
      {
        id: 'missing-path',
        prompt: 'And `curl -i http://localhost:3000/api/nope` gave you which status?',
        options: [
          { id: 'a', label: '400' },
          { id: 'b', label: '404' },
          { id: 'c', label: '500' },
          { id: 'd', label: 'No response at all' },
        ],
        answer: 'b',
        explain:
          '404 — the server answered perfectly well, there is just nothing at that address. That is worth separating in your head from "the server is down", which gives you no response at all, and from 500, which means it broke while trying.',
      },
          ],
  },

  {
    id: 'two-machines',
    title: 'Which machine is this running on?',
    phase: 'How the app works',
    minutes: 25,
    ask: [
      {
        id: 'why-two-places',
        prompt:
          'In your own words: why did one `console.log` print in the terminal and the other in the browser?',
        lookFor: [
          'the two files ran on different machines',
          'a console.log prints wherever its code is running',
          "the page ran on the server; the component was sent to the browser",
        ],
        modelAnswer:
          'They ran in different places. `page.tsx` ran on the server, so its output went to the server log. `posts-board.tsx` was sent to my browser as code and ran there, so its output went to the browser console. A `console.log` prints wherever the code containing it happens to be running.',
      },
    ],
    checks: [
      {
        id: 'server-log',
        label: 'You added a log to the page',
        async run() {
          const source = await read('app/posts/page.tsx');

          if (source === null) {
            return { pass: false, detail: 'Could not read `app/posts/page.tsx`.' };
          }

          if (/console\.log\(\s*['"`]\[server\]/.test(source)) {
            return { pass: true, detail: 'Found the `[server]` log.' };
          }

          return {
            pass: false,
            detail:
              "No `console.log('[server] …')` in `app/posts/page.tsx`. Add it as the first line inside the `PostsPage` function.",
          };
        },
      },
      {
        id: 'browser-log',
        label: 'You added a log to the component',
        async run() {
          const source = await read('app/posts/posts-board.tsx');

          if (source === null) {
            return { pass: false, detail: 'Could not read `app/posts/posts-board.tsx`.' };
          }

          if (/console\.log\(\s*['"`]\[browser\]/.test(source)) {
            return { pass: true, detail: 'Found the `[browser]` log.' };
          }

          return {
            pass: false,
            detail:
              "No `console.log('[browser] …')` in `app/posts/posts-board.tsx`. Add it as the first line inside the `useEffect`.",
          };
        },
      },
    ],
    attest: [
      {
        id: 'saw-split',
        label: 'I saw `[server]` in the container log and `[browser]` in the browser console',
        hint: 'Two different places, and neither message appeared in the other.',
      },
      {
        id: 'found-source',
        label: 'I found `posts-board.tsx` in the browser\u2019s Sources tab',
      },
    ],
    quiz: [
      {
        id: 'where-logged',
        prompt:
          'Why did `[server]` appear in the container log and `[browser]` in the browser console?',
        options: [
          { id: 'a', label: 'Next.js routes server logs to the terminal for tidiness.' },
          {
            id: 'b',
            label:
              'They ran on two different computers — one on the server, one on the machine in front of you.',
          },
          { id: 'c', label: 'The browser console hides some messages.' },
          { id: 'd', label: 'One of them ran twice.' },
        ],
        answer: 'b',
        explain:
          'A `console.log` prints wherever it runs. Nothing was routed or hidden — the two files genuinely executed on two machines.',
      },
      {
        id: 'why-secret',
        prompt: 'You found your component\u2019s source in the browser. What follows from that?',
        options: [
          { id: 'a', label: 'Nothing — only developers can see it.' },
          {
            id: 'b',
            label:
              'That file cannot hold a password or an API key, because everyone using the app has a copy.',
          },
          { id: 'c', label: 'You should minify it before shipping.' },
          { id: 'd', label: 'The browser copied it by mistake.' },
        ],
        answer: 'b',
        explain:
          'Anything sent to a browser belongs to whoever owns that browser. Minifying changes nothing. So secrets stay in server code — and a component in the browser that needs data has to ask the server for it.',
      },
    ],
  },

  {
    id: 'use-client',
    title: 'The line that decides',
    phase: 'How the app works',
    minutes: 30,
    ask: [
      {
        id: 'which-to-use',
        prompt:
          'A filter box that narrows a list as you type needs `\'use client\'`. A page listing yesterday\u2019s orders does not. What is the difference?',
        lookFor: [
          'the filter changes after the page has loaded, in response to the user',
          'the orders page is rendered once and then sits there',
          'default to the server and reach for the client when something must react',
        ],
        modelAnswer:
          'The filter has to react to something that happens after the page arrives \u2014 my typing \u2014 so its code has to be in the browser where the typing is. The orders page is worked out once and then just sits there, so the server can do it with less code and one round trip instead of two. Default to the server; go to the client when something has to respond.',
      },
    ],
    checks: [
      {
        id: 'counter',
        label: 'You added a working counter to the component',
        async run() {
          const source = await read('app/posts/posts-board.tsx');

          if (source === null) {
            return { pass: false, detail: 'Could not read `app/posts/posts-board.tsx`.' };
          }

          const hasState = /useState\s*\(\s*0\s*\)/.test(source);
          const hasClick = /onClick=/.test(source);

          if (hasState && hasClick) {
            return { pass: true, detail: 'Found a `useState(0)` and an `onClick`.' };
          }

          return {
            pass: false,
            detail: hasState
              ? 'You have the `useState(0)`, but no `onClick` — nothing changes the number yet. Add the button.'
              : 'No `useState(0)` in the component yet. Add the counter described above.',
          };
        },
      },
      {
        id: 'use-client-intact',
        label: "`'use client'` is back on the first line",
        async run() {
          const source = await read('app/posts/posts-board.tsx');

          if (source === null) return { pass: false, detail: 'Could not read the component.' };

          if (/^\s*['"]use client['"]/m.test(source)) {
            return { pass: true, detail: 'The marker is there.' };
          }

          return {
            pass: false,
            detail:
              "`'use client'` is missing from `app/posts/posts-board.tsx`. If you took it out for the experiment, put it back — the page does not work without it, which was the point.",
          };
        },
      },
      {
        id: 'page-clean',
        label: '`app/posts/page.tsx` has no `useState` left in it',
        async run() {
          const source = await read('app/posts/page.tsx');

          if (source === null) return { pass: false, detail: 'Could not read the page.' };

          if (/useState/.test(source)) {
            return {
              pass: false,
              detail:
                'There is still a `useState` in `app/posts/page.tsx`. That was the experiment that was *supposed* to fail — take it back out so the page works again.',
            };
          }

          return { pass: true, detail: 'The page is a Server Component again.' };
        },
      },
    ],
    attest: [
      {
        id: 'removed-marker',
        label: "I removed `'use client'`, read the error, and put it back",
      },
      {
        id: 'state-on-server',
        label: 'I tried `useState` in `page.tsx` and read the error that gave me too',
      },
    ],
    quiz: [
      {
        id: 'what-marker-does',
        prompt: "What does `'use client'` actually do?",
        options: [
          { id: 'a', label: 'It makes the component load faster.' },
          {
            id: 'b',
            label: 'It sends that component to the browser, so it runs there as well.',
          },
          { id: 'c', label: 'It marks the file as belonging to the front end team.' },
          { id: 'd', label: 'It stops the component being rendered on the server.' },
        ],
        answer: 'b',
        explain:
          'It is an instruction about *where the code goes*. Without it, the component runs on the server and only its HTML is sent. With it, the code itself is shipped to the browser — which is what lets it hold state and respond to clicks, and what stops it holding secrets.',
      },
          ],
  },

  {
    id: 'using-ai',
    title: 'Using AI without it using you',
    phase: 'Taking on a task',
    minutes: 30,
    ask: [
      {
        id: 'why-type-it',
        prompt:
          'The rule is not "never look at the examples" — it is read them, look away, then write it. Why the looking away? What would you lose by transcribing it with the example open?',
        lookFor: [
          'transcribing is still copying, because the answer is in front of you',
          'producing it from understanding is what makes it stick',
          'you discover which lines you could not have written yourself',
          'afterwards you can write something similar rather than only recognising it',
        ],
        modelAnswer:
          'With the example open I am copying, just slowly — I never have to produce anything, because the answer is right there. Looking away turns it into producing, and that is where I discover which lines I could not have written myself, which is the useful information. Transcribing does make me read every character, which is worth something, but afterwards I can only recognise the code rather than write it again.',
      },
    ],
    attest: [
      {
        id: 'write-not-copy',
        label:
          'cs50.ai only, and no code enters this repo that I did not write myself',
        hint: 'Both halves. Turn off the assistant built into your editor — it suggests as you type, which is the failure mode this step is about. And "write it myself" means read the example, look away, then produce it — not pasted, and not transcribed with the example open.',
      },
    ],
    quiz: [
      {
        id: 'find-the-bug',
        prompt:
          'That `newestFirst` function looks right and is wrong twice. Which pair of problems does it have?',
        options: [
          {
            id: 'a',
            label:
              'It sorts oldest-first despite its name, and it reorders the caller\u2019s array in place.',
          },
          { id: 'b', label: 'It crashes on an empty array, and it is slow.' },
          { id: 'c', label: 'It does not handle `null`, and the return type is wrong.' },
          { id: 'd', label: 'Nothing is wrong with it.' },
        ],
        answer: 'a',
        explain:
          '`a - b` sorts ascending, which is oldest first — the opposite of the name. And `.sort()` rearranges the array it was given rather than returning a new one, so whoever called it now has their data in a different order without asking. Both are the kind of plausible, confident, wrong code these tools produce, and both are findable by reading it.',
      },
      {
        id: 'good-use',
        prompt:
          'Which of these can you ask cs50.ai during onboarding without breaking either rule?',
        options: [
          { id: 'a', label: '"Write me a POST endpoint for products."' },
          {
            id: 'b',
            label:
              '"Here is my endpoint and the error it gives. What should I look at first? Do not fix it."',
          },
          { id: 'c', label: '"Fix this file."' },
          { id: 'd', label: '"Write the tests for this so I do not have to."' },
        ],
        answer: 'b',
        explain:
          'It keeps you doing the work. You still have to read the code, form a theory, and make the change — the AI only narrows where to look. The other three hand over the part where the learning happens, and you find out at review, or at the next thing you cannot do.',
      },
    ],
  },

  {
    id: 'decomposition',
    title: 'Break the problem down',
    phase: 'Taking on a task',
    minutes: 35,
    ask: [
      {
        id: 'plan-review',
        // The rubric below describes the shape of a task list, not phrases to
        // find in prose, so the offline word match cannot score it.
        structural: true,
        prompt:
          'Paste your task list, then add one sentence: which task did you have the most trouble placing, and what decided it?',
        // Unusually, the rubric here is about the *shape* of what they wrote
        // rather than facts they should have recalled. Whether a breakdown is
        // any good is the one judgement in this course that a check cannot
        // make: `plan-tasks` can count items and `plan-ordered` can catch a
        // page built before its storage, and neither can tell whether a task
        // is one task.
        lookFor: [
          'every item is one piece of work, small enough to finish in a sitting',
          'nothing appears before the thing it needs to exist',
          'reading products and creating one are separate tasks',
          'something in the list says how you would know it works',
          'the sentence names a real ordering decision rather than restating the list',
        ],
        modelAnswer:
          'A good list reads something like: somewhere to keep a product; an address that hands products back; an address that accepts a new one; refusing a bad price; a page that shows them; a form that adds one; a browser test for the whole path. Each is finishable on its own, nothing sits above something that does not exist yet, and reading and writing are separate because they can be finished and checked separately. The hardest to place is usually validation \u2014 it is not obviously its own task until you ask who would notice if it were missing.',
      },
      {
        id: 'why-storage-first',
        prompt:
          'Why does the storage go first, and the page last? What would go wrong the other way round?',
        lookFor: [
          'each layer needs the one below it to exist',
          'building the page first means nothing real to read from',
          'you cannot tell whether it works until the thing underneath exists',
        ],
        modelAnswer:
          'Each layer needs the one below it. The page reads from an address, and that address reads from somewhere the data is kept. If I built the page first there would be nothing real behind it, so I could not tell whether any of it worked — I would be guessing until the very end.',
      },
    ],
    checks: [
      onSandboxBranch,
      {
        id: 'plan-exists',
        label: 'You wrote your plan down in `PLAN.md`',
        async run() {
          if (await exists('PLAN.md')) {
            return { pass: true, detail: 'Found `PLAN.md`.' };
          }

          return {
            pass: false,
            detail:
              'No `PLAN.md` at the top of the project. Create it and write out your task list — the shape is described above.',
          };
        },
      },
      {
        id: 'plan-tasks',
        label: 'It is a task list, not a paragraph',
        async run() {
          const source = await read('PLAN.md');

          if (source === null) return { pass: false, detail: 'No `PLAN.md` yet.' };

          const tasks = (source.match(/^\s*[-*]\s*\[[ xX]\]/gm) ?? []).length;

          if (tasks < 5) {
            return {
              pass: false,
              detail: `Found ${tasks} checklist item${tasks === 1 ? '' : 's'}, and this job has more parts than that.\n\nWrite them as markdown checkboxes — \`- [ ] Add somewhere to keep a product\` — one line per piece you could finish on its own. Aim for at least five.`,
            };
          }

          return {
            pass: true,
            detail: `${tasks} tasks. Each one should be small enough to finish in a sitting.`,
          };
        },
      },
      {
        id: 'plan-ordered',
        label: 'Nothing is built before the thing it needs',
        async run() {
          const source = await read('PLAN.md');

          if (source === null) return { pass: false, detail: 'No `PLAN.md` yet.' };

          // Only the checklist lines. Reading the whole file let the project's
          // own name — "Zizzu Store" — satisfy the search for "store".
          const tasks = source
            .split('\n')
            .filter((line) => /^\s*[-*]\s*\[[ xX]\]/.test(line))
            .map((line) => line.toLowerCase());

          const find = (words) =>
            tasks.findIndex((task) => words.some((word) => task.includes(word)));

          const storage = find(['model', 'table', 'database', 'store a', 'keep a', 'storing']);
          const ui = find(['page', 'form', 'button', 'screen']);

          if (storage === -1) {
            return {
              pass: false,
              detail:
                'No task mentions storing a product — a table, a model, a database. Somewhere to *put* a product has to exist before anything can read one back, so that is the bottom of the stack and the first task.',
            };
          }

          if (ui !== -1 && ui < storage) {
            return {
              pass: false,
              detail: `Task ${ui + 1} builds the page, but the thing it reads from is not until task ${storage + 1}.\n\nTrace it: on the day you finish the page, what does it show? Work upwards instead — storage, then the address that hands the data over, then the page.`,
            };
          }

          return {
            pass: true,
            detail:
              ui === -1
                ? 'Storage comes first. (No page task yet — add one if the job needs it.)'
                : `Storage at task ${storage + 1}, page at task ${ui + 1}. Every task has what it needs underneath it.`,
          };
        },
      },
    ],
    quiz: [
      {
        id: 'two-questions',
        prompt:
          '"The page needs the endpoint" and "I will build the endpoint on Tuesday" are answers to two different questions. Which pair?',
        options: [
          { id: 'a', label: 'What is hard, and what is easy.' },
          {
            id: 'b',
            label:
              'What needs what to exist (dependency), and what order I will work in (sequence).',
          },
          { id: 'c', label: 'What the user sees, and what the developer sees.' },
          { id: 'd', label: 'They are the same question said two ways.' },
        ],
        answer: 'b',
        explain:
          'Dependency is a fact about the code — the page cannot read from an endpoint that does not exist. Sequence is a choice about your week. They are related, because dependency limits which sequences work, but they are not the same and mixing them up is the commonest way a plan goes wrong.',
      },
      {
        id: 'trace-it',
        prompt: 'What is plan tracing, and why bother?',
        options: [
          { id: 'a', label: 'Running the code to see if it works.' },
          {
            id: 'b',
            label:
              'Walking through your list in order and asking what actually exists after each line — so you find the gaps before you write anything.',
          },
          { id: 'c', label: 'Drawing a diagram of the finished feature.' },
          { id: 'd', label: 'Asking a senior developer to check your plan.' },
        ],
        answer: 'b',
        explain:
          'It costs two minutes and finds the two things a plan is usually missing: a step that depends on something not built yet, and a piece nobody remembered at all. Both are far cheaper to find now than on the afternoon you hit them.',
      },
    ],
  },

  {
    id: 'issues',
    title: 'Issues and the board',
    phase: 'Taking on a task',
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
    id: 'database',
    title: 'Add a model to the database',
    phase: 'The tools of the trade',
    minutes: 55,
    attest: [
      {
        id: 'dry-run-read',
        label: 'I read the `--dry-run` output before applying it',
        hint: 'Run `docker compose exec app npx prisma-cli db update --dry-run`. It prints what it would do and changes nothing. On a database with real customers in it, that is the difference between a change and an incident.',
      },
    ],
    checks: [
      {
        id: 'seller-field',
        label: '`Product` has an optional `sellerId`',
        async run() {
          const source = await read('lib/prisma/contract.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read `lib/prisma/contract.ts`.' };
          }

          const model = source.match(/model\('Product',[\s\S]*?\n  \}\);/);

          if (!model) {
            return { pass: false, detail: 'No `Product` model found yet.' };
          }

          if (!/sellerId:/.test(model[0])) {
            return {
              pass: false,
              detail: '`Product` has no `sellerId` field yet.',
            };
          }

          // Required is the interesting failure: it is what a live database
          // would refuse, and the card is about why.
          if (!/sellerId:\s*field\.uuidString\(\)\.optional\(\)/.test(model[0])) {
            return {
              pass: false,
              detail:
                '`sellerId` is there but not optional. `Product` may already have rows, and nobody can say who sold those \u2014 so a required column would be rejected. Make it `field.uuidString().optional()`.',
            };
          }

          return { pass: true, detail: '`sellerId` is there, and optional.' };
        },
      },
      {
        id: 'seller-relation',
        label: '`Product` declares what `sellerId` points at',
        async run() {
          const source = await read('lib/prisma/contract.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read `lib/prisma/contract.ts`.' };
          }

          if (!/seller:\s*rel\.belongsTo\(\s*User/.test(source)) {
            return {
              pass: false,
              detail:
                'The column is there but nothing says what it points at. Add `seller: rel.belongsTo(User, { from: \'sellerId\', to: \'id\' })` to `Product.relations` in the `models` block.',
            };
          }

          if (!/from:\s*'sellerId'/.test(source) || !/to:\s*'id'/.test(source)) {
            return {
              pass: false,
              detail:
                'The relation is there but its ends look wrong \u2014 it should go `from: \'sellerId\'` `to: \'id\'`.',
            };
          }

          return { pass: true, detail: 'The relation is declared both ends.' };
        },
      },
      {
        id: 'emitted-again',
        label: 'The generated contract includes the relation',
        async run() {
          const generated = await read('lib/prisma/contract.json');

          if (generated === null) {
            return {
              pass: false,
              detail:
                'No generated contract. Run `npx prisma-cli contract emit`.',
            };
          }

          if (!/sellerId/.test(generated)) {
            const source = await read('lib/prisma/contract.ts');

            return {
              pass: false,
              detail: /sellerId/.test(source ?? '')
                ? 'Your `contract.ts` has the change but the generated file does not \u2014 they have drifted apart. Run `npx prisma-cli contract emit`.'
                : 'Nothing to regenerate yet \u2014 make the change in `contract.ts` first.',
            };
          }

          return { pass: true, detail: 'Contract and generated file agree.' };
        },
      },
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
        id: 'reset',
        label: '`resetDatabase` clears products too',
        async run() {
          const source = await read('test/helpers.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read `test/helpers.ts`.' };
          }

          if (/db\.orm\.public\.Product[\s\S]{0,120}deleteAll\(\)/.test(source)) {
            return {
              pass: true,
              detail: 'Every test will start without leftover products.',
            };
          }

          return {
            pass: false,
            detail:
              '`resetDatabase` in `test/helpers.ts` still only clears `Post` and `User`.\n\nAdd the `Product` line described above. This check exists because skipping it does not fail here — it fails three steps later, in a test you did not write, and looks like a bug in your handler.',
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
    id: 'typescript',
    title: 'TypeScript, the parts you need',
    phase: 'The tools of the trade',
    minutes: 45,
    attest: [
      {
        id: 'saw-editor-error',
        label: 'I saw my editor mark the mistake before I ran anything',
      },
    ],
    ask: [
      {
        id: 'why-annotations',
        prompt:
          'Your editor underlined the mistake before you ran anything. Nothing executed. How did it know?',
        lookFor: [
          'the function declares what type it takes',
          'passing something else contradicts what is already written',
          'a contradiction can be found by reading, without running',
        ],
        modelAnswer:
          'Nothing ran. `createPost` says in its own signature that `title` is a string, so handing it a number contradicts something already written down. A contradiction is findable by reading the code, which needs no database, no server and no test run \u2014 that is why it is instant.',
      },
    ],
    checks: [
      {
        id: 'tsc-clean',
        label: 'The project type-checks, and your experiment is cleaned up',
        slow: SLOW,
        async run() {
          const dirty = await gitOut('status', '--porcelain', '--', '__tests__/api/posts.test.ts');

          if (dirty !== '') {
            return {
              pass: false,
              detail:
                'You still have the deliberate mistake in `__tests__/api/posts.test.ts`. Take that line out again:\n\n```\ngit restore __tests__/api/posts.test.ts\n```',
            };
          }

          const result = await run('npx', ['tsc', '--noEmit'], { timeout: 180_000 });

          if (result.ok) {
            return {
              pass: true,
              detail: 'No type errors. Nothing was run to find that out.',
            };
          }

          return {
            pass: false,
            detail: `\`npx tsc --noEmit\` is reporting errors:\n\n\`\`\`\n${tail(result.stdout || result.stderr, 10)}\n\`\`\``,
          };
        },
      },
    ],
    quiz: [
            {
        id: 'union-meaning',
        prompt: 'What does `string | null` mean when you see it on a field?',
        options: [
          { id: 'a', label: 'The field is a string that might be empty.' },
          { id: 'b', label: 'Either a string or nothing — and you must handle both.' },
          { id: 'c', label: 'The field is optional and can be left out.' },
          { id: 'd', label: 'It is a string that will be converted to null.' },
        ],
        answer: 'b',
        explain:
          'The `|` means "one or the other". `content: string | null` says a post may genuinely have no content, and TypeScript will not let you call `.length` on it until you have checked which one you have. That check is the thing it is forcing you to remember.',
      },
    ],
  },

  {
    id: 'naming',
    title: 'What to call things',
    phase: 'The tools of the trade',
    minutes: 30,
    quiz: [
      {
        id: 'file-case',
        prompt:
          'You are adding a component that shows one product card. What do you call the file?',
        options: [
          { id: 'a', label: '`ProductCard.tsx`' },
          { id: 'b', label: '`product-card.tsx`' },
          { id: 'c', label: '`productCard.tsx`' },
          { id: 'd', label: '`product_card.tsx`' },
        ],
        answer: 'b',
        explain:
          'Files in this project are kebab-case — `posts-board.tsx`, `global-setup.ts`, `database-url.ts`. The component *inside* it is still `ProductCard`. Those two conventions are different on purpose, and the reason is dull but real: macOS and Windows treat `ProductCard.tsx` and `productcard.tsx` as the same file, Linux does not, and a repository that disagrees with itself about capitals breaks on somebody else\u2019s machine.',
      },
      {
        id: 'which-extension',
        prompt: 'Why is `posts-board.tsx` a `.tsx` while `route.ts` is a `.ts`?',
        options: [
          { id: 'a', label: '`.tsx` is for files in the `app/` folder.' },
          { id: 'b', label: '`.tsx` is for anything that runs in the browser.' },
          { id: 'c', label: '`.tsx` is for files that contain JSX — HTML-shaped markup.' },
          { id: 'd', label: 'They are interchangeable; it is a matter of taste.' },
        ],
        answer: 'c',
        explain:
          'The `x` is the only difference and it means "this file contains JSX". `route.ts` returns data and never writes a tag, so it does not need it. Put JSX in a `.ts` file and TypeScript reads the angle brackets as something else entirely and gives you an error that does not mention JSX at all.',
      },
      {
        id: 'function-name',
        prompt:
          'A function takes an unknown value and returns either a valid price or a reason it was refused. Best name?',
        options: [
          { id: 'a', label: '`price(raw)`' },
          { id: 'b', label: '`handlePrice(raw)`' },
          { id: 'c', label: '`parsePriceCents(raw)`' },
          { id: 'd', label: '`checkPriceCentsAndReturnResultOrError(raw)`' },
        ],
        answer: 'c',
        explain:
          'A verb first, because it does something. `price` sounds like a value, not an action. `handle` is the emptiest verb in programming — it tells you nothing about what happens. And the last one describes the implementation, which will change; the name should survive that.',
      },
    ],
  },

  {
    id: 'async',
    title: 'Nothing happens immediately',
    phase: 'The tools of the trade',
    minutes: 35,
    attest: [
      {
        id: 'saw-undefined',
        label: 'I deleted an `await` and read what came back instead',
      },
    ],
    ask: [
      {
        id: 'what-async-returns',
        prompt:
          'What do you actually get back when you call an `async` function, and what does `await` do to it?',
        lookFor: [
          'you get a promise, not the value',
          'a promise is a receipt you can wait on',
          '`await` turns the receipt into the value',
          '`await` only works inside a function marked `async`',
        ],
        modelAnswer:
          'A promise \u2014 always, even when the body returns a plain number. A promise is a receipt: it stands for a value that is not here yet. `await` is what redeems the receipt for the thing itself, and it only works inside a function marked `async`, which is why the two words turn up together everywhere.',
      },
    ],
    checks: [
      {
        id: 'await-restored',
        label: 'You put the `await` back',
        async run() {
          const dirty = await gitOut('status', '--porcelain', '--', '__tests__/api/posts.test.ts');

          if (dirty === '') {
            return { pass: true, detail: 'The test file is back as it was.' };
          }

          return {
            pass: false,
            detail:
              'You still have the deleted `await` in `__tests__/api/posts.test.ts`:\n\n```\ngit restore __tests__/api/posts.test.ts\n```',
          };
        },
      },
    ],
    quiz: [
      {
        id: 'forgotten-await',
        prompt:
          'You forget an `await` on a function that reads the database, then send the result as JSON. What does the caller receive?',
        options: [
          { id: 'a', label: 'An error saying you forgot to await.' },
          { id: 'b', label: 'The data, slightly later.' },
          { id: 'c', label: '`{}` — an empty object, with no error anywhere.' },
          { id: 'd', label: 'The request hangs forever.' },
        ],
        answer: 'c',
        explain:
          'A promise has no properties of its own to serialise, so `JSON.stringify` on one produces `{}`. Nothing throws. This is the shape of bug that costs juniors whole afternoons: correct-looking code, a wrong answer, and nothing at all to read.',
      },
          ],
  },

  {
    id: 'debugging',
    title: 'When it breaks',
    phase: 'The tools of the trade',
    minutes: 40,
    attest: [
      {
        id: 'found-in-logs',
        label: 'I found the real error in the container log, not in the browser',
      },
      { id: 'read-the-diff', label: 'I read the assertion diff and it told me the answer' },
    ],
    ask: [
      {
        id: 'first-question',
        prompt:
          'Something worked an hour ago and does not now. What is the first question, and what command answers it?',
        lookFor: [
          'what did I change',
          '`git diff` answers it immediately',
          'it rules out a whole universe of other theories',
        ],
        modelAnswer:
          'What did I change? Almost always the answer is me, and `git diff` tells me in one second. It rules out every theory that starts "maybe Next.js is broken", and it costs nothing to ask. Restarting things sometimes fixes it and teaches me nothing, so I meet the same bug again next week.',
      },
    ],
    checks: [
      {
        id: 'posts-route-restored',
        label: 'You put `app/api/posts/route.ts` back',
        async run() {
          const dirty = await gitOut('status', '--porcelain', '--', 'app/api/posts/route.ts');

          if (dirty === '') return { pass: true, detail: 'Restored.' };

          return {
            pass: false,
            detail:
              'The route still has your deliberate break in it:\n\n```\ngit restore app/api/posts/route.ts\n```',
          };
        },
      },
      {
        id: 'contract-restored',
        label: 'The contract and its generated files agree again',
        async run() {
          const dirty = await gitOut('status', '--porcelain', '--', 'lib/prisma');

          if (dirty === '') return { pass: true, detail: 'Back in step.' };

          return {
            pass: false,
            detail:
              '`lib/prisma` still has changes from the experiment:\n\n```\ngit restore lib/prisma\n```\n\nIf you meant to keep a contract change, run `npx prisma-cli contract emit` instead so the generated files match.',
          };
        },
      },
    ],
    quiz: [
      {
        id: 'where-does-it-surface',
        prompt:
          'The browser shows `{"error":"Failed to list posts"}` and a 500. Where is the *real* error?',
        options: [
          { id: 'a', label: 'In the browser console.' },
          { id: 'b', label: 'In the container log — the handler logged it before answering.' },
          { id: 'c', label: 'Nowhere; a 500 discards it.' },
          { id: 'd', label: 'In the database log.' },
        ],
        answer: 'b',
        explain:
          '`internalError` calls `console.error(message, error)` and *then* answers with a flat message. That is deliberate — a raw error can contain table names, queries, sometimes connection strings, so the detail goes where your team can see it and the caller gets the summary. The detail always exists. You just have to know which window.',
      },
          ],
  },

  {
    id: 'what-tests-are',
    title: 'What a test actually is',
    phase: 'Building it, tested',
    minutes: 30,
    attest: [
      {
        id: 'saw-it-catch',
        label: 'I broke the ordering and watched a test fail and name it',
      },
    ],
    ask: [
      {
        id: 'what-tests-buy',
        prompt:
          'Six months from now, someone changes a line near your endpoint. What have your tests bought them?',
        lookFor: [
          'a fast answer to "did I break anything somebody wrote down"',
          'it is what makes the code changeable at all',
          'not about finding bugs today',
        ],
        modelAnswer:
          'A fast answer to "did I break something somebody already decided mattered". That is not about catching bugs today \u2014 it is what makes the code editable at all. Code nobody dares touch is where projects die, and a suite that answers in thirty seconds is what lets a stranger change it. In six months that stranger is me.',
      },
    ],
    checks: [
      {
        id: 'ordering-restored',
        label: 'You put the ordering back',
        async run() {
          const source = await read('app/api/posts/route.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read `app/api/posts/route.ts`.' };
          }

          if (/createdAt\.desc\(\)/.test(source)) {
            return { pass: true, detail: 'Back to `.desc()` — newest first.' };
          }

          return {
            pass: false,
            detail:
              'The ordering in `app/api/posts/route.ts` is still changed. Put `.desc()` back, or undo the whole file:\n\n```\ngit restore app/api/posts/route.ts\n```',
          };
        },
      },
    ],
    quiz: [
      {
        id: 'what-a-test-is',
        prompt: 'What is a test, in one line?',
        options: [
          { id: 'a', label: 'A tool that finds bugs in your code automatically.' },
          {
            id: 'b',
            label:
              'Code that sets up a situation, runs your code, and checks the answer is what you said it would be.',
          },
          { id: 'c', label: 'A check that your code compiles and has no syntax errors.' },
          { id: 'd', label: 'A report showing how much of your code has been run.' },
        ],
        answer: 'b',
        explain:
          'It is ordinary code, and it is not clever. It arranges a situation, calls your function, and compares what came back with what you claimed. A test cannot find a bug you never described — which is why the suite stayed green when the title limit broke.',
      },
          ],
  },

  {
    id: 'tdd',
    title: 'Write a test, then make it pass',
    phase: 'Building it, tested',
    minutes: 60,
    ask: [
      {
        id: 'why-red-first',
        prompt:
          'You just watched the whole suite pass while the app was broken. In your own words: why is it not enough for a test to pass?',
        lookFor: [
          'a passing suite only covers behaviour somebody wrote a test for',
          'nothing was watching the title limit',
          'a test that has only ever passed might not be connected to the code',
        ],
        modelAnswer:
          'A passing suite only tells me that the things somebody wrote tests for still work. Nobody had written a test for the title limit, so nothing noticed when I broke it. And a test I have only ever seen pass might not be testing anything at all — watching it fail first is how I know it is really connected.',
      },
    ],
    attest: [
      {
        id: 'green-but-broken',
        label: 'I saw the whole suite pass while the app was visibly broken',
        hint: 'That is the point of the experiment. Do not tick it until you have seen it.',
      },
    ],
    checks: [
      onSandboxBranch,
      {
        id: 'limit-restored',
        label: 'You put the title limit back to 200',
        async run() {
          const source = await read('app/api/posts/route.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read `app/api/posts/route.ts`.' };
          }

          if (/TITLE_MAX_LENGTH\s*=\s*200\b/.test(source)) {
            return { pass: true, detail: 'Back to 200. The experiment left nothing behind.' };
          }

          const found = source.match(/TITLE_MAX_LENGTH\s*=\s*(\d+)/);

          return {
            pass: false,
            detail: found
              ? `\`TITLE_MAX_LENGTH\` is still ${found[1]}. Put it back to 200 — you broke it on purpose, and leaving it broken would be a real bug in a real file.`
              : 'Could not find `TITLE_MAX_LENGTH` in the route. Restore the file with `git restore app/api/posts/route.ts`.',
          };
        },
      },
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
          if (!(await exists('app/api/products/route.ts'))) {
            return { pass: true, detail: 'No route yet — good.' };
          }

          // Re-running the step later must not strand the reader on a check
          // that asserts the absence of a file they have since written. If the
          // history shows the test came first, the point was made.
          const testSha = await commitThatAdded('__tests__/api/products.test.ts');
          const routeSha = await commitThatAdded('app/api/products/route.ts');

          if (testSha && routeSha && (await isAncestor(testSha, routeSha))) {
            return { pass: true, detail: 'You wrote the route, but the test came first.' };
          }

          return {
            pass: false,
            detail:
              '`app/api/products/route.ts` already exists, and no commit shows the test coming first.\n\nDelete the route, watch the test fail, then write it back. A test you have never watched fail is a test you have no reason to trust.',
          };
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
    quiz: [
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
    ],
  },

  {
    id: 'prep',
    title: 'PREP — think before you type',
    phase: 'Building it, tested',
    minutes: 50,
    ask: [
      {
        id: 'why-examples-first',
        prompt:
          'You wrote the examples before the function. What did that change about writing the code itself?',
        lookFor: [
          'the decisions were already made before coding started',
          'the examples became the tests',
          'the function was short because the thinking was done',
        ],
        modelAnswer:
          'Writing the examples forced me to decide what counts as a valid price before I wrote any code — text, decimals, zero, negatives. By the time I got to the function the decisions were already made, so it was short, and I did not have to invent test cases afterwards because the examples were already the tests.',
      },
    ],
    attest: [
      {
        id: 'saw-hover',
        label: 'I hovered over `parsePriceCents` somewhere it is called and saw my own words',
      },
    ],
    checks: [
      {
        id: 'has-docblock',
        label: '`parsePriceCents` has a docblock above it',
        async run() {
          const source = await read('lib/products.ts');

          if (source === null) {
            return { pass: false, detail: 'Could not read `lib/products.ts`.' };
          }

          // A `/** … */` immediately above the export, with only blank lines
          // between — a comment three functions away is not documenting this one.
          const pattern =
            /\/\*\*[\s\S]*?\*\/\s*export\s+function\s+parsePriceCents/;

          if (!pattern.test(source)) {
            return {
              pass: false,
              detail:
                'No `/** … */` block directly above `export function parsePriceCents`.\n\nIt has to be `/**` with two stars — `/*` or `//` are ordinary comments and your editor will not show them on hover.',
            };
          }

          return { pass: true, detail: 'Found it.' };
        },
      },
      {
        id: 'docblock-useful',
        label: 'It says something the code cannot say for itself',
        async run() {
          const source = (await read('lib/products.ts')) ?? '';
          const block = source.match(
            /(\/\*\*[\s\S]*?\*\/)\s*export\s+function\s+parsePriceCents/,
          );

          if (!block) return { pass: false, detail: 'Write the docblock first.' };

          const text = block[1].toLowerCase();
          const words = block[1].replace(/[\s*/@]/g, '').length;

          if (words < 90) {
            return {
              pass: false,
              detail:
                'That is very short. Say what the function is for, what a caller gets back in both cases, and one thing the code cannot explain on its own — such as why the price is in cents.',
            };
          }

          const covers = [
            ['what comes in', /raw|unknown|input|body|value|argument/],
            ['what goes back', /return|ok|error|cents|result|refus/],
          ].filter(([, pattern]) => !pattern.test(text));

          if (covers.length > 0) {
            return {
              pass: false,
              detail: `Your docblock does not mention **${covers.map(([name]) => name).join(' or ')}**.\n\nA reader hovering this needs both: what to hand it, and what they get back when it works and when it does not.`,
            };
          }

          return { pass: true, detail: 'It documents what goes in and what comes back.' };
        },
      },
      onSandboxBranch,
      {
        id: 'prep-notes',
        label: 'You wrote the PREP out, above the function',
        async run() {
          const source = await read('lib/products.ts');

          if (source === null) {
            return {
              pass: false,
              detail: 'No `lib/products.ts` yet. Create it — the shape is described above.',
            };
          }

          const wanted = ['parameters', 'returns', 'examples', 'pseudocode'];
          const lower = source.toLowerCase();
          const missing = wanted.filter((word) => !lower.includes(word));

          if (missing.length > 0) {
            return {
              pass: false,
              detail: `Your comment block is missing: **${missing.join(', ')}**.\n\nAll four, written out before the code. It takes two minutes and it is the whole exercise.`,
            };
          }

          return { pass: true, detail: 'All four parts are there.' };
        },
      },
      {
        id: 'exported',
        label: '`parsePriceCents` is exported',
        async run() {
          const source = await read('lib/products.ts');

          if (source === null) return { pass: false, detail: 'No `lib/products.ts` yet.' };

          if (/export\s+function\s+parsePriceCents/.test(source)) {
            return { pass: true, detail: 'Found the function.' };
          }

          return {
            pass: false,
            detail:
              'No `export function parsePriceCents(...)` in `lib/products.ts`. It has to be exported, or the test cannot import it.',
          };
        },
      },
      {
        id: 'examples-are-tests',
        label: 'Every example became a test',
        async run() {
          const source = await read('__tests__/products.test.ts');

          if (source === null) {
            return {
              pass: false,
              detail:
                'No `__tests__/products.test.ts`. Your examples go here — one `it` per case.',
            };
          }

          const cases = (source.match(/\bit\(/g) ?? []).length;
          // Counting `it(` alone passes five empty bodies. An assertion is what
          // makes it a test.
          const assertions = (source.match(/\bexpect\(/g) ?? []).length;

          if (cases < 5) {
            return {
              pass: false,
              detail: `Only ${cases} test${cases === 1 ? '' : 's'}. The examples above list more cases than that, and each one deserves its own \`it\` — when a test fails, its name should tell you what broke.`,
            };
          }

          if (assertions < cases) {
            return {
              pass: false,
              detail: `${cases} \`it\` blocks but only ${assertions} \`expect\`. A test with nothing to assert passes whatever the code does — which is the failure the last step was about.`,
            };
          }

          return { pass: true, detail: `${cases} tests, ${assertions} assertions.` };
        },
      },
      {
        id: 'passes',
        label: 'They pass',
        slow: SLOW,
        async run() {
          const { passed, output, timedOut } = await runVitest('__tests__/products.test.ts');

          if (timedOut) {
            return { pass: false, detail: 'Timed out. Is Postgres up? `./script/server`.' };
          }

          if (passed) {
            return {
              pass: true,
              detail:
                'Green — and you wrote the examples before the code, which is the habit the rest of this tutorial is built on.',
            };
          }

          return {
            pass: false,
            detail: `Not passing yet.${databaseHint(output)}\n\n\`\`\`\n${tail(output)}\n\`\`\``,
          };
        },
      },
    ],
  },

  {
    id: 'post-happy',
    title: 'POST — creating something',
    phase: 'Building it, tested',
    minutes: 45,
    ask: [
      {
        id: 'why-post-here',
        prompt:
          'Back in the requests step you learned when to use POST instead of GET. Without looking: why is creating a post a POST?',
        lookFor: [
          'it changes something on the server',
          'GET is repeated by browsers, caches and crawlers without asking',
          'a repeated create would create duplicates',
        ],
        modelAnswer:
          'Because it changes something. A GET gets repeated \u2014 refresh, back button, a crawler following a link \u2014 and nothing asks me first. If creating a post were a GET, every one of those repeats would make another post. POST is the method for "this changes state", and the browser treats it accordingly.',
      },
    ],
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
    title: 'Refusing bad input',
    phase: 'Building it, tested',
    minutes: 60,
    checks: [
      {
        id: 'bad-json',
        label: 'A body that is not JSON gets a 400',
        async run() {
          const source = await read('app/api/products/route.ts');

          if (source === null) {
            return { pass: false, detail: 'No `app/api/products/route.ts` yet.' };
          }

          // `request.json()` throws on malformed input, so the handler has to
          // catch it rather than let it become a 500.
          if (!/try\s*\{[\s\S]{0,200}request\.json\(\)/.test(source)) {
            return {
              pass: false,
              detail:
                '`await request.json()` is not inside a `try`. It throws on a body that is not JSON, and an uncaught throw becomes a 500 \u2014 which tells the caller nothing about what they got wrong.',
            };
          }

          const test = await read('__tests__/api/products.test.ts');

          if (test === null || !/postRawRequest/.test(test)) {
            return {
              pass: false,
              detail:
                'The handler guards it, but no test proves it. Use `postRawRequest(\'/api/products\', \'not json\')` \u2014 `postRequest` would serialise your string into valid JSON, so it cannot reach this branch.',
            };
          }

          return { pass: true, detail: 'Guarded, and a test sends real junk at it.' };
        },
      },
      {
        id: 'missing-name',
        label: 'A missing or empty name gets a 400',
        async run() {
          const source = await read('app/api/products/route.ts');

          if (source === null) {
            return { pass: false, detail: 'No `app/api/products/route.ts` yet.' };
          }

          if (!/\.trim\(\)/.test(source)) {
            return {
              pass: false,
              detail:
                'Nothing trims the name. A name of three spaces is not missing by `typeof`, but it is still not a name \u2014 and untrimmed, `\"  Mug  \"` and `\"Mug\"` become two different products.',
            };
          }

          return { pass: true, detail: 'The name is trimmed before it is judged.' };
        },
      },
      {
        id: 'uses-parse',
        label: 'The handler reuses `parsePriceCents`',
        async run() {
          const source = await read('app/api/products/route.ts');

          if (source === null) {
            return { pass: false, detail: 'No `app/api/products/route.ts` yet.' };
          }

          if (!/parsePriceCents/.test(source)) {
            return {
              pass: false,
              detail:
                'The handler does not use `parsePriceCents`. You wrote and tested it in the PREP step against eight examples \u2014 writing those checks a second time here means two places to keep in step, and one of them has no tests.',
            };
          }

          return { pass: true, detail: 'Reused, so the edge cases stay tested in one place.' };
        },
      },
      {
        id: 'duplicate-name',
        label: 'A duplicate name gets a 422',
        async run() {
          const source = await read('app/api/products/route.ts');

          if (source === null) {
            return { pass: false, detail: 'No `app/api/products/route.ts` yet.' };
          }

          if (!/\b422\b/.test(source)) {
            return {
              pass: false,
              detail:
                'Nothing answers 422. A duplicate name is understood perfectly and still cannot be done \u2014 which is exactly the distinction between 400 and 422.',
            };
          }

          const helpers = await read('test/helpers.ts');

          if (helpers === null || !/createProduct/.test(helpers)) {
            return {
              pass: false,
              detail:
                'The handler refuses duplicates, but `test/helpers.ts` has no `createProduct`. This test needs a product to already exist \u2014 put the fixture next to `createPost` rather than repeating the setup inline.',
            };
          }

          return { pass: true, detail: '422 on duplicates, with a fixture to arrange it.' };
        },
      },
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
    quiz: [
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
    id: 'ui',
    title: 'Put a page on top of it',
    phase: 'Shipping it',
    minutes: 75,
    ask: [
      {
        id: 'client-again',
        prompt:
          'You are about to add a page. Recall the rule from the Client Components step: how do you decide whether this file needs `\'use client\'`?',
        lookFor: [
          'does anything have to react after the page has loaded',
          'default to the server',
          'the client is for state, events and effects',
        ],
        modelAnswer:
          'I ask whether anything on it has to react after the page arrives \u2014 a click, typing, state that changes. If not, it stays a Server Component, which is the default and the cheaper one. `\'use client\'` is for the pieces that need to be running in the browser to do their job.',
      },
    ],
    checks: [
      {
        id: 'board-copied',
        label: 'The products board is in place',
        async run() {
          const source = await read('app/products/products-board.tsx');

          if (source === null) {
            return {
              pass: false,
              detail:
                'No `app/products/products-board.tsx` yet. The `curl` above writes it \u2014 make sure `app/products/` exists first.',
            };
          }

          if (!/export function ProductsBoard/.test(source)) {
            return {
              pass: false,
              detail:
                'That file does not export `ProductsBoard`. Did the `curl` write an error page into it? Open it and look.',
            };
          }

          return { pass: true, detail: 'Found `ProductsBoard`.' };
        },
      },
      {
        id: 'key-fixed',
        label: 'Bug one: list items have a `key`',
        async run() {
          const source = await read('app/products/products-board.tsx');

          if (source === null) {
            return { pass: false, detail: 'No products board to check yet.' };
          }

          const item = source.match(/<li[^>]*>/);

          if (!item) {
            return { pass: false, detail: 'No `<li>` found in the board.' };
          }

          if (!/key=/.test(item[0])) {
            return {
              pass: false,
              detail:
                'The `<li>` still has no `key`. The browser console names this one.',
            };
          }

          // The index is the wrong stable identity, and it is the fix people
          // reach for first — so it gets its own answer.
          if (/key=\{\s*(index|i)\s*\}/.test(item[0])) {
            return {
              pass: false,
              detail:
                'A `key` is there, but it is the array index \u2014 which changes the moment anything is inserted or removed, so React matches up the wrong rows. Use something stable: `key={product.id}`.',
            };
          }

          return { pass: true, detail: 'The `<li>` has a stable `key`.' };
        },
      },
      {
        id: 'deps-fixed',
        label: 'Bug two: the effect runs once, not forever',
        async run() {
          const source = await read('app/products/products-board.tsx');

          if (source === null) {
            return { pass: false, detail: 'No products board to check yet.' };
          }

          if (!/useEffect\(/.test(source)) {
            return { pass: false, detail: 'No `useEffect` found in the board.' };
          }

          // The effect ends `}, []);` when fixed and `});` while broken.
          if (!/\n\s*\},\s*\[\s*\]\s*\);/.test(source)) {
            return {
              pass: false,
              detail:
                'The `useEffect` still has no dependency list, so it runs after every render \u2014 and it sets state, which causes another render. Watch the network tab. It ends `});`; it should end `}, []);`.',
            };
          }

          return {
            pass: true,
            detail: 'The effect has an empty dependency list, so it runs once.',
          };
        },
      },
      {
        id: 'price-fixed',
        label: 'Bug three: the price is not a hundred times too big',
        async run() {
          const source = await read('app/products/products-board.tsx');

          if (source === null) {
            return { pass: false, detail: 'No products board to check yet.' };
          }

          if (!/priceCents\s*\/\s*100/.test(source)) {
            return {
              pass: false,
              detail:
                'The price is still rendered straight from `priceCents`, so 899 shows as 899 rather than 8.99. Nothing errors \u2014 it is just wrong. Divide by 100 where you display it.',
            };
          }

          if (!/toFixed\(\s*2\s*\)/.test(source)) {
            return {
              pass: false,
              detail:
                'Dividing is right, but `900 / 100` renders as `9`, not `9.00`. Money always shows both decimal places \u2014 `.toFixed(2)`.',
            };
          }

          return { pass: true, detail: 'Cents are converted where they are shown.' };
        },
      },
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
        id: 'three-found',
        label: 'I found all three, and I know where each one showed itself',
        hint: 'One is a console warning, one is visible in the network tab, and one shows nothing anywhere \u2014 the page just says the wrong number. If you have only found two, the third is the silent one.',
      },
      {
        id: 'e2e-passes',
        label: 'I ran `npm run test:e2e` and my products test passes',
        hint: 'Stop the containerised app first (`docker compose stop app`). Playwright starts its own dev server pointed at the *test* database, and it will reuse whatever is already on port 3000 if you leave it up.',
      },
    ],
  },

  {
    id: 'pull-request',
    title: 'Open a pull request',
    phase: 'Shipping it',
    minutes: 60,
    ask: [
      {
        id: 'history-recall',
        prompt:
          'Your reviewer is about to read your commits. From the commit step, hours ago: what makes a history readable, and what makes one annoying to review?',
        lookFor: [
          'one commit per one change, small and self-contained',
          'the subject says what changed and why, not what file',
          'a giant commit or "fix stuff" forces the reviewer to work it out',
        ],
        modelAnswer:
          'Small commits that each do one thing, with subjects that say what changed rather than which file moved. A reviewer can read those one at a time and follow the reasoning. One enormous commit, or a run of "wip" and "fix stuff", makes them reconstruct my thinking from the diff \u2014 which is slow, and where review comments start to be about the wrong things.',
      },
    ],
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
      {
        id: 'reviewed-one',
        label: 'I read someone else\u2019s pull request and left a real comment',
        hint: 'A teammate\u2019s, or one on any public repository you use \u2014 open source pull requests are public and readable. Read the description, then the tests, then the code, and ask one genuine question. Reviewing is half the job and it arrives in your first fortnight.',
      },
      {
        id: 'green-before-push',
        label: '`npm test` and `npm run lint` both pass',
        hint: 'Run them before you push, not after somebody asks. Anything a machine can tell you in thirty seconds should never cost a reviewer a round trip. `npm run lint -- --fix` handles most of what the linter finds.',
      },
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
    title: 'Close the loop and tidy up',
    phase: 'Shipping it',
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
    // `lookFor` and `modelAnswer` stay on the server, like quiz answers do.
    ask: (step.ask ?? []).map(({ id, prompt }) => ({ id, prompt })),
  }));
}

/**
 * Runs a step's checks, in order.
 *
 * `only` limits the run to the given check ids, which is how a card verifies
 * just its own instruction instead of the whole step.
 */
export async function runChecks(stepId, only = null) {
  const step = stepsById.get(stepId);

  if (!step?.checks) return [];

  const wanted = only ? step.checks.filter((c) => only.includes(c.id)) : step.checks;
  const results = [];

  for (const check of wanted) {
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

/** One written question, with the rubric its author wrote for it. */
export function askQuestion(stepId, questionId) {
  return stepsById.get(stepId)?.ask?.find((entry) => entry.id === questionId) ?? null;
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
