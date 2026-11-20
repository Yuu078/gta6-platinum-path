// progress.js — where the reader's place is kept.
// One localStorage key, a seeded first load so the story opens mid-motion,
// and a true wipe for anyone who wants page one again.

export const STORAGE_KEY = 'platinum-path-reader-state-v1';

function blankState() {
  return {
    earned: [],
    read: [],
    doneChapters: [],
    last: null,
    startedFresh: true,
  };
}

// The living, mid-walkthrough seed: prologue and chapter 1 finished,
// chapter 2 under way, bookmark resting on its second scene.
export function seededState(data) {
  const storyIn = (n) => data.trophies.filter((t) => t.chapter === n);
  const early = [...storyIn(0), ...storyIn(1)];
  const ch2 = storyIn(2);
  const earned = new Set(early.map((t) => t.id));
  const read = new Set(early.map((t) => t.id));
  if (ch2[0]) { earned.add(ch2[0].id); read.add(ch2[0].id); }
  if (ch2[1]) read.add(ch2[1].id);
  for (const extra of [16, 21]) earned.add(extra);
  const resumeBeat = ch2[1] || ch2[0] || early[early.length - 1];
  return {
    earned: [...earned],
    read: [...read],
    doneChapters: [0, 1],
    last: resumeBeat ? { chapter: 2, beatId: resumeBeat.id } : null,
    startedFresh: false,
  };
}

export function loadState(data, forceSeed) {
  if (forceSeed) return seededState(data);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seededState(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.earned)) return blankState();
    return parsed;
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode: keep reading anyway */ }
}

export function wipeState() {
  const blank = blankState();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(blank)); } catch { /* ignore */ }
  return blank;
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'platinum-path-my-place.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(file, onDone, onError) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || !Array.isArray(parsed.earned) || !Array.isArray(parsed.read)) throw new Error('shape');
      onDone({
        earned: parsed.earned,
        read: parsed.read,
        doneChapters: Array.isArray(parsed.doneChapters) ? parsed.doneChapters : [],
        last: parsed.last || null,
        startedFresh: false,
      });
    } catch { onError(); }
  };
  reader.onerror = () => onError();
  reader.readAsText(file);
}
