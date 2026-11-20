# Leonida Platinum Path — GTA VI Trophy Guide, Roadmap & Tracker
[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Yuu078/gta6-platinum-path/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Yuu078/gta6-platinum-path/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Platinum Path is a fully offline, static web app for hunting the Grand Theft Auto VI platinum on PlayStation 5. It has no dependencies and makes no network calls — plain HTML, CSS and ES modules plus a JSON data file, opened straight from `app/`. It covers all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze) with their official PlayStation names, descriptions and grades. What sets it apart from a plain checklist is its roadmap-first angle: every trophy is placed in a five-stage platinum planner, so you always know what to do next, what can wait, and what you could lose for good if you push the story too far.

## What it does

- **5-stage planner** — the roadmap view groups all 55 trophies into five stages, shows per-stage progress bars and an overall completion readout, and keeps a "Next up" panel pointing at the sensible next targets, including a pinned warning when a missable trophy is coming due.
- **Tracker** — the Trophies view lists every trophy with filters by kind (story, activities, collectibles, meta), grade and roadmap stage, plus text search and a hide-earned toggle, so a long session can be narrowed to exactly the trophies still in play.
- **Spoiler protection, on by default** — unearned story trophies are hidden behind the spoiler toggle in the header, so you can plan a run without reading ahead into plot beats you have not reached.
- **Missables view** — a dedicated view for the 5 missable trophies, each with a warning explaining the reason that particular chance can close, alongside its guide and source.
- **Collectible counters** — the Collectibles view gives the 11 counted trophies (the ones with a numeric target, such as stunts) minus/plus counters with progress bars; reaching a counter's target marks that trophy earned automatically.
- **Per-trophy guides** — every trophy carries a written guide in our own words, a numbered list of steps, its kind, stage, difficulty estimate and expected minutes, and a named source shown beside the trophy.
- **Progress that stays yours** — earned trophies and counter values are saved in the browser via `localStorage`, and the header's Export/Import buttons back that progress up or move it between browsers as a single JSON file.

## Run it

Serve the `app/` folder with any static file server. From the repo root:

```sh
node serve.ts
```

then open <http://localhost:8080>. Once the page has loaded it works with the network switched off — there is nothing to install and nothing to build.

## Hand-in check

`MAKEFUN_OUTPUT_DIR=out node main.ts` rebuilds the hand-in dossier in `out/` and first runs the built-in verification in `main.ts`, which prints a PASS line confirming all 55 trophies carry a non-empty guide, at least two steps each, a named source, and a roadmap stage between 1 and 5.

## License

MIT (see LICENSE).
