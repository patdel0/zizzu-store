import { createServer } from 'node:http';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, extname } from 'node:path';
import { askQuestion, gradeQuiz, publicSteps, runChecks, stepsById } from './checks.mjs';
import * as llm from './lib/llm.mjs';
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  resolveLocale,
  translator,
} from './lib/i18n.mjs';
import { splitCards } from './lib/cards.mjs';
import { currentBranch, repoRoot } from './lib/shell.mjs';
import { watchRepo } from './lib/watch.mjs';

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

/**
 * The Groq key, if there is one, lives outside the repository — in the same
 * directory as the progress file.
 *
 * Not in `onboarding/.env`: the trainee switches off this branch within a few
 * steps, which would delete that file from disk. It would appear to work until
 * the next restart and then break, on a different branch, looking like
 * something else entirely.
 */
try {
  process.loadEnvFile(join(homedir(), '.zizzu-onboarding', 'env'));
} catch {
  // No file, no key, no feature. That is a supported way to run this.
}

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

/** Walks `public/` so nested folders — `vendor/` — are served too. */
async function loadAssets(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      await loadAssets(path, `${prefix}/${entry.name}`);

      continue;
    }

    assets.set(`${prefix}/${entry.name}`, {
      body: await readFile(path),
      type: MIME[extname(entry.name)] ?? 'application/octet-stream',
    });
  }
}

await loadAssets(join(here, 'public'));

/**
 * Reference pages, which are not steps.
 *
 * Conventions, command lists and lookup tables are consulted twenty times and
 * read linearly once. Keeping them off the critical path is the point: course
 * length predicts abandonment, and a reference read in sequence is length that
 * teaches nothing.
 */
const reference = new Map();

/**
 * Reads a directory of markdown into `store`, keyed `<locale>:<name>`.
 *
 * English sits at the top level and each translation in a subdirectory named
 * for its locale, so adding one is adding a folder — no existing path moves,
 * and a locale with three files translated is three translated files rather
 * than a broken course.
 */
async function loadMarkdown(directory, store, key) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && isLocale(entry.name)) {
      for (const file of await readdir(join(directory, entry.name))) {
        if (!file.endsWith('.md')) continue;

        store.set(
          `${entry.name}:${key(file)}`,
          await readFile(join(directory, entry.name, file), 'utf8'),
        );
      }

      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      store.set(
        `${DEFAULT_LOCALE}:${key(entry.name)}`,
        await readFile(join(directory, entry.name), 'utf8'),
      );
    }
  }
}

await loadMarkdown(join(here, 'reference'), reference, (name) =>
  name.replace(/\.md$/, ''),
);

/** A catalog string for `locale`, or `fallback` when that key is untranslated. */
function localise(locale, key, fallback) {
  const value = translator(catalogs, locale)(key);

  return value === key ? fallback : value;
}

/** UI chrome and every gate string, per locale. */
const catalogs = { [DEFAULT_LOCALE]: {} };

for (const name of await readdir(join(here, 'i18n'))) {
  if (!name.endsWith('.json')) continue;

  const code = name.replace(/\.json$/, '');

  if (isLocale(code)) {
    catalogs[code] = JSON.parse(await readFile(join(here, 'i18n', name), 'utf8'));
  }
}

/**
 * Files a reader copies into their own repository.
 *
 * These have to be served rather than sitting on disk beside the step that
 * mentions them: the reader is on `sandbox/<name>`, branched from `main`, where
 * nothing under `onboarding/` exists. Held in memory like everything else, so a
 * branch switch cannot take them away mid-step.
 */
const fixtures = new Map();

for (const name of await readdir(join(here, 'fixtures'))) {
  fixtures.set(name, await readFile(join(here, 'fixtures', name), 'utf8'));
}

// `03-branch.md` holds the content for the step with id `branch`.
await loadMarkdown(join(here, 'steps'), content, (name) =>
  name.replace(/^\d+-/, '').replace(/\.md$/, ''),
);

const missing = publicSteps()
  .map((step) => step.id)
  .filter((id) => !content.has(`${DEFAULT_LOCALE}:${id}`));

if (missing.length > 0) {
  console.error(`No step content for: ${missing.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

const emptyProgress = { steps: {}, quiz: {}, attest: {}, ask: {} };

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

  // Every declared check must be present *and* passing. Cards run subsets, so
  // "all the results I have are green" is not the same as "the step is done".
  const declared = step.checks ?? [];
  const results = checkResults ?? progress.steps[stepId]?.lastResults ?? [];
  const checksPass =
    declared.length === 0 ||
    declared.every((check) => results.find((r) => r.id === check.id)?.pass === true);

  const quizPass = (step.quiz ?? []).every(
    (question) => progress.quiz[`${stepId}.${question.id}`] === true,
  );

  const attestPass = (step.attest ?? []).every(
    (item) => progress.attest[`${stepId}.${item.id}`] === true,
  );

  // Satisfied by having written an answer. Never by what the model said about
  // it — that call can fail, and nobody should be stuck behind a third party.
  const askPass = (step.ask ?? []).every(
    (item) => progress.ask[`${stepId}.${item.id}`] === true,
  );

  return checksPass && quizPass && attestPass && askPass;
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

  return { steps: done, quiz: progress.quiz, attest: progress.attest, ask: progress.ask };
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

/**
 * Open Server-Sent Events connections. The repository watcher pushes a line
 * down each of these when anything a check reads changes, and the page re-runs
 * the current card's fast checks on its own.
 */
const listeners = new Set();

watchRepo((reason) => {
  for (const response of listeners) {
    try {
      response.write(`data: ${JSON.stringify({ changed: reason })}\n\n`);
    } catch {
      listeners.delete(response);
    }
  }
});

const routes = {
  async 'GET /api/state'(_body, locale) {
    const t = translator(catalogs, locale);
    // `publicSteps` asks for a fallback rather than params, because its
    // fallback is the English string already sitting in the step definition.
    const withFallback = (key, fallback) => {
      const value = t(key);

      return value === key ? fallback : value;
    };

    return {
      steps: publicSteps(withFallback),
      progress: progressSnapshot(),
      branch: await currentBranch(),
      repoRoot,
      llm: { available: llm.available(), minAnswer: llm.MIN_ANSWER },
      locale,
      locales: LOCALES,
      // The UI's own strings. Small enough to send whole, and it means the page
      // never renders a key while a second request is in flight.
      ui: Object.fromEntries(
        Object.entries(catalogs[DEFAULT_LOCALE] ?? {})
          .filter(([key]) => key.startsWith('ui.'))
          .map(([key]) => [key, t(key)]),
      ),
      translatedSteps: publicSteps()
        .map((step) => step.id)
        .filter((id) => content.has(`${locale}:${id}`)),
    };
  },

  async 'POST /api/check'(body) {
    const stepId = String(body.step ?? '');

    if (!stepsById.has(stepId)) return { error: 'Unknown step' };

    // A card asks only for its own checks, so a failure points at the
    // instruction above it rather than at the whole step.
    const only = Array.isArray(body.only) ? body.only.map(String) : null;
    const results = await runChecks(stepId, only);

    // Results are merged into whatever the step already knew, so running one
    // card's checks does not discard another card's passes.
    const previous = progress.steps[stepId]?.lastResults ?? [];
    const merged = [...previous.filter((r) => !results.some((n) => n.id === r.id)), ...results];
    const every = stepsById.get(stepId).checks ?? [];
    const checksPassed =
      every.length > 0 && every.every((c) => merged.find((r) => r.id === c.id)?.pass === true);

    progress.steps[stepId] = { checksPassed, lastResults: merged };
    await saveProgress();

    return { results, complete: isStepComplete(stepId, merged) };
  },

  async 'POST /api/quiz'(body, locale) {
    const stepId = String(body.step ?? '');
    const questionId = String(body.question ?? '');
    const graded = gradeQuiz(stepId, questionId, String(body.choice ?? ''));

    if (graded === null) return { error: 'Unknown question' };

    // Only a correct answer is recorded, so a wrong guess can be retried.
    if (graded.correct) {
      progress.quiz[`${stepId}.${questionId}`] = true;
      await saveProgress();
    }

    return {
      ...graded,
      // The explanation is the teaching part of a quiz, so it has to arrive in
      // the reader's language even though the grading does not depend on it.
      explain: localise(locale, `quiz.${stepId}.${questionId}.explain`, graded.explain),
      complete: isStepComplete(stepId),
    };
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

  async 'POST /api/ask'(body, locale) {
    const stepId = String(body.step ?? '');
    const questionId = String(body.question ?? '');
    const question = askQuestion(stepId, questionId);

    if (!question) return { error: 'Unknown question' };

    const answer = String(body.answer ?? '').slice(0, llm.MAX_ANSWER);

    if (answer.trim().length < llm.MIN_ANSWER) {
      return { recorded: false, reason: 'too-short', minAnswer: llm.MIN_ANSWER };
    }

    // Recorded first, and saved, before anything is asked of the network. If
    // the call below fails — no key, no wifi, rate limit, retired model — the
    // reader has still answered and still moves on.
    progress.ask[`${stepId}.${questionId}`] = true;
    await saveProgress();

    // The rubric and model answer go to the model, and the model answer is
    // shown to the reader, so both follow the reader's language. Feedback then
    // comes back in the language it was asked about.
    const key = `ask.${stepId}.${questionId}`;
    const lookFor = (question.lookFor ?? []).map((bullet, index) =>
      localise(locale, `${key}.lookFor.${index}`, bullet),
    );
    const modelAnswer = localise(locale, `${key}.modelAnswer`, question.modelAnswer);

    const feedback = await llm.grade({
      prompt: localise(locale, `${key}.prompt`, question.prompt),
      lookFor,
      modelAnswer,
      answer,
      locale,
    });

    // Decided locally, so a reader with no key still learns which idea they
    // missed rather than only seeing a model answer to compare against. Skipped
    // where the rubric describes an artifact's shape rather than things to say
    // — see `conceptsCovered`.
    const covered = question.structural
      ? null
      : llm.conceptsCovered(lookFor, answer);

    return {
      recorded: true,
      complete: isStepComplete(stepId),
      covered,
      // Always returned, whatever the model said or failed to say. Comparing
      // your answer to a good one is the part that does the teaching.
      modelAnswer,
      feedback: feedback.ok ? feedback : null,
      reason: feedback.ok ? null : feedback.reason,
    };
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

    if (request.method === 'GET' && path === '/api/events') {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
      });
      response.write('retry: 2000\n\n');
      listeners.add(response);
      request.on('close', () => listeners.delete(response));

      return;
    }

    if (request.method === 'GET' && path.startsWith('/fixtures/')) {
      const file = fixtures.get(decodeURIComponent(path.slice('/fixtures/'.length)));

      if (file === undefined) return json(response, 404, { error: 'Unknown file' });

      // text/plain so a curl straight to a file is the obvious thing, and a
      // browser shows it rather than offering to download it.
      response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      return response.end(file);
    }

    // Per request, so a reader can switch language without restarting anything.
    const locale = resolveLocale(
      url.searchParams.get('lang') ?? request.headers['accept-language'],
    );

    /** The asked-for locale if that page is translated, else English. */
    const pick = (store, key) =>
      store.get(`${locale}:${key}`) ?? store.get(`${DEFAULT_LOCALE}:${key}`);

    if (request.method === 'GET' && path.startsWith('/api/reference/')) {
      const name = path.slice('/api/reference/'.length);
      const markdown = pick(reference, name);

      if (markdown === undefined) return json(response, 404, { error: 'Unknown page' });

      return json(response, 200, {
        markdown,
        translated: reference.has(`${locale}:${name}`),
      });
    }

    if (request.method === 'GET' && path.startsWith('/api/content/')) {
      const stepId = path.slice('/api/content/'.length);
      const markdown = pick(content, stepId);

      if (markdown === undefined) return json(response, 404, { error: 'Unknown step' });

      return json(response, 200, {
        cards: splitCards(markdown),
        // So the page can say so when a step has not been translated yet,
        // rather than silently serving English under a Portuguese heading.
        translated: content.has(`${locale}:${stepId}`),
      });
    }

    const handler = routes[`${request.method} ${path}`];

    if (!handler) return json(response, 404, { error: 'Not found' });

    const body = request.method === 'POST' ? await readBody(request) : {};
    const result = await handler(body, locale);

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
  console.log('  Watching your files — checks re-run as you save.');
  console.log('');
  console.log('  Leave this running. You can switch branches freely — the');
  console.log('  tutorial has already loaded everything it needs.');
  console.log('');
});
