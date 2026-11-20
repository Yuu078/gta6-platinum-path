// app.js — boot, the resume bookmark, and the chapter index.
// The story is the interface: a poster up top, your bookmark beneath it,
// then the chapters in order, each keeping its secrets until its turn.

import { loadState, saveState, wipeState, exportState, importState } from './progress.js';
import { createReader, chapterBeats } from './reader.js';
import { renderOffScript } from './offscript.js';

const params = new URLSearchParams(location.search);
const heroEl = document.getElementById('resume-hero');
const indexEl = document.getElementById('chapter-index');
const readerEl = document.getElementById('reader');
const offEl = document.getElementById('offscript');
const noteEl = document.getElementById('ledger-note');

let data = null;
let state = null;
let reader = null;
let offView = null;

const isFogged = (n) => n > 0 && !state.doneChapters.includes(n - 1);
const chapterOf = (n) => data.chapters.find((c) => c.n === n);
const trophyOf = (id) => data.trophies.find((t) => t.id === id);

function renderHero() {
  if (state.last && trophyOf(state.last.beatId)) {
    const ch = chapterOf(state.last.chapter);
    const beat = trophyOf(state.last.beatId);
    heroEl.innerHTML = `
      <p class="rh-kicker">Resume Scene</p>
      <p class="rh-scene">${ch.title}</p>
      <p class="rh-beat">You left the story at: ${beat.beat} · ${beat.name}</p>
      <button type="button" class="primary" id="resume-btn">Pick the scene back up</button>`;
    heroEl.querySelector('#resume-btn').addEventListener('click', () => {
      reader.open(state.last.chapter, state.last.beatId);
    });
  } else {
    heroEl.innerHTML = `
      <p class="rh-kicker">Resume Scene</p>
      <p class="rh-scene">No bookmark yet — the story has not begun.</p>
      <p class="rh-beat">It starts with a fishing trip in the Prologue, and it only gets stranger from there.</p>
      <button type="button" class="primary" id="resume-btn">Begin at the Prologue</button>`;
    heroEl.querySelector('#resume-btn').addEventListener('click', () => reader.open(0));
  }
}

function dotsFor(n) {
  return chapterBeats(data, n).map((b) => {
    const cls = state.earned.includes(b.id) ? 'earned' : state.read.includes(b.id) ? 'read' : '';
    return `<span class="dot ${cls}" title="${b.name}"></span>`;
  }).join('');
}

function renderIndex() {
  indexEl.innerHTML = data.chapters.map((ch) => {
    const fog = isFogged(ch.n);
    const beats = chapterBeats(data, ch.n);
    const done = state.doneChapters.includes(ch.n);
    return `
      <article class="chapter-card ${fog ? 'fogged' : ''}" id="chapter-${ch.n}">
        <span class="big-num">${ch.n}</span>
        <h3>${ch.title}${done ? '<span class="done-badge">Done</span>' : ''}</h3>
        <p class="tagline">${ch.tagline}</p>
        <div class="${fog ? 'fog-blur' : ''}">
          <p class="summary">${ch.summary}</p>
          <ul class="beat-names">${beats.map((b) => `<li>${b.beat} — ${b.name}</li>`).join('')}</ul>
        </div>
        ${fog ? '<p class="fog-note">Under fog. Mark the chapter before this one done, and these pages clear.</p>' : ''}
        <div class="dots">${dotsFor(ch.n)}</div>
        <div class="card-actions">
          <button type="button" class="primary" data-read="${ch.n}">${fog ? 'Peek at the fog' : 'Read this chapter'}</button>
          <button type="button" data-toggle-done="${ch.n}">${done ? 'Undo done' : 'Mark chapter done'}</button>
        </div>
      </article>`;
  }).join('');
  indexEl.querySelectorAll('[data-read]').forEach((b) => {
    b.addEventListener('click', () => {
      const n = Number(b.dataset.read);
      const resumeHere = state.last && state.last.chapter === n ? state.last.beatId : undefined;
      reader.open(n, resumeHere);
    });
  });
  indexEl.querySelectorAll('[data-toggle-done]').forEach((b) => {
    b.addEventListener('click', () => {
      const n = Number(b.dataset.toggleDone);
      if (state.doneChapters.includes(n)) state.doneChapters = state.doneChapters.filter((x) => x !== n);
      else state.doneChapters.push(n);
      onChange();
    });
  });
}

function onChange(redrawOff = true) {
  saveState(state);
  renderHero();
  renderIndex();
  if (redrawOff && offView) offView.redraw();
}

function wireLedger() {
  document.getElementById('export-btn').addEventListener('click', () => {
    exportState(state);
    noteEl.textContent = 'Your place is saved to a file. Keep it somewhere safe.';
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    Object.assign(state, wipeState());
    if (reader) reader.close();
    onChange();
    noteEl.textContent = 'Wiped clean. No bookmarks, no marks — page one is waiting whenever you are.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('import-file').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    importState(file, (next) => {
      Object.assign(state, next);
      onChange();
      noteEl.textContent = 'Bookmark restored. The story picks up where that file left it.';
    }, () => {
      noteEl.textContent = 'That file does not look like a saved place. Nothing was changed.';
    });
  });
}

async function boot() {
  const res = await fetch('data/trophies.json');
  data = await res.json();
  state = loadState(data, params.get('demo') === '1');
  reader = createReader({ container: readerEl, data, state, isFogged, onChange: () => onChange(false) });
  // reader shares the live state object; after a wipe we rebind below
  renderHero();
  renderIndex();
  offView = renderOffScript({ container: offEl, data, state, onChange: () => onChange(false) });
  wireLedger();

  if (params.get('scene')) {
    reader.openScene(Number(params.get('scene')));
  } else if (params.get('chapter') !== null && params.get('chapter') !== '') {
    const n = Number(params.get('chapter'));
    const resumeHere = state.last && state.last.chapter === n ? state.last.beatId : undefined;
    reader.open(n, resumeHere);
  } else if (params.get('view') === 'offscript') {
    document.body.classList.add('offscript-focus');
    setTimeout(() => offEl.scrollIntoView(), 60);
  }
}

boot();
