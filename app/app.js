// Platinum Path — composition. This module loads the trophy data, restores
// (or seeds) the reader's place, and assembles the page: the RESUME SCENE
// hero, the per-chapter dot rail, the story reader, and the OFF THE SCRIPT
// closing section. There is deliberately no global percentage and no
// "next up" panel anywhere: progress is told per chapter, in dots.

import { createReader, CHAPTER_NAMES } from './reader.js';
import { renderOffscript } from './offscript.js';
import {
  loadState,
  saveState,
  wipeState,
  exportState,
  importState,
  buildScreenIndex,
} from './progress.js';

const response = await fetch('data/trophies.json');
const data = await response.json();

let state = loadState(data);
let kindFilter = 'all';

const heroMount = document.getElementById('hero');
const railMount = document.getElementById('rail');
const readerMount = document.getElementById('reader');
const offscriptMount = document.getElementById('offscript');
offscriptMount.classList.add('offscript');

const screens = buildScreenIndex(data);

function chapterBeats(chapter) {
  return data.trophies.filter((t) => t.chapter === chapter);
}

function renderHero() {
  heroMount.replaceChildren();
  const hero = document.createElement('div');
  hero.className = 'hero';

  const kicker = document.createElement('p');
  kicker.className = 'kicker';
  kicker.textContent = 'Grand Theft Auto VI · PlayStation 5';
  const title = document.createElement('h1');
  const sunset = document.createElement('span');
  sunset.className = 'sunset';
  sunset.textContent = 'Platinum Path';
  title.append(sunset);
  const intro = document.createElement('p');
  intro.textContent = 'Not a checklist. A screenplay you read down a timeline, in the order Leonida tells it — trophies hiding as tags inside the story, until the platinum is simply how the story ends. Points of no return interrupt the reading before they can hurt you.';

  const resume = document.createElement('div');
  resume.className = 'resume-card';
  const scene = document.createElement('div');
  scene.className = 'scene display';
  const bookmarked = screens[state.bookmark.screen] ?? screens[0];
  const small = document.createElement('small');
  small.textContent = 'Resume scene';
  const sceneName = document.createElement('span');
  sceneName.textContent = bookmarked.type === 'interlude'
    ? `Point of no return — ${bookmarked.trophy.name}`
    : `${CHAPTER_NAMES[bookmarked.chapter]} · ${bookmarked.trophy.beat}`;
  scene.append(small, sceneName);
  const resumeButton = document.createElement('button');
  resumeButton.type = 'button';
  resumeButton.className = 'resume-button';
  resumeButton.textContent = 'Resume reading →';
  resumeButton.addEventListener('click', () => {
    reader.goTo(state.bookmark.screen);
    readerMount.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  resume.append(scene, resumeButton);

  hero.append(kicker, title, intro, resume);
  heroMount.append(hero);
}

function renderRail() {
  railMount.replaceChildren();
  railMount.className = 'rail';
  for (let chapter = 0; chapter <= 5; chapter += 1) {
    const row = document.createElement('div');
    row.className = 'rail-row';
    const name = document.createElement('span');
    name.className = 'chapter-name';
    name.textContent = CHAPTER_NAMES[chapter];
    const dots = document.createElement('span');
    dots.className = 'dots';
    for (const t of chapterBeats(chapter)) {
      const dot = document.createElement('span');
      dot.className = state.earned.includes(t.id) ? 'dot earned' : 'dot';
      dot.title = t.name;
      dots.append(dot);
    }
    row.append(name, dots);
    if (state.chaptersDone.includes(chapter)) {
      const flag = document.createElement('span');
      flag.className = 'done-flag';
      flag.textContent = 'Done';
      row.append(flag);
    }
    railMount.append(row);
  }
}

function refreshChrome() {
  renderHero();
  renderRail();
}

const reader = createReader({
  mount: readerMount,
  data,
  state,
  onStateChange: refreshChrome,
});

let offscriptView = null;
function drawOffscript() {
  offscriptView = renderOffscript({
    mount: offscriptMount,
    data,
    state,
    kindFilter,
    onStateChange: refreshChrome,
  });
}
drawOffscript();

for (const button of document.querySelectorAll('.kind')) {
  button.addEventListener('click', () => {
    kindFilter = button.dataset.kind;
    for (const other of document.querySelectorAll('.kind')) {
      other.classList.toggle('is-active', other === button);
    }
    drawOffscript();
    offscriptMount.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const spoilerToggle = document.getElementById('spoilers');
spoilerToggle.checked = state.hideSpoilers;
spoilerToggle.addEventListener('change', () => {
  state.hideSpoilers = spoilerToggle.checked;
  saveState(state);
  reader.render();
});

document.getElementById('export').addEventListener('click', () => exportState(state));
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  state = await importState(file);
  location.reload();
});
document.getElementById('wipe').addEventListener('click', () => {
  state = wipeState();
  location.reload();
});

refreshChrome();

// Deep links for readers (and screenshots): ?view=reader starts at the
// bookmarked scene, ?view=drawer opens the bookmarked beat's drawer,
// ?view=missable at the first point of no return, and ?view=offscript at
// the closing index.
const view = new URLSearchParams(location.search).get('view');
if (view === 'reader') {
  reader.goTo(state.bookmark.screen);
} else if (view === 'drawer') {
  reader.goTo(state.bookmark.screen);
  reader.openDrawerAt(state.bookmark.screen);
} else if (view === 'missable') {
  const first = screens.findIndex((s) => s.type === 'interlude');
  if (first >= 0) reader.goTo(first);
} else if (view === 'offscript') {
  offscriptMount.scrollIntoView();
}
