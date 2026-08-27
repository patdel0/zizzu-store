/**
 * Compares every translated step against its English source.
 *
 * The parity check this grew out of only compared card counts and gates, and
 * two separate edits slipped past it: paragraphs added inside an existing card
 * change nothing it looked at, so the Portuguese silently went stale twice.
 *
 * So this compares what a translation must preserve — structure, code, links,
 * callouts, tables, emphasis — while ignoring what it is supposed to change.
 * Run it after touching any step:
 *
 *     node onboarding/script/check-translations.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { splitCards } = await import(join(root, 'lib/cards.mjs'));

/** Placeholders and visible prose a translation is expected to localise. */
function normalise(text) {
  return text
    .replace(/\/\/[^\n]*|#[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '§')
    .replace(/sandbox\/(your-name|seu-nome)/g, 'sandbox/NAME')
    .replace(/\b(your-branch|sua-branch)\b/g, 'BRANCH')
    .replace(/feature\/12-(thing|coisa)/g, 'feature/12-THING')
    .replace(/(type|tipo)\/(issue-number-short-description|numero-da-issue-descricao-curta)/g, 'BRANCH-TEMPLATE')
    .replace(/<(file|arquivo|branch|number|número)>/g, '<PLACEHOLDER>')
    .replace(/(path|caminho)\/(to|para)\/(one|um)\.test\.ts/g, 'PATH')
    // Text between JSX tags is what a user reads, so it is translated. This
    // allows interpolations inside it — `>Clicked {clicks} times<` — because
    // the identifiers around them are compared by the rest of the block.
    .replace(/>[^<>]*</g, '>TEXT<')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Locale variants of the same documentation page count as the same link. */
const sameLink = (url) =>
  url.replace('/pt-BR/', '/en-US/').replace('/pt/', '/en/').replace('/book/pt-br/', '/book/en/');

function shape(src) {
  const cards = splitCards(src);
  const flat = src.replace(/\s+/g, ' ');

  return {
    cards: cards.length,
    gates: cards.map((c) => JSON.stringify(c.gate)),
    headings: cards.map((c) => (c.markdown.match(/^#{2,3} /gm) ?? []).length),
    fences: cards.map((c) => (c.markdown.match(/^```/gm) ?? []).length),
    // Only fences that hold actual code. A ```mermaid diagram's labels, a
    // pseudocode block and an unlabelled block of example values are all prose,
    // and a translation is right to change them.
    code: [...src.matchAll(/^```(bash|typescript|tsx|json)\n([\s\S]*?)^```/gm)].map(([, , body]) =>
      normalise(body),
    ),
    callouts: (src.match(/^:::(note|warn|try|why|blank|order)/gm) ?? []).map((m) => m.slice(3)),
    refs: (src.match(/\{\{step:[a-z-]+\}\}/g) ?? []).sort(),
    links: (src.match(/\]\((https?:\/\/[^)\s]+)\)/g) ?? []).map((l) => sameLink(l.slice(2, -1))).sort(),
    tableRows: (src.match(/^\|/gm) ?? []).length,
    bullets: (src.match(/^[-*] /gm) ?? []).length,
    // Flattened first, so a bold that wraps across two lines still counts once.
    emphasis: (flat.match(/\*\*[^*]+\*\*/g) ?? []).length,
  };
}

let problems = 0;

function compare(label, en, pt, keys) {
  const say = (what, a, b) => {
    console.log(`  ${label}  ${what}: en=${a} vs ${b}`);
    problems += 1;
  };

  if (en.cards !== pt.cards) return say('cards', en.cards, pt.cards);

  en.gates.forEach((g, i) => g !== pt.gates[i] && say(`card ${i + 1} gate`, g, pt.gates[i]));
  en.headings.forEach((h, i) => h !== pt.headings[i] && say(`card ${i + 1} headings`, h, pt.headings[i]));
  en.fences.forEach((h, i) => h !== pt.fences[i] && say(`card ${i + 1} fences`, h, pt.fences[i]));
  en.code.forEach(
    (c, i) => c !== pt.code[i] && say(`code block ${i + 1}`, c.slice(0, 60), (pt.code[i] ?? '').slice(0, 60)),
  );

  for (const key of keys) {
    const a = Array.isArray(en[key]) ? en[key].join() : en[key];
    const b = Array.isArray(pt[key]) ? pt[key].join() : pt[key];

    if (a !== b) say(key, a, b);
  }
}

for (const dir of ['steps', 'reference']) {
  const base = join(root, dir);
  const locales = (await readdir(base, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const files = (await readdir(base)).filter((f) => f.endsWith('.md')).sort();

  for (const locale of locales) {
    for (const file of files) {
      let translated;

      try {
        translated = await readFile(join(base, locale, file), 'utf8');
      } catch {
        console.log(`  ${locale}/${file}: not translated`);
        problems += 1;
        continue;
      }

      compare(
        `${locale}/${file}`,
        shape(await readFile(join(base, file), 'utf8')),
        shape(translated),
        ['callouts', 'refs', 'links', 'tableRows', 'bullets', 'emphasis'],
      );
    }
  }
}

console.log(
  problems
    ? `\n  ${problems} divergence(s) — each is either drift to fix, or something the translation is right to change and this script should learn to ignore.`
    : '\n  every translated file matches its English source: cards, gates, code, links, callouts, tables and emphasis',
);

process.exit(problems ? 1 : 0);
