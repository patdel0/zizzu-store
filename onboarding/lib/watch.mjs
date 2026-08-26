import { watch } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './shell.mjs';

/**
 * Watches the parts of the repository the checks care about, and calls back
 * when anything changes.
 *
 * This is what removes the button from most of the tutorial: the reader saves a
 * file in their editor and the card has already noticed. Pressing "check" and
 * waiting is a different, worse feeling.
 *
 * Deliberately not a recursive watch on the repository root — that would pull
 * in `node_modules` and `.next`, which are enormous and change constantly. Only
 * the directories a check ever reads are watched.
 */

/**
 * Directories worth watching, relative to the repo root. Missing ones are
 * skipped.
 *
 * Not everything a check reads is in here — `git config --global` writes to the
 * home directory, and some checks make HTTP requests. The page polls as well
 * while a card is unsatisfied, so those still resolve on their own.
 */
const DIRECTORIES = ['app', 'lib', 'test', '__tests__', 'e2e', 'docs'];

/** `.git` is watched too: `HEAD` changes on a branch switch, `refs` on a commit. */
const GIT_PATHS = ['.git'];

/** Editors write a file several times per save, so changes are batched. */
const DEBOUNCE_MS = 250;

const IGNORED = /node_modules|[\\/]\.next|\.tsbuildinfo|~$|\.swp$|^4913$/;

export function watchRepo(onChange) {
  const watchers = [];
  let timer = null;

  const fire = (reason) => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      timer = null;
      onChange(reason);
    }, DEBOUNCE_MS);
  };

  const add = (path, { recursive = true } = {}) => {
    try {
      const watcher = watch(join(repoRoot, path), { recursive }, (_event, filename) => {
        if (filename && IGNORED.test(String(filename))) return;

        fire(`${path}/${filename ?? ''}`);
      });

      watcher.on('error', () => {});
      watchers.push(watcher);
    } catch {
      // The directory does not exist yet — `app/products/` before it is
      // created, say. Not a problem: its parent is watched.
    }
  };

  for (const directory of DIRECTORIES) add(directory);
  for (const path of GIT_PATHS) add(path);

  // Files that live at the top level and matter to a check.
  add('.', { recursive: false });

  return () => {
    if (timer) clearTimeout(timer);

    for (const watcher of watchers) watcher.close();
  };
}
