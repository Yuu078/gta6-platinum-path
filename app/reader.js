// reader.js — the reading room.
// One story beat per screen. Turn pages with the buttons, the arrow keys,
// or a swipe. A missable beat is always preceded by its own interlude
// screen: the point of no return, where you stop and save before reading on.

export function chapterBeats(data, n) {
  return data.trophies.filter((t) => t.chapter === n);
}

export function buildFlow(data, n) {
  const flow = [];
  for (const beat of chapterBeats(data, n)) {
    if (beat.missable) flow.push({ type: 'ponr', beat });
    flow.push({ type: 'beat', beat });
  }
  return flow;
}

export function createReader({ container, data, state, isFogged, onChange }) {
  let chapterN = null;
  let flow = [];
  let at = 0;
  let keyHandler = null;
  let touchX = null;

  const chapterOf = (n) => data.chapters.find((c) => c.n === n);

  function noteRead(beat) {
    if (!state.read.includes(beat.id)) state.read.push(beat.id);
    state.last = { chapter: chapterN, beatId: beat.id };
    onChange();
  }

  function beatScreen(item, pos) {
    const beat = item.beat;
    const ch = chapterOf(chapterN);
    const earned = state.earned.includes(beat.id);
    const beats = chapterBeats(data, chapterN);
    const sceneNo = beats.indexOf(beat) + 1;
    const isLast = sceneNo === beats.length;
    const done = state.doneChapters.includes(chapterN);
    return `
      <div class="screen">
        <p class="scene-kicker">${ch.title} · Scene ${sceneNo} of ${beats.length}</p>
        <span class="grade-chip grade-${beat.grade}">${beat.grade}</span>
        <h3>${beat.name}</h3>
        <p class="beat-label">${beat.beat}</p>
        <p class="official">${beat.description}</p>
        <p class="guide">${beat.guide}</p>
        ${beat.tip ? `<p class="tip"><strong>Set-side tip:</strong> ${beat.tip}</p>` : ''}
        <ol class="steps">${beat.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="source">Source: ${beat.source}</p>
        <label class="earn-row"><input type="checkbox" data-earn="${beat.id}" ${earned ? 'checked' : ''}> I earned this one</label>
        ${isLast ? `<div class="card-actions" style="margin-top:14px"><button type="button" data-done="${chapterN}">${done ? 'Chapter marked done — undo' : 'Mark this chapter done'}</button></div>` : ''}
      </div>
      ${navHtml(pos)}`;
  }

  function ponrScreen(item, pos) {
    const beat = item.beat;
    return `
      <div class="screen ponr">
        <p class="scene-kicker">Interlude — before the next scene</p>
        <p class="ponr-title">Point of<br>No Return</p>
        <p class="save-note">Stop here. Make a manual save before you turn this page.</p>
        <p class="reason">The scene ahead — <strong>${beat.name}</strong> — can only be played once, and this is why: ${beat.missable}</p>
        <p class="reason">Save in a fresh slot, breathe, then read on when you are ready.</p>
      </div>
      ${navHtml(pos, 'I saved — turn the page')}`;
  }

  function fogScreen() {
    const ch = chapterOf(chapterN);
    return `
      <div class="screen fog-screen">
        <p class="scene-kicker">${ch.title}</p>
        <p class="fog-big">This chapter is still under fog.</p>
        <p>Its scenes and trophy names stay hidden until you mark the chapter before it done. That is the deal this walkthrough makes with spoilers.</p>
        <div class="card-actions" style="justify-content:center"><button type="button" data-close="1">Back to the chapter index</button></div>
      </div>`;
  }

  function navHtml(pos, nextLabel) {
    const lastPos = flow.length - 1;
    return `
      <div class="reader-nav">
        <button type="button" data-nav="prev" ${pos === 0 ? 'disabled' : ''}>← Prev scene</button>
        <span class="where">Page ${pos + 1} of ${flow.length}</span>
        <button type="button" data-nav="next">${pos === lastPos ? 'Close book' : (nextLabel || 'Next scene →')}</button>
      </div>
      <div class="reader-nav">
        <span class="where">Arrow keys and swipes turn pages too</span>
        <button type="button" data-close="1">Back to index</button>
      </div>`;
  }

  function render() {
    if (chapterN === null) { container.hidden = true; container.innerHTML = ''; return; }
    container.hidden = false;
    if (isFogged(chapterN)) { container.innerHTML = fogScreen(); wire(); return; }
    const item = flow[at];
    container.innerHTML = item.type === 'ponr' ? ponrScreen(item, at) : beatScreen(item, at);
    if (item.type === 'beat') noteRead(item.beat);
    wire();
  }

  function step(dir) {
    if (chapterN === null || isFogged(chapterN)) return;
    if (dir > 0 && at === flow.length - 1) { close(); return; }
    at = Math.min(flow.length - 1, Math.max(0, at + dir));
    render();
    container.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  function wire() {
    container.querySelectorAll('[data-nav]').forEach((b) => {
      b.addEventListener('click', () => step(b.dataset.nav === 'next' ? 1 : -1));
    });
    container.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    const box = container.querySelector('[data-earn]');
    if (box) box.addEventListener('change', () => {
      const id = Number(box.dataset.earn);
      if (box.checked && !state.earned.includes(id)) state.earned.push(id);
      if (!box.checked) state.earned = state.earned.filter((x) => x !== id);
      onChange();
    });
    const doneBtn = container.querySelector('[data-done]');
    if (doneBtn) doneBtn.addEventListener('click', () => {
      const n = Number(doneBtn.dataset.done);
      if (state.doneChapters.includes(n)) state.doneChapters = state.doneChapters.filter((x) => x !== n);
      else state.doneChapters.push(n);
      onChange();
      render();
    });
  }

  function open(n, beatId, bypassFog) {
    document.body.classList.add('reading');
    chapterN = n;
    flow = buildFlow(data, n);
    at = 0;
    if (beatId) {
      const idx = flow.findIndex((f) => f.beat.id === beatId);
      if (idx >= 0) at = idx;
    }
    if (bypassFog) fogOverride = n; else fogOverride = null;
    attachKeys();
    render();
    container.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  let fogOverride = null;
  const foggedNow = (n) => (fogOverride === n ? false : isFogged(n));

  // render() consults foggedNow through this wrapper
  const baseRender = render;
  render = function () {
    if (chapterN === null) { container.hidden = true; container.innerHTML = ''; return; }
    container.hidden = false;
    if (foggedNow(chapterN)) { container.innerHTML = fogScreen(); wire(); return; }
    const item = flow[at];
    container.innerHTML = item.type === 'ponr' ? ponrScreen(item, at) : beatScreen(item, at);
    if (item.type === 'beat') noteRead(item.beat);
    wire();
  };

  function openScene(beatId) {
    document.body.classList.add('reading');
    const beat = data.trophies.find((t) => t.id === beatId);
    if (!beat || beat.chapter === null) return;
    chapterN = beat.chapter;
    flow = buildFlow(data, chapterN);
    const ponrIdx = flow.findIndex((f) => f.type === 'ponr' && f.beat.id === beatId);
    const beatIdx = flow.findIndex((f) => f.type === 'beat' && f.beat.id === beatId);
    at = ponrIdx >= 0 ? ponrIdx : Math.max(0, beatIdx);
    fogOverride = chapterN;
    attachKeys();
    render();
    container.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  function attachKeys() {
    if (keyHandler) return;
    keyHandler = (ev) => {
      if (container.hidden) return;
      if (ev.key === 'ArrowRight') step(1);
      if (ev.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', keyHandler);
    container.addEventListener('touchstart', (ev) => { touchX = ev.changedTouches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', (ev) => {
      if (touchX === null) return;
      const dx = ev.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
  }

  function close() {
    document.body.classList.remove('reading');
    chapterN = null;
    container.hidden = true;
    container.innerHTML = '';
    document.getElementById('chapter-index')?.scrollIntoView({ behavior: 'auto' });
  }

  return { open, openScene, close };
}
