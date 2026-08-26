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

async function markdownFor(id) {
  if (!markdownCache.has(id)) {
    const { markdown } = await api(`/api/content/${id}`);

    markdownCache.set(id, markdown);
  }

  return markdownCache.get(id);
}

async function show(id) {
  currentId = id;
  location.hash = id;

  const step = stepById(id);
  const markdown = await markdownFor(id);

  contentEl.innerHTML = '';

  const header = document.createElement('div');

  header.innerHTML =
    `<p class="eyebrow">${escapeHtml(step.phase)}</p>` +
    `<h1>${escapeHtml(step.title)}</h1>` +
    `<p class="meta">Step ${step.number} of ${state.steps.length} · about ${step.minutes} minutes</p>`;
  contentEl.append(header);

  const body = document.createElement('div');

  body.innerHTML = renderMarkdown(markdown);
  contentEl.append(body);
  drawDiagrams(body);

  for (const question of step.quiz) {
    contentEl.append(drawQuestion(step, question));
  }

  if (step.checks.length > 0 || step.attest.length > 0) {
    contentEl.append(drawPanel(step));
  }

  contentEl.append(drawFooterNav(step));
  drawSidebar();
  contentEl.scrollTop = 0;
  contentEl.focus();
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
        refreshPanelStatus(step);
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

function drawPanel(step) {
  const panel = document.createElement('section');

  panel.className = 'panel';
  panel.id = 'panel';

  const hasChecks = step.checks.length > 0;

  panel.innerHTML =
    '<h2 class="panel__title">Check your work</h2>' +
    `<p class="panel__hint">${
      hasChecks
        ? 'This runs against your actual repository — your branch, your files, your tests.'
        : 'Tick these off once you have really done them. Nothing here can be checked automatically.'
    }</p>`;

  if (step.attest.length > 0) {
    const list = document.createElement('ul');

    list.className = 'attest';

    for (const item of step.attest) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');

      input.type = 'checkbox';
      input.checked = state.progress.attest[`${step.id}.${item.id}`] === true;
      input.addEventListener('change', async () => {
        const result = await api('/api/attest', {
          step: step.id,
          item: item.id,
          value: input.checked,
        });

        state.progress.attest[`${step.id}.${item.id}`] = input.checked;
        state.progress.steps[step.id] = {
          ...state.progress.steps[step.id],
          complete: result.complete,
        };
        drawSidebar();
        refreshPanelStatus(step);
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

  if (hasChecks) {
    const list = document.createElement('ul');

    list.className = 'check-list';
    list.id = 'check-list';

    const previous = state.progress.steps[step.id]?.lastResults;

    drawCheckResults(list, step, previous);
    panel.append(list);
  }

  const actions = document.createElement('div');

  actions.className = 'actions';

  if (hasChecks) {
    const runButton = document.createElement('button');

    runButton.type = 'button';
    runButton.className = 'button';
    runButton.textContent = 'Check my work';

    const status = document.createElement('span');

    status.className = 'status';
    status.id = 'panel-status';

    runButton.addEventListener('click', async () => {
      runButton.disabled = true;
      runButton.textContent = 'Checking…';

      const slow = step.checks.some((check) => check.slow);

      status.textContent = slow
        ? 'Running your tests. This takes a minute or so.'
        : 'Looking…';

      const list = document.getElementById('check-list');

      drawCheckResults(list, step, null, { running: true });

      try {
        const result = await api('/api/check', { step: step.id });

        drawCheckResults(list, step, result.results);
        state.progress.steps[step.id] = {
          checksPassed: result.results.every((entry) => entry.pass),
          lastResults: result.results,
          complete: result.complete,
        };
        drawSidebar();
      } finally {
        runButton.disabled = false;
        runButton.textContent = 'Check my work';
        refreshPanelStatus(step);
      }
    });

    actions.append(runButton, status);
  } else {
    const status = document.createElement('span');

    status.className = 'status';
    status.id = 'panel-status';
    actions.append(status);
  }

  panel.append(actions);
  queueMicrotask(() => refreshPanelStatus(step));

  return panel;
}

function drawCheckResults(list, step, results, { running = false } = {}) {
  if (!list) return;

  list.innerHTML = '';

  for (const check of step.checks) {
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
      (check.slow && status !== 'pass' ? '<span class="check__slow">slow</span>' : '') +
      '</div>';

    if (result?.detail) {
      const detail = document.createElement('div');

      detail.className = 'check__detail';
      detail.innerHTML = renderMarkdown(result.detail);
      item.append(detail);
    }

    list.append(item);
  }
}

function refreshPanelStatus(step) {
  const status = document.getElementById('panel-status');

  if (!status) return;

  if (isDone(step.id)) {
    status.textContent = 'Step complete.';
    status.className = 'status status--done';

    return;
  }

  const outstanding = [];
  const progress = state.progress;

  if (step.checks.length > 0 && progress.steps[step.id]?.checksPassed !== true) {
    outstanding.push('checks');
  }

  const quizLeft = step.quiz.filter(
    (question) => progress.quiz[`${step.id}.${question.id}`] !== true,
  ).length;

  if (quizLeft > 0) outstanding.push(`${quizLeft} question${quizLeft === 1 ? '' : 's'}`);

  const attestLeft = step.attest.filter(
    (item) => progress.attest[`${step.id}.${item.id}`] !== true,
  ).length;

  if (attestLeft > 0) outstanding.push(`${attestLeft} to confirm`);

  status.className = 'status';
  status.textContent = outstanding.length > 0 ? `Still open: ${outstanding.join(', ')}.` : '';
}

// --------------------------------------------------------------------- nav

function drawFooterNav(step) {
  const nav = document.createElement('div');

  nav.className = 'footer-nav';

  const index = state.steps.findIndex((entry) => entry.id === step.id);
  const previous = state.steps[index - 1];
  const next = state.steps[index + 1];

  for (const [target, label, align] of [
    [previous, previous ? `← ${previous.title}` : null, 'left'],
    [next, next ? `${next.title} →` : null, 'right'],
  ]) {
    const slot = document.createElement('div');

    if (target) {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'button button--ghost';
      button.textContent = label;
      button.addEventListener('click', () => show(target.id));
      slot.append(button);
    }

    slot.style.textAlign = align;
    nav.append(slot);
  }

  return nav;
}

document.getElementById('reset').addEventListener('click', async () => {
  if (!confirm('Clear all your tutorial progress and start from step 1?')) return;

  await api('/api/reset', {});
  await loadState();
  show(state.steps[0].id);
});

window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);

  if (id && id !== currentId && stepById(id)) show(id);
});

await loadState();

// Resume where the trainee left off: the first step that is not finished.
const fromHash = location.hash.slice(1);
const firstOpen = state.steps.find((step) => !isDone(step.id)) ?? state.steps[0];

show(stepById(fromHash) ? fromHash : firstOpen.id);
