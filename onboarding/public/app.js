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

async function api(path, body) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
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

      const heading = document.createElement('li');

      heading.className = 'phase';
      heading.textContent = phase;
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

  body.innerHTML = renderMarkdown(card.markdown);
  contentEl.append(body);
  drawDiagrams(body);
  wireExercises(body);

  // Only this card's gates are shown, so a failure points at the instruction
  // immediately above it.
  for (const questionId of card.gate.quiz) {
    const question = step.quiz.find((q) => q.id === questionId);

    if (question) contentEl.append(drawQuestion(step, question));
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

// ------------------------------------------------------------- exercises

/**
 * Wires up the practice widgets inside a card.
 *
 * Neither of these gates anything. They are for the reader to find out whether
 * they followed, at the moment they read it, instead of discovering it later
 * when a check goes red.
 */
function wireExercises(container) {
  for (const box of container.querySelectorAll('.exercise--blank')) {
    const inputs = [...box.querySelectorAll('.blank')];
    const status = box.querySelector('.exercise__status');

    const grade = () => {
      let filled = 0;
      let right = 0;

      for (const input of inputs) {
        const value = input.value.trim();

        if (value === '') {
          input.dataset.state = '';

          continue;
        }

        filled += 1;

        const ok = value === input.dataset.answer;

        input.dataset.state = ok ? 'right' : 'wrong';

        if (ok) right += 1;
      }

      status.textContent =
        right === inputs.length
          ? 'That is it.'
          : filled === 0
            ? ''
            : `${right} of ${inputs.length}.`;
      status.dataset.state = right === inputs.length ? 'right' : '';
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

/** True when everything this card gates on has passed. */
function cardSatisfied(step, card) {
  const results = state.progress.steps[step.id]?.lastResults ?? [];

  return (
    card.gate.check.every((id) => results.find((r) => r.id === id)?.pass === true) &&
    card.gate.quiz.every((id) => state.progress.quiz[`${step.id}.${id}`] === true) &&
    card.gate.attest.every((id) => state.progress.attest[`${step.id}.${id}`] === true)
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
  const gated =
    currentCard.gate.check.length +
    currentCard.gate.quiz.length +
    currentCard.gate.attest.length >
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

document.getElementById('reset').addEventListener('click', async () => {
  if (!confirm('Clear all your tutorial progress and start from step 1?')) return;

  await api('/api/reset', {});
  cardPosition.clear();
  await loadState();
  show(state.steps[0].id, 0);
});

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
