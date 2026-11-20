# Platinum Path — a story-first reader for the GTA VI platinum

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/Yuu078/gta6-platinum-path/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/Yuu078/gta6-platinum-path/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

Most trophy guides hand you a spreadsheet and wish you luck. **Platinum Path** hands you a screenplay.

The 55 trophies of Grand Theft Auto VI are arranged the way the game actually tells them: 20 story trophies become beats on a vertical cinematic timeline, in six chapters — Prologue, Chapters 1–4, and The Final Ride. The story text is the main object on the page. There are no trophy cards: each trophy hides inside its beat's paragraph as an inline trigger tag, coloured gold, silver or bronze, and tapping it slides a drawer over the page with the technical work — the guide, the steps, the difficulty, the named source. Every beat is also marked with who carries the scene: Lucia, Jason, or the two of them together. The guides are written in the voice of the scenes themselves — right after this cutscene, before you leave that room — because that is when you actually need them.

Five trophies can be lost for a whole playthrough. They do not hide in a filter: they interrupt the timeline as full-width **POINT OF NO RETURN** cards that tell you to make a manual save and explain exactly why the moment will not come again.

Spoilers are fog. A chapter's beats and trophy names stay blurred until you mark the previous chapter done — or until you lift the fog yourself with the spoiler toggle. There is no global percentage and no "next up" panel anywhere. Progress is told per chapter, in dots, the way a reader actually feels it: this chapter is finished, this one is under way.

When you come back, the **RESUME SCENE** hero at the top remembers your bookmark and drops you back into the exact scene you left. A first visit is seeded mid-story — chapters 0–1 done, chapter 2 under way — so the timeline opens the way a real run feels. Add `?demo=1` to see that seeded state at any time, use "Start fresh — wipe my place" to begin again from a blank page, and export or import your progress as a JSON file whenever you like.

The book closes with **OFF THE SCRIPT**: the other 35 trophies — the hunts, heists, collections and strange little errands that live outside the chapters — as a compact back-of-book index, one row per trophy, searchable and grade-filterable, each row opening the same drawer and checkable as earned.

## The entry

- `app/` — the guide itself: static, offline, no build step, no network requests. Open it with `node serve.ts` and visit http://localhost:8080 (add `?demo=1` for the seeded state).
- `app/data/trophies.json` — all 55 trophies with their canonical names, descriptions and grades, plus a hand-written guide, steps, difficulty, time estimate and a named source for every single one.
- `main.ts` — copies `app/` and `screenshots/` to the output directory, verifies the trophy data read-only, and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — four real renders of the app in its seeded demo state: the cover with its resume scene and the top of the timeline, a timeline beat with its trophy drawer open, a point-of-no-return interlude, and the off-script index.

Run it with:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

A healthy run prints: `PASS: 55 trophies verified — 20 story beats in 6 chapters, 35 off the script, 5 points of no return`
