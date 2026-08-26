/**
 * Splits a step's markdown into cards.
 *
 * A step is a sequence of small cards rather than one long page: one idea, one
 * action, one confirmation. The reader cannot see the next card until the
 * current one is satisfied, which makes it impossible to write a card carrying
 * three concepts and hope nobody notices.
 *
 * Cards are separated by a line beginning with `===`, which may carry the gate
 * that has to pass before the reader moves on:
 *
 *     === check=heading,tagline
 *     === quiz=where-endpoint
 *     === attest=saw-split
 *     ===
 *
 * A card with no gate is a read — `Next` is always available. A card with one
 * shows only its own checks, so a failure points at the instruction directly
 * above it rather than at a step ten minutes long.
 */

const DELIMITER = /^===[ \t]*(.*)$/;

/** `check=a,b quiz=c` → `{ check: ['a','b'], quiz: ['c'], attest: [] }` */
function parseGate(attributes) {
  const gate = { check: [], quiz: [], attest: [] };

  for (const pair of attributes.trim().split(/\s+/).filter(Boolean)) {
    const [key, value] = pair.split('=');

    if (gate[key] === undefined || !value) continue;

    gate[key] = value.split(',').filter(Boolean);
  }

  return gate;
}

export function splitCards(markdown) {
  const cards = [];
  let current = { gate: parseGate(''), lines: [] };

  for (const line of String(markdown).replace(/\r\n/g, '\n').split('\n')) {
    const match = DELIMITER.exec(line);

    if (match) {
      cards.push(current);
      current = { gate: parseGate(match[1]), lines: [] };

      continue;
    }

    current.lines.push(line);
  }

  cards.push(current);

  return cards
    .map((card) => ({ gate: card.gate, markdown: card.lines.join('\n').trim() }))
    .filter((card) => card.markdown !== '');
}

/** Every check id a step's cards gate on, in card order. */
export function gatedCheckIds(markdown) {
  return splitCards(markdown).flatMap((card) => card.gate.check);
}
