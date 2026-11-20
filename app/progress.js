// Progress for Platinum Path lives in localStorage under one versioned key.
// The state is small on purpose: which trophies are earned, which chapters are
// marked done, where the reader left its bookmark, and the spoiler setting.
// Nothing here talks to a network; export and import move a JSON file by hand.

export const STORAGE_KEY = 'platinum-path-reader-state-v1';

export function emptyState() {
  return {
    earned: [],
    chaptersDone: [],
    bookmark: { screen: 0 },
    hideSpoilers: true,
  };
}

// The seeded first load: chapters 0 and 1 are done, chapter 2 is under way,
// the opening beats of chapter 2 are earned, and the bookmark sits in the
// middle of chapter 2 so a first-time reader lands inside the story.
export function seedState(data) {
  const state = emptyState();
  state.chaptersDone = [0, 1];
  const early = data.trophies.filter(
    (t) => (typeof t.chapter === 'number' && t.chapter <= 1) || t.id === 4,
  );
  state.earned = early.map((t) => t.id);
  const screens = buildScreenIndex(data);
  const chapterTwo = screens.filter((s) => s.chapter === 2 && s.type === 'beat');
  const mid = chapterTwo[Math.floor(chapterTwo.length / 2)];
  state.bookmark = { screen: screens.indexOf(mid) };
  return state;
}

// The reading order is shared with the reader: chapter beats in order, with a
// point-of-no-return interlude placed at the chapter break it belongs to.
export const INTERLUDE_PLACEMENT = new Map([
  [44, 0],
  [47, 2],
  [37, 3],
  [48, 4],
  [49, 4],
]);

export function buildScreenIndex(data) {
  const screens = [];
  const byChapter = new Map();
  for (const t of data.trophies) {
    if (typeof t.chapter === 'number') {
      if (!byChapter.has(t.chapter)) byChapter.set(t.chapter, []);
      byChapter.get(t.chapter).push(t);
    }
  }
  const missables = new Map(
    data.trophies.filter((t) => t.missable).map((t) => [t.id, t]),
  );
  for (let chapter = 0; chapter <= 5; chapter += 1) {
    for (const t of byChapter.get(chapter) ?? []) {
      screens.push({ type: 'beat', chapter, trophy: t });
    }
    for (const [id, afterChapter] of INTERLUDE_PLACEMENT) {
      if (afterChapter === chapter && missables.has(id)) {
        screens.push({ type: 'interlude', chapter, trophy: missables.get(id) });
      }
    }
  }
  return screens;
}

export function loadState(data) {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    const seeded = seedState(data);
    saveState(seeded);
    return seeded;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedState(data);
      saveState(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      chaptersDone: Array.isArray(parsed.chaptersDone) ? parsed.chaptersDone : [],
      bookmark: parsed.bookmark && typeof parsed.bookmark.screen === 'number'
        ? parsed.bookmark
        : { screen: 0 },
      hideSpoilers: parsed.hideSpoilers !== false,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function wipeState() {
  const fresh = emptyState();
  saveState(fresh);
  return fresh;
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'platinum-path-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function importState(file) {
  const parsed = JSON.parse(await file.text());
  const state = {
    earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => typeof n === 'number') : [],
    chaptersDone: Array.isArray(parsed.chaptersDone)
      ? parsed.chaptersDone.filter((n) => typeof n === 'number')
      : [],
    bookmark: parsed.bookmark && typeof parsed.bookmark.screen === 'number'
      ? parsed.bookmark
      : { screen: 0 },
    hideSpoilers: parsed.hideSpoilers !== false,
  };
  saveState(state);
  return state;
}
