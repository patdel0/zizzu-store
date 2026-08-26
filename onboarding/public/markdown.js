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
      out.push(
        `<aside class="callout callout--${kind}">` +
          `<p class="callout__title">${renderInline(heading || CALLOUT_TITLES[kind])}</p>` +
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
