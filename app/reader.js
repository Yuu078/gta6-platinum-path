// The screenplay timeline: Platinum Path reads like a shooting script, not a
// spreadsheet. The story beats run down a vertical cinematic timeline, the
// STORY TEXT is the main object on the page, and each trophy hides inside
// its paragraph as an inline trigger tag — gold, silver or bronze. Tapping a
// tag slides the drawer over with the technical work: requirements, guide,
// steps and source. There are no trophy cards anywhere in this book.

import { buildScreenIndex, saveState } from './progress.js';

export const CHAPTER_NAMES = [
  'Prologue',
  'Chapter 1',
  'Chapter 2',
  'Chapter 3',
  'Chapter 4',
  'The Final Ride',
];

export const LEAD_LABELS = {
  lucia: 'Lucia',
  jason: 'Jason',
  duo: 'Lucia + Jason',
};

// The drawer is shared: the timeline opens it from inline tags, and the
// OFF THE SCRIPT index opens it from its rows. One trophy at a time, slid
// over the page, closed by its button, the backdrop, or Escape.
export function createDrawer({ state, onStateChange }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  const drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.setAttribute('aria-label', 'Trophy details');
  backdrop.hidden = true;
  drawer.hidden = true;

  function close() {
    backdrop.hidden = true;
    drawer.hidden = true;
  }
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  function open(trophy) {
    drawer.replaceChildren();
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'drawer-close';
    closeButton.textContent = 'Close ×';
    closeButton.addEventListener('click', close);

    const grade = document.createElement('p');
    grade.className = `drawer-grade grade-${trophy.grade}`;
    grade.textContent = `${trophy.grade} trophy · ${trophy.kind}`;
    const name = document.createElement('h3');
    name.textContent = trophy.name;
    const desc = document.createElement('p');
    desc.className = 'drawer-desc';
    desc.textContent = trophy.description;
    const guide = document.createElement('p');
    guide.className = 'drawer-guide';
    guide.textContent = trophy.guide;
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    }
    const meta = document.createElement('p');
    meta.className = 'drawer-meta';
    meta.textContent = `Difficulty ${trophy.difficulty} of 5 · about ${trophy.minutes} minutes`
      + (typeof trophy.count === 'number' ? ` · target: ${trophy.count}` : '')
      + ` · Source: ${trophy.source}`;

    drawer.append(closeButton, grade, name, desc, guide, steps, meta);

    if (trophy.missableReason) {
      const alarm = document.createElement('p');
      alarm.className = 'drawer-alarm';
      alarm.textContent = `Point of no return — ${trophy.missableReason}`;
      drawer.append(alarm);
    }

    const earnedLabel = document.createElement('label');
    earnedLabel.className = 'earned-toggle';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.includes(trophy.id);
    box.addEventListener('change', () => {
      if (box.checked) state.earned.push(trophy.id);
      else state.earned = state.earned.filter((id) => id !== trophy.id);
      saveState(state);
      if (onStateChange) onStateChange();
    });
    earnedLabel.append(box, document.createTextNode(' Trophy earned'));
    drawer.append(earnedLabel);

    backdrop.hidden = false;
    drawer.hidden = false;
  }

  return { backdrop, drawer, open, close };
}

export function createReader({ mount, data, state, onStateChange }) {
  const screens = buildScreenIndex(data);
  const elements = new Map();
  const drawerKit = createDrawer({ state, onStateChange });
  let current = Math.min(Math.max(state.bookmark.screen ?? 0, 0), screens.length - 1);

  function persist() {
    state.bookmark = { screen: current };
    saveState(state);
    if (onStateChange) onStateChange();
  }

  // Spoiler fog: a chapter stays fogged until the previous chapter is
  // marked done. Chapter 0 is always clear. Turning the spoiler setting off
  // in the toolbar lifts the fog everywhere at once.
  function isFogged(chapter) {
    if (!state.hideSpoilers) return false;
    if (chapter === 0) return false;
    return !state.chaptersDone.includes(chapter - 1);
  }

  function beatEntry(screen, screenIndex, beatNumber) {
    const t = screen.trophy;
    const fogged = isFogged(screen.chapter);
    const entry = document.createElement('article');
    entry.className = fogged ? 'beat-entry fogged' : 'beat-entry';
    entry.dataset.screen = String(screenIndex);

    const rail = document.createElement('div');
    rail.className = 'beat-rail';
    const dot = document.createElement('span');
    dot.className = state.earned.includes(t.id) ? 'beat-dot earned' : 'beat-dot';
    rail.append(dot);

    const body = document.createElement('div');
    body.className = 'beat-body';
    const kicker = document.createElement('p');
    kicker.className = 'beat-kicker';
    const beatLabel = document.createElement('span');
    beatLabel.textContent = `Beat ${beatNumber}`;
    const lead = document.createElement('span');
    lead.className = `lead lead-${t.lead}`;
    lead.textContent = LEAD_LABELS[t.lead] ?? 'Duo';
    kicker.append(beatLabel, document.createTextNode(' · '), lead);

    const title = document.createElement('h3');
    title.textContent = fogged ? 'An unread scene' : t.beat;

    const text = document.createElement('p');
    text.className = 'beat-text';
    text.append(document.createTextNode(
      fogged
        ? 'This part of the story is still ahead of you. Finish the chapter before it and mark it done, and the fog over this scene will lift. '
        : `${t.beatText} `,
    ));
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = `tag grade-${t.grade}${state.earned.includes(t.id) ? ' earned' : ''}`;
    tag.textContent = fogged ? 'a trophy in the fog' : t.name;
    tag.disabled = fogged;
    tag.addEventListener('click', () => drawerKit.open(t));
    tag.addEventListener('mouseenter', () => { if (!fogged) tag.classList.add('hovering'); });
    tag.addEventListener('mouseleave', () => tag.classList.remove('hovering'));
    text.append(tag);

    body.append(kicker, title, text);
    if (fogged) {
      const fogNote = document.createElement('p');
      fogNote.className = 'fog-note';
      fogNote.textContent = `Fogged until ${CHAPTER_NAMES[screen.chapter - 1]} is marked done.`;
      body.append(fogNote);
    }
    entry.append(rail, body);
    return entry;
  }

  // A missable interrupts the timeline as a full-width card. It is never
  // fogged: the whole point is that you cannot un-know it in time.
  function interludeCard(screen, screenIndex) {
    const t = screen.trophy;
    const article = document.createElement('article');
    article.className = 'interlude';
    article.dataset.screen = String(screenIndex);

    const ponr = document.createElement('p');
    ponr.className = 'ponr';
    ponr.textContent = '⚠ Point of no return';
    const title = document.createElement('h3');
    title.textContent = t.name;
    const saveCall = document.createElement('p');
    saveCall.className = 'save-call';
    saveCall.textContent = 'Make a manual save here — before you read another page.';
    const reason = document.createElement('p');
    reason.className = 'reason';
    reason.textContent = t.missableReason;
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'interlude-open';
    openButton.textContent = 'How to survive it →';
    openButton.addEventListener('click', () => drawerKit.open(t));
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `Missable · ${t.grade} · after ${CHAPTER_NAMES[screen.chapter]} · Source: ${t.source}`;

    article.append(ponr, title, saveCall, reason, openButton, meta);
    return article;
  }

  function chapterDoneRow(chapter) {
    const row = document.createElement('div');
    row.className = 'chapter-done-row';
    const button = document.createElement('button');
    button.type = 'button';
    const done = state.chaptersDone.includes(chapter);
    button.textContent = done
      ? `✓ ${CHAPTER_NAMES[chapter]} marked done`
      : `Mark ${CHAPTER_NAMES[chapter]} done — lift the fog on what follows`;
    button.disabled = done;
    button.addEventListener('click', () => {
      if (!state.chaptersDone.includes(chapter)) {
        state.chaptersDone.push(chapter);
        persist();
        render();
      }
    });
    row.append(button);
    return row;
  }

  function render() {
    elements.clear();
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    let lastChapter = -1;
    let beatNumber = 0;
    screens.forEach((screen, index) => {
      if (screen.type === 'beat') {
        beatNumber += 1;
        if (screen.chapter !== lastChapter) {
          lastChapter = screen.chapter;
          const head = document.createElement('div');
          head.className = 'chapter-head';
          const headTitle = document.createElement('h2');
          headTitle.textContent = CHAPTER_NAMES[screen.chapter];
          const headNote = document.createElement('span');
          headNote.textContent = screen.chapter === 0 ? 'where it begins' : screen.chapter === 5 ? 'where it ends' : 'the story continues';
          head.append(headTitle, headNote);
          timeline.append(head);
        }
        const entry = beatEntry(screen, index, beatNumber);
        elements.set(index, entry);
        timeline.append(entry);
        const next = screens[index + 1];
        if (screen.chapter < 5 && (!next || next.type !== 'beat' || next.chapter !== screen.chapter)) {
          timeline.append(chapterDoneRow(screen.chapter));
        }
      } else {
        const card = interludeCard(screen, index);
        elements.set(index, card);
        timeline.append(card);
      }
    });
    mount.replaceChildren(timeline, nav, drawerKit.backdrop, drawerKit.drawer);
  }

  const nav = document.createElement('div');
  nav.className = 'reader-nav';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.textContent = '← Previous beat';
  const position = document.createElement('span');
  position.className = 'position';
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Next beat →';
  nav.append(prev, position, next);

  function goTo(index) {
    current = Math.min(Math.max(index, 0), screens.length - 1);
    persist();
    const target = elements.get(current);
    if (target) {
      target.scrollIntoView({ block: 'start' });
      target.classList.add('is-current');
      setTimeout(() => target.classList.remove('is-current'), 1600);
    }
    position.textContent = `Scene ${current + 1} of ${screens.length}`;
    prev.disabled = current === 0;
    next.disabled = current === screens.length - 1;
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  document.addEventListener('keydown', (event) => {
    if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT')) return;
    if (event.key === 'ArrowRight') goTo(current + 1);
    if (event.key === 'ArrowLeft') goTo(current - 1);
  });

  render();
  position.textContent = `Scene ${current + 1} of ${screens.length}`;
  prev.disabled = current === 0;
  next.disabled = current === screens.length - 1;

  return {
    screens,
    goTo,
    render,
    openDrawerAt(index) {
      const screen = screens[index];
      if (screen) drawerKit.open(screen.trophy);
    },
    get current() { return current; },
  };
}
