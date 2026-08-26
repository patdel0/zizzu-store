import { createServer } from 'node:http';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, extname } from 'node:path';
import { gradeQuiz, publicSteps, runChecks, stepsById } from './checks.mjs';
import { currentBranch, repoRoot } from './lib/shell.mjs';

/**
 * The onboarding tutorial server.
 *
 * Two things about how this is built are deliberate:
 *
 * 1. **No dependencies.** A trainee on their first day should be able to run
 *    `node onboarding/server.mjs` and have it work, before `npm install` has
 *    ever finished.
 *
 * 2. **Everything is read into memory at boot.** This file lives on the
 *    `onboarding` branch, which the trainee switches away from almost
 *    immediately. Holding the pages and the step content in memory means the
 *    tutorial keeps working while its own source is not checked out.
 *
 * The server binds to localhost and only ever *reads* the repository — the
 * browser posts a step id, never a path or a command.
 */

const PORT = Number(process.env['ONBOARDING_PORT'] ?? 4000);

/** Progress lives outside the repo, so switching branches never loses it. */
const PROGRESS_DIR = join(homedir(), '.zizzu-onboarding');
const PROGRESS_FILE = join(PROGRESS_DIR, 'progress.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// ---------------------------------------------------------------------------
// Boot: read everything we will ever need to serve
// ---------------------------------------------------------------------------

const here = import.meta.dirname;

const assets = new Map();
const content = new Map();

for (const name of await readdir(join(here, 'public'))) {
  assets.set(`/${name}`, {
    body: await readFile(join(here, 'public', name)),
    type: MIME[extname(name)] ?? 'application/octet-stream',
  });
}

for (const name of await readdir(join(here, 'steps'))) {
  if (name.endsWith('.md')) {
    // `03-branch.md` holds the content for the step with id `branch`.
    content.set(
      name.replace(/^\d+-/, '').replace(/\.md$/, ''),
      await readFile(join(here, 'steps', name), 'utf8'),
    );
  }
}

const missing = publicSteps()
  .map((step) => step.id)
  .filter((id) => !content.has(id));

if (missing.length > 0) {
  console.error(`No step content for: ${missing.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

const emptyProgress = { steps: {}, quiz: {}, attest: {} };

async function loadProgress() {
  try {
    return { ...emptyProgress, ...JSON.parse(await readFile(PROGRESS_FILE, 'utf8')) };
  } catch {
    return structuredClone(emptyProgress);
  }
}

let progress = await loadProgress();

async function saveProgress() {
  await mkdir(PROGRESS_DIR, { recursive: true });
  await writeFile(PROGRESS_FILE, `${JSON.stringify(progress, null, 2)}\n`);
}

/**
 * A step counts as done when every check passed, every quiz question was
 * answered correctly, and every attestation was ticked.
 */
function isStepComplete(stepId, checkResults) {
  const step = stepsById.get(stepId);

  if (!step) return false;

  const checksPass =
    (step.checks ?? []).length === 0 ||
    (checkResults !== undefined
      ? checkResults.every((result) => result.pass)
      : progress.steps[stepId]?.checksPassed === true);

  const quizPass = (step.quiz ?? []).every(
    (question) => progress.quiz[`${stepId}.${question.id}`] === true,
  );

  const attestPass = (step.attest ?? []).every(
    (item) => progress.attest[`${stepId}.${item.id}`] === true,
  );

  return checksPass && quizPass && attestPass;
}

function progressSnapshot() {
  const done = {};

  for (const step of publicSteps()) {
    done[step.id] = {
      complete: isStepComplete(step.id),
      checksPassed: progress.steps[step.id]?.checksPassed ?? false,
      lastResults: progress.steps[step.id]?.lastResults ?? null,
    };
  }

  return { steps: done, quiz: progress.quiz, attest: progress.attest };
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

function json(response, status, body) {
  const payload = JSON.stringify(body);

  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  response.end(payload);
}

/** Reads a JSON request body, with a small cap — nothing here needs to be big. */
async function readBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;

    if (size > 64 * 1024) throw new Error('Request body too large');

    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const routes = {
  async 'GET /api/state'() {
    return {
      steps: publicSteps(),
      progress: progressSnapshot(),
      branch: await currentBranch(),
      repoRoot,
    };
  },

  async 'POST /api/check'(body) {
    const stepId = String(body.step ?? '');

    if (!stepsById.has(stepId)) return { error: 'Unknown step' };

    const results = await runChecks(stepId);
    const checksPassed = results.every((result) => result.pass);

    progress.steps[stepId] = { checksPassed, lastResults: results };
    await saveProgress();

    return { results, complete: isStepComplete(stepId, results) };
  },

  async 'POST /api/quiz'(body) {
    const stepId = String(body.step ?? '');
    const questionId = String(body.question ?? '');
    const graded = gradeQuiz(stepId, questionId, String(body.choice ?? ''));

    if (graded === null) return { error: 'Unknown question' };

    // Only a correct answer is recorded, so a wrong guess can be retried.
    if (graded.correct) {
      progress.quiz[`${stepId}.${questionId}`] = true;
      await saveProgress();
    }

    return { ...graded, complete: isStepComplete(stepId) };
  },

  async 'POST /api/attest'(body) {
    const stepId = String(body.step ?? '');
    const step = stepsById.get(stepId);
    const itemId = String(body.item ?? '');

    if (!step?.attest?.some((item) => item.id === itemId)) {
      return { error: 'Unknown item' };
    }

    progress.attest[`${stepId}.${itemId}`] = body.value === true;
    await saveProgress();

    return { ok: true, complete: isStepComplete(stepId) };
  },

  async 'POST /api/reset'() {
    progress = structuredClone(emptyProgress);
    await saveProgress();

    return { ok: true, progress: progressSnapshot() };
  },
};

const server = createServer(async (request, response) => {
  // Only this machine talks to this server, and only through a browser tab we
  // opened ourselves. Rejecting other Host headers keeps a page on the wider
  // internet from pointing a request at it.
  const host = (request.headers.host ?? '').split(':')[0];

  if (host !== 'localhost' && host !== '127.0.0.1') {
    response.writeHead(403).end('Forbidden');

    return;
  }

  const url = new URL(request.url ?? '/', 'http://localhost');
  const path = url.pathname === '/' ? '/index.html' : url.pathname;

  try {
    const asset = assets.get(path);

    if (asset && request.method === 'GET') {
      response.writeHead(200, {
        'Content-Type': asset.type,
        'Content-Length': asset.body.length,
        'Cache-Control': 'no-store',
      });
      response.end(asset.body);

      return;
    }

    if (request.method === 'GET' && path.startsWith('/api/content/')) {
      const stepId = path.slice('/api/content/'.length);
      const markdown = content.get(stepId);

      if (markdown === undefined) return json(response, 404, { error: 'Unknown step' });

      return json(response, 200, { markdown });
    }

    const handler = routes[`${request.method} ${path}`];

    if (!handler) return json(response, 404, { error: 'Not found' });

    const body = request.method === 'POST' ? await readBody(request) : {};
    const result = await handler(body);

    return json(response, result?.error ? 400 : 200, result);
  } catch (error) {
    console.error(`${request.method} ${path} failed:`, error);

    return json(response, 500, { error: error.message });
  }
});

server.listen(PORT, '127.0.0.1', async () => {
  const branch = await currentBranch();

  console.log('');
  console.log('  Zizzu onboarding');
  console.log(`  http://localhost:${PORT}`);
  console.log('');
  console.log(`  Watching:  ${repoRoot}`);
  console.log(`  Branch:    ${branch}`);
  console.log(`  Progress:  ${PROGRESS_FILE}`);
  console.log('');
  console.log('  Leave this running. You can switch branches freely — the');
  console.log('  tutorial has already loaded everything it needs.');
  console.log('');
});
