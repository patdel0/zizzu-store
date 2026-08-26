import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Small helpers the checks are built from.
 *
 * Everything here is read-only: the tutorial inspects the trainee's working
 * tree, it never changes it. Commands are hard-coded in `checks.mjs` — the
 * browser only ever sends a step id — so nothing the page posts can turn into
 * a shell command.
 */

/** The repository root: one level up from `onboarding/`. */
export const repoRoot = join(import.meta.dirname, '..', '..');

/**
 * Runs a command and resolves with its result instead of throwing, so a check
 * can treat "command failed" as an answer rather than an accident.
 */
export function run(command, args, { timeout = 20_000, cwd = repoRoot } = {}) {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      { cwd, timeout, maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' },
      (error, stdout, stderr) => {
        resolve({
          ok: !error,
          code: error?.code ?? 0,
          stdout: stdout ?? '',
          stderr: stderr ?? '',
          timedOut: error?.killed === true,
        });
      },
    );
  });
}

/** `git` with the repo as the working directory. */
export function git(...args) {
  return run('git', args);
}

/** Trimmed stdout of a git command, or `''` if it failed. */
export async function gitOut(...args) {
  const result = await git(...args);

  return result.ok ? result.stdout.trim() : '';
}

export async function exists(relativePath) {
  try {
    await access(join(repoRoot, relativePath));

    return true;
  } catch {
    return false;
  }
}

/** File contents, or `null` when the file is not there. */
export async function read(relativePath) {
  try {
    return await readFile(join(repoRoot, relativePath), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Fetches a local URL, resolving to `null` when nothing is listening — used to
 * tell "the server is down" apart from "the server answered with an error".
 */
export async function fetchLocal(url, options = {}) {
  const { timeout = 5_000, ...rest } = options;

  try {
    const response = await fetch(url, {
      ...rest,
      signal: AbortSignal.timeout(timeout),
    });
    const body = await response.text();

    return { status: response.status, body };
  } catch {
    return null;
  }
}

/** Parses a response body as JSON, tolerating HTML error pages. */
export function asJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/** The branch the trainee is on right now. */
export function currentBranch() {
  return gitOut('rev-parse', '--abbrev-ref', 'HEAD');
}

/**
 * Commits made on the current branch since it left `main`, newest first.
 * Returns `[]` on `main` itself.
 */
export async function commitsOnBranch() {
  const output = await gitOut(
    'log',
    'main..HEAD',
    '--no-merges',
    '--format=%H%x1f%s%x1f%b%x1e',
  );

  if (output === '') return [];

  return output
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [sha, subject, body] = entry.split('\x1f');

      return { sha, subject, body: body ?? '' };
    });
}

/**
 * The commit that first added a path on this branch, or `null` if the path was
 * never added here. Used to prove a test was committed before the code that
 * makes it pass.
 */
export async function commitThatAdded(path) {
  const sha = await gitOut(
    'log',
    'main..HEAD',
    '--diff-filter=A',
    '--format=%H',
    '--',
    path,
  );

  return sha === '' ? null : sha.split('\n').pop().trim();
}

/** True when `a` comes strictly before `b` in the branch's history. */
export async function isAncestor(a, b) {
  if (!a || !b || a === b) return false;

  const result = await git('merge-base', '--is-ancestor', a, b);

  return result.ok;
}

/** Paths changed on this branch, whether committed, staged or still dirty. */
export async function changedPaths() {
  const committed = await gitOut('diff', '--name-only', 'main...HEAD');
  const working = await gitOut('diff', '--name-only', 'HEAD');
  const staged = await gitOut('diff', '--name-only', '--cached');
  const untracked = await gitOut('ls-files', '--others', '--exclude-standard');

  return new Set(
    [committed, working, staged, untracked]
      .join('\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
}
