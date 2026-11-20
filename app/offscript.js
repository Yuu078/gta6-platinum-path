// OFF THE SCRIPT: the closing index. Everything that is not a story beat is
// listed here the way the back of a book lists its scenes — one compact row
// per trophy, name and tags only, no cards. A row opens the same drawer the
// timeline uses, where the guide, steps and source live. Search and grade
// filters sit above the index; every row can be checked off as earned.

import { saveState } from './progress.js';
import { createDrawer } from './reader.js';

export function renderOffscript({ mount, data, state, kindFilter, onStateChange }) {
  const items = data.trophies.filter((t) => t.offscript === true);
  const drawerKit = createDrawer({ state, onStateChange });

  mount.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Off the Script';
  const lede = document.createElement('p');
  lede.className = 'lede';
  lede.textContent = 'The story is over, or paused, or none of its business. These 35 trophies live outside the chapters — an index of hunts, heists, collections and strange little errands. Open any row for its guide.';

  const controls = document.createElement('div');
  controls.className = 'off-controls';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search the index…';
  search.setAttribute('aria-label', 'Search off-script trophies');
  const grade = document.createElement('select');
  grade.setAttribute('aria-label', 'Filter by grade');
  for (const value of ['all', 'platinum', 'gold', 'silver', 'bronze']) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value === 'all' ? 'All grades' : value[0].toUpperCase() + value.slice(1);
    grade.append(option);
  }
  controls.append(search, grade);

  const list = document.createElement('div');
  list.className = 'index-list';

  function draw() {
    const needle = search.value.trim().toLowerCase();
    list.replaceChildren();
    for (const t of items) {
      if (kindFilter && kindFilter !== 'all' && t.kind !== kindFilter) continue;
      if (grade.value !== 'all' && t.grade !== grade.value) continue;
      if (needle && !`${t.name} ${t.description} ${t.guide}`.toLowerCase().includes(needle)) continue;

      const row = document.createElement('div');
      row.className = 'index-row';
      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'index-main';
      main.addEventListener('click', () => drawerKit.open(t));
      const name = document.createElement('span');
      name.className = 'index-name';
      name.textContent = t.name;
      const gradeTag = document.createElement('span');
      gradeTag.className = `tag grade-${t.grade}`;
      gradeTag.textContent = t.grade;
      const kindTag = document.createElement('span');
      kindTag.className = 'kind-tag';
      kindTag.textContent = t.missable ? 'Missable' : t.kind;
      main.append(name, gradeTag, kindTag);

      const check = document.createElement('label');
      check.className = 'index-check';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = state.earned.includes(t.id);
      box.setAttribute('aria-label', `Mark ${t.name} earned`);
      box.addEventListener('change', () => {
        if (box.checked) state.earned.push(t.id);
        else state.earned = state.earned.filter((id) => id !== t.id);
        saveState(state);
        if (onStateChange) onStateChange();
      });
      check.append(box);

      row.append(main, check);
      list.append(row);
    }
    if (!list.children.length) {
      const empty = document.createElement('p');
      empty.className = 'lede';
      empty.textContent = 'Nothing off the script matches that. Loosen the search or the filters.';
      list.append(empty);
    }
  }

  search.addEventListener('input', draw);
  grade.addEventListener('change', draw);
  draw();

  mount.append(heading, lede, controls, list, drawerKit.backdrop, drawerKit.drawer);
  return { redraw: draw };
}
