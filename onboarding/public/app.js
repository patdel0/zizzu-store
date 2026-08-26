import { escapeHtml, renderMarkdown } from '/markdown.js';

/**
 * The tutorial's front end.
 *
 * State lives on the server — the trainee can close the tab, reboot, and come
 * back to the same place. This file only draws it.
 */

const contentEl = document.getElementById('content');
const stepsEl = document.getElementById('steps');
const branchEl = document.getElementById('branch');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');

let state = null;
let currentId = null;
let currentCard = null;
const markdownCache = new Map();

// ------------------------------------------------------------------ diagrams

const darkMode = window.matchMedia('(prefers-color-scheme: dark)');

function initMermaid() {
  if (typeof mermaid === 'undefined') return;

  const dark = darkMode.matches;

  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'default',
    securityLevel: 'strict',
    fontFamily: 'ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif',
    // gitGraph ignores theme variables for its label colours, so those are
    // corrected in styles.css instead — see the `pre.mermaid svg` rules there.
    themeVariables: { fontSize: '14px' },
    flowchart: { curve: 'basis', useMaxWidth: true },
    sequence: { useMaxWidth: true, actorMargin: 40, mirrorActors: false },
  });
}

/**
 * Turns the `pre.mermaid` blocks in a container into diagrams.
 *
 * If Mermaid is missing or a diagram has a syntax error, the source stays
 * visible in the `pre` — a readable fallback rather than a blank space.
 */
async function drawDiagrams(container) {
  const nodes = [...container.querySelectorAll('pre.mermaid')];

  if (nodes.length === 0 || typeof mermaid === 'undefined') return;

  try {
    await mermaid.run({ nodes });
  } catch (error) {
    console.error('Could not render a diagram:', error);
  }
}

initMermaid();

// A trainee switching their system theme mid-step should not be left with a
// diagram in the old palette.
darkMode.addEventListener('change', () => {
  initMermaid();

  if (currentId) show(currentId);
});

async function api(path, body, { timeout = 15_000 } = {}) {
  // A hung request used to hang the card with no error path. Anything that can
  // wait on a network has to be able to give up.
  try {
    const response = await fetch(path, {
      method: body ? 'POST' : 'GET',
      signal: AbortSignal.timeout(timeout),
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    return await response.json();
  } catch {
    return { error: 'unreachable' };
  }
}

async function loadState() {
  state = await api('/api/state');
  branchEl.textContent = `on ${state.branch}`;
  branchEl.title = state.repoRoot;
  drawSidebar();
}

function stepById(id) {
  return state.steps.find((step) => step.id === id);
}

/** Minutes as something you can decide about: "an hour and a half", not "95m". */
function describe(minutes) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) return `${hours} hr`;
  if (rest === 30) return `${hours}\u00bd hr`;

  return `${hours} hr ${rest}`;
}

function isDone(id) {
  return state.progress.steps[id]?.complete === true;
}

// ------------------------------------------------------------------ sidebar

function drawSidebar() {
  const done = state.steps.filter((step) => isDone(step.id)).length;
  const percent = Math.round((done / state.steps.length) * 100);

  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = `${done} of ${state.steps.length} steps done`;

  stepsEl.innerHTML = '';
  let phase = null;

  for (const step of state.steps) {
    if (step.phase !== phase) {
      phase = step.phase;

      // Each part carries its own budget and its own progress. Course length
      // predicts abandonment, and one bar reading "3 of 27" is a wall; seven
      // parts with a finishable one in front of you is a sequence of arrivals.
      const inPhase = state.steps.filter((other) => other.phase === phase);
      const doneHere = inPhase.filter((other) => isDone(other.id)).length;
      const minutes = inPhase.reduce((total, other) => total + other.minutes, 0);

      const heading = document.createElement('li');

      heading.className = 'phase';
      heading.innerHTML =
        `<span class="phase__name">${escapeHtml(phase)}</span>` +
        `<span class="phase__meta">${
          doneHere === inPhase.length ? 'done' : `${describe(minutes)}`
        }</span>`;
      stepsEl.append(heading);
    }

    const item = document.createElement('li');
    const button = document.createElement('button');
    const complete = isDone(step.id);

    button.type = 'button';
    button.className = `step${complete ? ' step--done' : ''}`;
    button.setAttribute('aria-current', String(step.id === currentId));
    button.innerHTML =
      `<span class="step__mark" aria-hidden="true">${complete ? '✓' : step.number}</span>` +
      `<span class="step__text">${escapeHtml(step.title)}</span>`;
    button.addEventListener('click', () => show(step.id));

    item.append(button);
    stepsEl.append(item);
  }
}

// --------------------------------------------------------------------- step

async function cardsFor(id) {
  if (!markdownCache.has(id)) {
    const { cards } = await api(`/api/content/${id}`);

    markdownCache.set(id, cards);
  }

  return markdownCache.get(id);
}

/** The card the reader is on, per step, so going back to a step resumes it. */
const cardPosition = new Map();

async function show(id, cardIndex) {
  currentId = id;

  const step = stepById(id);
  const cards = await cardsFor(id);
  const index = Math.min(
    Math.max(cardIndex ?? cardPosition.get(id) ?? 0, 0),
    cards.length - 1,
  );

  cardPosition.set(id, index);
  location.hash = index === 0 ? id : `${id}/${index + 1}`;
  currentCard = cards[index];

  const card = cards[index];

  contentEl.innerHTML = '';

  const header = document.createElement('div');

  header.innerHTML =
    `<p class="eyebrow">${escapeHtml(step.phase)} · Step ${step.number} of ${state.steps.length}</p>` +
    `<h1>${escapeHtml(step.title)}</h1>` +
    `<div class="pips" role="img" aria-label="Card ${index + 1} of ${cards.length}">` +
    cards
      .map((_, i) => `<span class="pip${i === index ? ' pip--now' : i < index ? ' pip--done' : ''}"></span>`)
      .join('') +
    `<span class="pips__label">${index + 1} / ${cards.length}</span>` +
    '</div>';
  contentEl.append(header);

  const body = document.createElement('div');

  body.innerHTML = renderMarkdown(resolveStepRefs(card.markdown));
  contentEl.append(body);
  drawDiagrams(body);
  wireExercises(body);

  // Only this card's gates are shown, so a failure points at the instruction
  // immediately above it.
  for (const questionId of card.gate.quiz) {
    const question = step.quiz.find((q) => q.id === questionId);

    if (question) contentEl.append(drawQuestion(step, question));
  }

  for (const questionId of card.gate.ask) {
    const question = step.ask?.find((entry) => entry.id === questionId);

    if (question) contentEl.append(drawAsk(step, question));
  }

  if (card.gate.check.length > 0 || card.gate.attest.length > 0) {
    contentEl.append(drawPanel(step, card));
  }

  contentEl.append(drawCardNav(step, cards, index));
  drawSidebar();
  contentEl.scrollTop = 0;
  contentEl.focus();

  // A card whose checks are unmet is worth verifying on arrival: the reader may
  // have already done it, and being told so immediately beats a stale prompt.
  if (card.gate.check.length > 0) verifyCard({ silent: true });
}

// ------------------------------------------------------ written answers

const ASK_REASONS = {
  'no-key': 'Compare your answer with this one.',
  offline: 'No connection, so no comment on yours — compare it with this instead.',
  busy: 'The feedback service is busy. Compare your answer with this one.',
  timeout: 'The feedback service did not answer in time. Compare yours with this.',
  'bad-response': 'The feedback did not come back usable. Compare yours with this.',
};

const VERDICT_LABEL = {
  'on-track': 'On track',
  partly: 'Partly there',
  'off-track': 'Not quite',
};

/**
 * A question the reader answers in their own words.
 *
 * Writing the answer is the point — articulating something is what makes it
 * stick, and that works whether or not anything comments on it afterwards. So
 * the answer is recorded the moment it is submitted, and the model answer is
 * always revealed to compare against. Any feedback is a bonus on top.
 */
function drawAsk(step, question) {
  const key = `${step.id}.${question.id}`;
  const answered = state.progress.ask?.[key] === true;
  const box = document.createElement('section');

  box.className = 'ask';
  box.innerHTML =
    `<p class="ask__prompt">${renderInlineSafe(question.prompt)}</p>` +
    '<p class="ask__hint">A few sentences, in your own words. There is no wrong wording.</p>';

  const field = document.createElement('textarea');

  field.className = 'ask__input';
  field.rows = 4;
  field.spellcheck = true;
  field.placeholder = 'Write your answer…';

  const submit = document.createElement('button');

  submit.type = 'button';
  submit.className = 'button';
  submit.textContent = 'Submit answer';

  const status = document.createElement('p');

  status.className = 'ask__status';

  const result = document.createElement('div');

  result.className = 'ask__result';
  result.hidden = true;

  submit.addEventListener('click', async () => {
    const answer = field.value.trim();

    if (answer.length < (state.llm?.minAnswer ?? 40)) {
      status.textContent = `A bit more than that — ${state.llm?.minAnswer ?? 40} characters at least.`;

      return;
    }

    submit.disabled = true;
    status.textContent = 'Reading it…';

    const reply = await api('/api/ask', { step: step.id, question: question.id, answer });

    submit.disabled = false;

    if (!reply?.recorded) {
      status.textContent = 'Could not record that. Try again.';

      return;
    }

    // Recorded regardless of what came back, so Next unlocks either way.
    state.progress.ask = { ...(state.progress.ask ?? {}), [key]: true };
    status.textContent = '';
    field.disabled = true;
    submit.hidden = true;
    result.hidden = false;
    result.innerHTML = renderAskResult(reply);
    drawSidebar();
    refreshCardNav();
  });

  box.append(field, submit, status, result);

  if (answered) {
    field.disabled = true;
    submit.hidden = true;
    status.textContent = 'Answered.';
  }

  return box;
}

function renderAskResult(reply) {
  const parts = [];

  if (reply.feedback) {
    const { verdict, quote, missing, note } = reply.feedback;

    parts.push(
      `<p class="ask__verdict ask__verdict--${verdict}">${VERDICT_LABEL[verdict] ?? verdict}</p>`,
      `<p class="ask__note">${escapeHtml(note)}</p>`,
    );

    if (quote) parts.push(`<p class="ask__quote">You wrote: “${escapeHtml(quote)}”</p>`);
    if (missing) parts.push(`<p class="ask__missing">Worth adding: ${escapeHtml(missing)}</p>`);
  } else {
    parts.push(`<p class="ask__note">${escapeHtml(ASK_REASONS[reply.reason] ?? ASK_REASONS.offline)}</p>`);
  }

  // Which of the author's points the answer touched — computed on the server,
  // offline, so this appears whether or not any feedback came back.
  if (reply.covered?.length) {
    const missed = reply.covered.filter((item) => !item.covered);

    parts.push(
      '<ul class="ask__covered">' +
        reply.covered
          .map(
            (item) =>
              `<li data-covered="${item.covered}">${escapeHtml(item.bullet)}</li>`,
          )
          .join('') +
        '</ul>',
      missed.length === 0
        ? '<p class="ask__note">You touched every point.</p>'
        : `<p class="ask__note">${missed.length} point${missed.length === 1 ? '' : 's'} you did not mention — worth a second look.</p>`,
    );
  }

  parts.push(
    '<p class="ask__model-label">One good answer</p>',
    `<p class="ask__model">${escapeHtml(reply.modelAnswer)}</p>`,
  );

  return parts.join('');
}

// ------------------------------------------------------------- exercises

/**
 * Wires up the practice widgets inside a card.
 *
 * Neither of these gates anything. They are for the reader to find out whether
 * they followed, at the moment they read it, instead of discovering it later
 * when a check goes red.
 */
/** The casing conventions a blank can ask for, when the shape is the lesson. */
const SHAPES = {
  kebab: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  camel: /^[a-z][a-zA-Z0-9]*$/,
  pascal: /^[A-Z][a-zA-Z0-9]*$/,
  screaming: /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/,
  // Booleans are camelCase *and* start with a question word — `saving` is the
  // right casing and still the wrong name.
  bool: /^(is|has|should|can)[A-Z][a-zA-Z0-9]*$/,
};

const SHAPE_NAMES = {
  kebab: 'kebab-case (lowercase, hyphens between words)',
  camel: 'camelCase (starts lowercase, no separators)',
  pascal: 'PascalCase (starts with a capital, no separators)',
  screaming: 'SCREAMING_SNAKE_CASE (capitals, underscores)',
  bool: 'a boolean name — start it with `is` or `has`',
};

function wireExercises(container) {
  for (const box of container.querySelectorAll('.exercise--blank')) {
    const inputs = [...box.querySelectorAll('.blank')];
    const status = box.querySelector('.exercise__status');

    const grade = () => {
      let filled = 0;
      let right = 0;
      const notes = [];

      for (const input of inputs) {
        const value = input.value.trim();

        if (value === '') {
          input.dataset.state = '';

          continue;
        }

        filled += 1;

        const accepted = input.dataset.answers.split('|');
        const shape = input.dataset.shape;

        if (accepted.includes(value)) {
          input.dataset.state = 'right';
          right += 1;

          continue;
        }

        // The convention is usually the thing being taught, and there is more
        // than one reasonable word for most things. Something of the right
        // shape counts; it just gets told what we would have called it.
        if (shape && SHAPES[shape]?.test(value)) {
          input.dataset.state = 'close';
          right += 1;
          notes.push(`\u201c${value}\u201d works — here we would say \u201c${accepted[0]}\u201d.`);

          continue;
        }

        input.dataset.state = 'wrong';

        if (shape && SHAPE_NAMES[shape]) {
          notes.push(`\u201c${value}\u201d is not ${SHAPE_NAMES[shape]}.`);
        }
      }

      const all = right === inputs.length;

      status.innerHTML = all
        ? `That is it.${notes.length ? ` ${escapeHtml(notes.join(' '))}` : ''}`
        : filled === 0
          ? ''
          : `${right} of ${inputs.length}.${notes.length ? ` ${escapeHtml(notes[0])}` : ''}`;
      status.dataset.state = all ? 'right' : '';
    };

    for (const input of inputs) input.addEventListener('input', grade);
  }

  for (const box of container.querySelectorAll('.exercise--order')) {
    const list = box.querySelector('.order');
    const status = box.querySelector('.exercise__status');

    const grade = () => {
      const items = [...list.children];
      const ordered = items.every(
        (item, i) => Number(item.dataset.position) === i,
      );

      items.forEach((item, i) => {
        item.dataset.state =
          Number(item.dataset.position) === i ? 'right' : 'wrong';
      });
      status.textContent = ordered ? 'That is the order.' : '';
      status.dataset.state = ordered ? 'right' : '';
    };

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.order__move');

      if (!button) return;

      const item = button.closest('.order__item');
      const direction = Number(button.dataset.dir);
      const sibling =
        direction < 0 ? item.previousElementSibling : item.nextElementSibling;

      if (!sibling) return;

      if (direction < 0) list.insertBefore(item, sibling);
      else list.insertBefore(sibling, item);

      grade();
    });
  }
}

/**
 * Turns `{{step:database}}` into "step 12", using the live step list.
 *
 * Prose used to carry the numbers literally, and they went stale twice — once
 * when steps were split, once when one was deleted. A reference that resolves
 * at render time cannot drift, and an id that no longer exists shows up as
 * `[unknown step: x]` rather than quietly pointing somewhere wrong.
 */
function resolveStepRefs(markdown) {
  return markdown.replace(/\{\{step:([a-z-]+)\}\}/g, (_, id) => {
    const step = stepById(id);

    return step ? `step ${step.number}` : `[unknown step: ${id}]`;
  });
}

/** True when everything this card gates on has passed. */
function cardSatisfied(step, card) {
  const results = state.progress.steps[step.id]?.lastResults ?? [];

  return (
    card.gate.check.every((id) => results.find((r) => r.id === id)?.pass === true) &&
    card.gate.quiz.every((id) => state.progress.quiz[`${step.id}.${id}`] === true) &&
    card.gate.attest.every((id) => state.progress.attest[`${step.id}.${id}`] === true) &&
    card.gate.ask.every((id) => state.progress.ask?.[`${step.id}.${id}`] === true)
  );
}

// --------------------------------------------------------------------- quiz

function drawQuestion(step, question) {
  const alreadyRight = state.progress.quiz[`${step.id}.${question.id}`] === true;
  const wrapper = document.createElement('section');

  wrapper.className = 'quiz';
  wrapper.innerHTML = `<p class="quiz__prompt">${renderInlineSafe(question.prompt)}</p>`;

  const options = document.createElement('div');

  options.className = 'quiz__options';

  const feedback = document.createElement('p');

  feedback.className = 'quiz__feedback';
  feedback.hidden = true;

  for (const option of question.options) {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'quiz__option';
    button.innerHTML =
      `<span class="quiz__key">${escapeHtml(option.id)}</span>` +
      `<span>${renderInlineSafe(option.label)}</span>`;

    button.addEventListener('click', async () => {
      const result = await api('/api/quiz', {
        step: step.id,
        question: question.id,
        choice: option.id,
      });

      button.dataset.state = result.correct ? 'correct' : 'wrong';
      feedback.hidden = false;
      feedback.innerHTML = result.correct
        ? `<strong>Yes.</strong> ${renderInlineSafe(result.explain)}`
        : '<strong>Not quite.</strong> Have another read of the step above, then try again.';

      if (result.correct) {
        for (const other of options.children) other.disabled = true;

        state.progress.quiz[`${step.id}.${question.id}`] = true;
        state.progress.steps[step.id] = {
          ...state.progress.steps[step.id],
          complete: result.complete,
        };
        drawSidebar();
        refreshCardNav();
      }
    });

    options.append(button);
  }

  if (alreadyRight) {
    // Answered in an earlier session: show it as settled rather than asking again.
    for (const button of options.children) button.disabled = true;

    feedback.hidden = false;
    feedback.innerHTML = '<strong>Answered.</strong> You got this one already.';
  }

  wrapper.append(options, feedback);

  return wrapper;
}

/** Renders a short string of markdown without wrapping it in a paragraph. */
function renderInlineSafe(text) {
  return renderMarkdown(text).replace(/^<p>|<\/p>$/g, '');
}

// ------------------------------------------------------------------- checks

function drawPanel(step, card) {
  const panel = document.createElement('section');

  panel.className = 'panel';
  panel.id = 'panel';

  const checks = step.checks.filter((c) => card.gate.check.includes(c.id));
  const attests = step.attest.filter((a) => card.gate.attest.includes(a.id));
  const slow = checks.some((c) => c.slow);

  panel.innerHTML =
    `<p class="panel__hint">${
      checks.length > 0
        ? slow
          ? 'Checked against your repository. This one runs your tests, so it takes a minute.'
          : 'Checked against your repository, automatically, as you save.'
        : 'Tick these off once you have really done them.'
    }</p>`;

  if (attests.length > 0) {
    const list = document.createElement('ul');

    list.className = 'attest';

    for (const item of attests) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');

      input.type = 'checkbox';
      input.checked = state.progress.attest[`${step.id}.${item.id}`] === true;
      input.addEventListener('change', async () => {
        await api('/api/attest', { step: step.id, item: item.id, value: input.checked });
        state.progress.attest[`${step.id}.${item.id}`] = input.checked;
        drawSidebar();
        refreshCardNav();
      });

      const text = document.createElement('span');

      text.innerHTML =
        renderInlineSafe(item.label) +
        (item.hint ? `<span class="attest__hint">${renderInlineSafe(item.hint)}</span>` : '');

      label.append(input, text);
      li.append(label);
      list.append(li);
    }

    panel.append(list);
  }

  if (checks.length > 0) {
    const list = document.createElement('ul');

    list.className = 'check-list';
    list.id = 'check-list';
    drawCheckResults(list, checks, state.progress.steps[step.id]?.lastResults ?? null);
    panel.append(list);

    // Fast checks re-run on their own when a file changes, so only the slow
    // ones — the ones that shell out to `npm test` — need asking for.
    if (slow) {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'button';
      button.id = 'run-checks';
      button.textContent = 'Run the tests';
      button.addEventListener('click', () => verifyCard());
      panel.append(button);
    }
  }

  return panel;
}

/** Runs the current card's checks and repaints the panel. */
async function verifyCard({ silent = false } = {}) {
  const step = stepById(currentId);
  const card = currentCard;

  if (!step || !card || card.gate.check.length === 0) return;

  const checks = step.checks.filter((c) => card.gate.check.includes(c.id));
  const list = document.getElementById('check-list');
  const button = document.getElementById('run-checks');

  if (!silent) {
    drawCheckResults(list, checks, null, { running: true });

    if (button) {
      button.disabled = true;
      button.textContent = 'Running…';
    }
  }

  const result = await api('/api/check', { step: step.id, only: card.gate.check });

  // Merge into what we already knew, so other cards' results survive.
  const previous = state.progress.steps[step.id]?.lastResults ?? [];

  state.progress.steps[step.id] = {
    ...state.progress.steps[step.id],
    lastResults: [
      ...previous.filter((r) => !result.results.some((n) => n.id === r.id)),
      ...result.results,
    ],
    complete: result.complete,
  };

  if (currentCard === card) {
    drawCheckResults(list, checks, result.results);
    refreshCardNav();
  }

  if (button) {
    button.disabled = false;
    button.textContent = 'Run the tests';
  }

  drawSidebar();
}

function drawCheckResults(list, checks, results, { running = false } = {}) {
  if (!list) return;

  list.innerHTML = '';

  for (const check of checks) {
    const result = results?.find((entry) => entry.id === check.id);
    const status = running
      ? 'running'
      : result
        ? result.pass
          ? 'pass'
          : 'fail'
        : 'pending';
    const icon = { pass: '✓', fail: '✕', running: '⋯', pending: '·' }[status];

    const item = document.createElement('li');

    item.className = `check check--${status}`;
    item.innerHTML =
      '<div class="check__head">' +
      `<span class="check__icon" aria-hidden="true">${icon}</span>` +
      `<span>${renderInlineSafe(check.label)}</span>` +
      '</div>';

    // A passing check does not need to explain itself at length.
    if (result?.detail && !result.pass) {
      const detail = document.createElement('div');

      detail.className = 'check__detail';
      detail.innerHTML = renderMarkdown(result.detail);
      item.append(detail);
    }

    list.append(item);
  }
}

// --------------------------------------------------------------------- cards

function drawCardNav(step, cards, index) {
  const nav = document.createElement('div');

  nav.className = 'card-nav';
  nav.id = 'card-nav';

  const back = document.createElement('button');

  back.type = 'button';
  back.className = 'button button--ghost';
  back.textContent = '← Back';
  back.disabled = index === 0 && step.number === 1;
  back.addEventListener('click', () => {
    if (index > 0) return show(step.id, index - 1);

    const previous = state.steps[step.number - 2];

    if (previous) show(previous.id, Number.MAX_SAFE_INTEGER);
  });

  const next = document.createElement('button');
  const last = index === cards.length - 1;
  const nextStep = state.steps[step.number];

  next.type = 'button';
  next.className = 'button';
  next.id = 'card-next';
  next.textContent = last ? (nextStep ? `Next: ${nextStep.title} →` : 'Finish') : 'Next →';
  next.addEventListener('click', () => {
    if (!last) return show(step.id, index + 1);
    if (nextStep) return show(nextStep.id, 0);
  });

  const note = document.createElement('span');

  note.className = 'card-nav__note';
  note.id = 'card-nav-note';

  nav.append(back, note, next);
  queueMicrotask(refreshCardNav);

  return nav;
}

/** Enables or disables `Next` according to whether the card's gate is met. */
function refreshCardNav() {
  const next = document.getElementById('card-next');
  const note = document.getElementById('card-nav-note');
  const step = stepById(currentId);

  if (!next || !step || !currentCard) return;

  const satisfied = cardSatisfied(step, currentCard);
  // Every gate kind, or a card gated only by a written answer looks ungated:
  // Next stays enabled, the reader walks past, and the step can never complete
  // because `isStepComplete` on the server does count `ask`.
  const gated =
    currentCard.gate.check.length +
    currentCard.gate.quiz.length +
    currentCard.gate.attest.length +
    currentCard.gate.ask.length >
    0;

  next.disabled = gated && !satisfied;

  if (!gated || satisfied) {
    note.textContent = '';
  } else if (currentCard.gate.quiz.length > 0) {
    note.textContent = 'Answer to continue';
  } else if (currentCard.gate.check.length > 0) {
    note.textContent = 'Waiting for this to pass';
  } else {
    note.textContent = 'Tick to continue';
  }
}

// ------------------------------------------------------- live file watching

/**
 * The server pushes a line whenever anything a check reads changes, and the
 * current card re-verifies itself. Saving in the editor is enough; there is
 * nothing to press.
 */
function listenForChanges() {
  const events = new EventSource('/api/events');

  events.addEventListener('message', () => {
    if (pendingFastChecks()) verifyCard({ silent: true });
  });

  events.addEventListener('error', () => {
    // EventSource reconnects on its own; nothing to do.
  });

  // Watching files is not enough on its own. Some checks read things no file
  // watcher sees — `git config --global` writes outside the repo, `app-up`
  // makes an HTTP request, `db-up` opens a socket. Polling while a card is
  // unsatisfied means no card can ever dead-end waiting for an event that is
  // never coming.
  setInterval(() => {
    if (document.hidden) return;
    if (pendingFastChecks()) verifyCard({ silent: true });
  }, 3000);
}

/** True when the current card is waiting on checks that are cheap to re-run. */
function pendingFastChecks() {
  const step = stepById(currentId);

  if (!step || !currentCard || currentCard.gate.check.length === 0) return false;
  if (cardSatisfied(step, currentCard)) return false;

  const checks = step.checks.filter((c) => currentCard.gate.check.includes(c.id));

  // Never fire `npm test` off a timer or a keystroke.
  return checks.length > 0 && !checks.some((c) => c.slow);
}

/**
 * "Start over", confirmed in the page rather than with `confirm()`.
 *
 * A native dialog is silently suppressed inside a sandboxed iframe and blocked
 * outright cross-origin, so the button did nothing at all in some browsers —
 * the handler saw `false` and returned. Two clicks on the button itself work
 * everywhere, and are easier to back out of.
 */
/**
 * The handbook, shown in place of a card and dismissed back to where you were.
 * It never gates anything and never advances progress — conventions and command
 * lists are consulted, not studied.
 */
document.getElementById('open-handbook').addEventListener('click', async () => {
  const { markdown } = await api('/api/reference/handbook');

  contentEl.innerHTML = '';

  const body = document.createElement('div');

  body.innerHTML = renderMarkdown(markdown ?? '# Handbook\n\nCould not load it.');
  contentEl.append(body);

  const back = document.createElement('button');

  back.type = 'button';
  back.className = 'button button--ghost';
  back.textContent = '\u2190 Back to the step';
  back.addEventListener('click', () => show(currentId, cardPosition.get(currentId)));

  const nav = document.createElement('div');

  nav.className = 'card-nav';
  nav.append(back);
  contentEl.append(nav);
  contentEl.scrollTop = 0;
  contentEl.focus();
});

const resetButton = document.getElementById('reset');
let resetArmed = null;

resetButton.addEventListener('click', async () => {
  if (resetArmed === null) {
    resetButton.textContent = 'Really? This clears everything';
    resetButton.classList.add('link-button--armed');
    resetArmed = setTimeout(disarmReset, 5000);

    return;
  }

  disarmReset();
  resetButton.textContent = 'Starting over…';

  const result = await api('/api/reset', {});

  if (result?.error) {
    resetButton.textContent = 'Could not reset — try again';

    return;
  }

  resetButton.textContent = 'Start over';
  cardPosition.clear();
  await loadState();
  show(state.steps[0].id, 0);
});

function disarmReset() {
  if (resetArmed !== null) clearTimeout(resetArmed);

  resetArmed = null;
  resetButton.textContent = 'Start over';
  resetButton.classList.remove('link-button--armed');
}

/** `#step` or `#step/3` — the card number in the URL is 1-based. */
function fromHash() {
  const [id, card] = location.hash.slice(1).split('/');

  return { id, index: card ? Number(card) - 1 : undefined };
}

window.addEventListener('hashchange', () => {
  const { id, index } = fromHash();

  if (!id || !stepById(id)) return;
  if (id === currentId && index === cardPosition.get(id)) return;

  show(id, index);
});

// Left and right arrows page through cards, as long as the reader is not typing.
document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '')) return;

  if (event.key === 'ArrowRight') document.getElementById('card-next')?.click();
  if (event.key === 'ArrowLeft') document.querySelector('.card-nav .button--ghost')?.click();
});

await loadState();
listenForChanges();

const target = fromHash();
// Resume where the trainee left off: the first step that is not finished.
const firstOpen = state.steps.find((step) => !isDone(step.id)) ?? state.steps[0];

show(stepById(target.id) ? target.id : firstOpen.id, target.index);
