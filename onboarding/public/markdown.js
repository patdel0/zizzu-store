/**
 * A small markdown renderer — enough for the tutorial's content, and nothing
 * more. Pulling in a library would mean an install step before a trainee can
 * read the first page.
 *
 * Supports: headings, paragraphs, fenced and inline code, bold, italic, links,
 * bullet and numbered lists, blockquotes, tables, horizontal rules, and
 * `:::note` / `:::warn` / `:::try` callout blocks.
 *
 * Everything is escaped before any markup is added, so step content and command
 * output can be rendered through the same path safely.
 */

const CALLOUT_TITLES = {
  note: 'Worth knowing',
  warn: 'Watch out',
  try: 'Try this',
  why: 'Why it is done this way',
};

export function renderMarkdown(source) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // Fenced code
    if (/^\s*```/.test(line)) {
      const language = line.replace(/^\s*```/, '').trim();
      const code = [];

      index += 1;

      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }

      index += 1;

      // A ```mermaid fence becomes a diagram. `app.js` hands these to Mermaid
      // once they are in the document; until then the source sits in the `pre`,
      // which is also what stays on screen if rendering ever fails.
      out.push(
        language === 'mermaid'
          ? `<pre class="mermaid">${escapeHtml(code.join('\n'))}</pre>`
          : `<pre class="code" data-lang="${escapeHtml(language)}"><code>${escapeHtml(
              code.join('\n'),
            )}</code></pre>`,
      );

      continue;
    }

    // Interactive blocks: fill-in-the-blank and line-ordering exercises.
    const exercise = line.match(/^:::(blank|order)\s*(.*)$/);

    if (exercise) {
      const [, kind, heading] = exercise;
      const inner = [];

      index += 1;

      while (index < lines.length && !/^:::\s*$/.test(lines[index])) {
        inner.push(lines[index]);
        index += 1;
      }

      index += 1;
      out.push(
        kind === 'blank'
          ? renderBlank(inner, heading)
          : renderOrder(inner, heading),
      );

      continue;
    }

    // Callouts
    const callout = line.match(/^:::(note|warn|try|why)\s*(.*)$/);

    if (callout) {
      const [, kind, heading] = callout;
      const inner = [];

      index += 1;

      while (index < lines.length && !/^:::\s*$/.test(lines[index])) {
        inner.push(lines[index]);
        index += 1;
      }

      index += 1;

      // Explanation is not part of the lesson. It stays available, folded away,
      // so the path through the step is only the doing.
      out.push(
        kind === 'why'
          ? `<details class="why"><summary>${renderInline(
              heading || CALLOUT_TITLES[kind],
            )}</summary><div class="why__body">${renderMarkdown(
              inner.join('\n'),
            )}</div></details>`
          : `<aside class="callout callout--${kind}">` +
              `<p class="callout__title">${renderInline(
                heading || CALLOUT_TITLES[kind],
              )}</p>` +
              renderMarkdown(inner.join('\n')) +
              '</aside>',
      );

      continue;
    }

    // Tables
    if (line.includes('|') && /^\s*\|?[\s:-]*\|[\s:|-]*$/.test(lines[index + 1] ?? '')) {
      const rows = [];

      while (index < lines.length && lines[index].includes('|')) {
        rows.push(lines[index]);
        index += 1;
      }

      out.push(renderTable(rows));

      continue;
    }

    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      out.push('<hr>');
      index += 1;

      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);

    if (heading) {
      const level = heading[1].length + 1;

      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;

      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoted = [];

      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }

      out.push(`<blockquote>${renderMarkdown(quoted.join('\n'))}</blockquote>`);

      continue;
    }

    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+/);

    if (listMatch) {
      const ordered = /\d/.test(listMatch[2]);
      const items = [];

      while (index < lines.length) {
        const item = lines[index].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);

        if (!item) break;

        const body = [item[3]];

        index += 1;

        // Continuation lines: indented, and not the start of the next item.
        while (
          index < lines.length &&
          /^\s+\S/.test(lines[index]) &&
          !/^(\s*)([-*]|\d+\.)\s+/.test(lines[index])
        ) {
          body.push(lines[index].trim());
          index += 1;
        }

        items.push(`<li>${renderInline(body.join(' '))}</li>`);
      }

      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);

      continue;
    }

    if (line.trim() === '') {
      index += 1;

      continue;
    }

    const paragraph = [];

    while (index < lines.length && lines[index].trim() !== '') {
      if (/^\s*(```|:::|#{1,4}\s|>|\s*([-*]|\d+\.)\s)/.test(lines[index])) break;

      paragraph.push(lines[index].trim());
      index += 1;
    }

    if (paragraph.length > 0) {
      out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    }
  }

  return out.join('\n');
}

/**
 * A fill-in-the-blank exercise. `{{answer}}` in the source becomes an input.
 *
 * Grading is client-side and deliberately does not gate anything. These are
 * practice with instant feedback, not a test — the gates are the checks that
 * read the real repository, which cannot be guessed at.
 */
function renderBlank(lines, heading) {
  let n = 0;
  const body = escapeHtml(lines.join('\n')).replace(
    /\{\{([^}]+)\}\}/g,
    (_, spec) => {
      n += 1;

      // `{{shape:answer|other}}` — the shape is what the lesson is usually
      // about, and the listed answers are the wordings we would pick. An
      // answer of the right shape but a different word is not a failure; it
      // gets told what this project would have called it.
      const [shape, answers] = /^[a-z]+:/.test(spec)
        ? [spec.slice(0, spec.indexOf(':')), spec.slice(spec.indexOf(':') + 1)]
        : ['', spec];
      const accepted = answers.split('|');
      const width = Math.max(...accepted.map((a) => a.length)) + 1;

      return (
        `<input class="blank" type="text" spellcheck="false" autocomplete="off"` +
        ` aria-label="Blank ${n}" data-answers="${escapeHtml(accepted.join('|'))}"` +
        ` data-shape="${escapeHtml(shape)}"` +
        ` style="width:${Math.max(width, 4)}ch">`
      );
    },
  );

  return (
    '<div class="exercise exercise--blank">' +
    `<p class="exercise__title">${renderInline(heading || 'Fill in the blanks')}</p>` +
    `<pre class="code"><code>${body}</code></pre>` +
    '<p class="exercise__status" aria-live="polite"></p>' +
    '</div>'
  );
}

/**
 * A Parsons problem: the right lines, in the wrong order.
 *
 * Reordering given lines costs far less than writing them, and teaches the
 * shape of the solution without syntax getting in the way — which is why it
 * sits between "read the worked example" and "write it yourself".
 */
function renderOrder(lines, heading) {
  const steps = lines.filter((line) => line.trim() !== '');

  // Shuffled deterministically, so the puzzle does not rearrange itself under
  // the reader when the card re-renders. Keyed on the text as well as the
  // index, so the order is not the same shape every time — a pure arithmetic
  // key on the index alone comes out as a plain reversal, or worse, for some
  // lengths leaves the list already solved.
  const hash = (text) => {
    let h = 2166136261;

    for (let i = 0; i < text.length; i += 1) {
      h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    }

    return h >>> 0;
  };

  const shuffled = steps
    .map((line, i) => ({ line, i, key: hash(`${i}:${line}`) }))
    .sort((a, b) => a.key - b.key || a.i - b.i);

  // A shuffle that happens to be the answer is not a puzzle.
  if (shuffled.every((entry, i) => entry.i === i) && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  const items = shuffled
    .map(
      ({ line, i }) =>
        `<li class="order__item" data-position="${i}" draggable="true">` +
        `<button type="button" class="order__move" data-dir="-1" aria-label="Move up">↑</button>` +
        `<button type="button" class="order__move" data-dir="1" aria-label="Move down">↓</button>` +
        `<code>${escapeHtml(line)}</code></li>`,
    )
    .join('');

  return (
    '<div class="exercise exercise--order">' +
    `<p class="exercise__title">${renderInline(heading || 'Put these in the right order')}</p>` +
    `<ol class="order">${items}</ol>` +
    '<p class="exercise__status" aria-live="polite"></p>' +
    '</div>'
  );
}

function renderTable(rows) {
  const cells = (row) =>
    row
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => cell.trim());

  const [head, , ...body] = rows;
  const header = cells(head)
    .map((cell) => `<th>${renderInline(cell)}</th>`)
    .join('');
  const rest = body
    .map(
      (row) =>
        `<tr>${cells(row)
          .map((cell) => `<td>${renderInline(cell)}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  return `<div class="table-scroll"><table><thead><tr>${header}</tr></thead><tbody>${rest}</tbody></table></div>`;
}

/**
 * Inline formatting. Code spans are pulled out first and put back at the end,
 * so `**` inside a code span is never mistaken for bold.
 */
function renderInline(text) {
  const spans = [];
  // NUL-delimited, because an ordinary marker like #0# could occur in prose.
  let working = String(text).replace(/`([^`]+)`/g, (_, code) => {
    spans.push(code);

    return `\u0000${spans.length - 1}\u0000`;
  });

  working = escapeHtml(working);

  working = working
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) =>
      /^(https?:|#|\/)/.test(href)
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  return working.replace(
    /\u0000(\d+)\u0000/g,
    (_, id) => `<code>${escapeHtml(spans[Number(id)])}</code>`,
  );
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
