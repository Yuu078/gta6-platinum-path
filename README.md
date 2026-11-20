# Platinum Path — A Story-First GTA VI Trophy Walkthrough

Most trophy guides hand you a spreadsheet and wish you luck. Platinum Path hands you a story.

The walkthrough follows Leonida the way the game tells it: a Prologue, four chapters, and
The Final Ride. You read it one scene at a time — a single story beat per screen, turned
like pages with buttons, arrow keys, or a swipe. Each scene names the trophy the story is
about to hand you, explains it in plain words, and lists the steps, the source, and
occasionally a set-side tip earned the hard way.

## How it protects you from spoilers

Chapter titles are always visible, but a chapter's scenes and trophy names stay under fog
until you mark the previous chapter done. Nothing is revealed before the story itself
would reveal it. And when a scene can only ever be played once, the reader stops you one
page earlier with a full **Point of No Return** interlude: make a manual save, read the
reason, then turn the page when you are ready.

## Off The Script

Not everything belongs to a chapter. Collectibles, activities, stunt counts, vault jobs,
strange nights, the 100% completion marathon and the platinum itself live in a closing
section called **Off The Script**, after the story, with its own search and grade filter.

## Your place in the story

A **Resume Scene** bookmark at the top always shows where you left the story and drops you
back into the reader at that exact scene. Progress is kept per chapter only — a row of
marks under each chapter, one per scene, filled as you read and earn. There is deliberately
no global percentage anywhere: stories are finished, not filled.

First visit? The guide opens mid-walkthrough on purpose — the Prologue and Chapter 1 are
done, Chapter 2 is under way — so you can see it alive. Use **Start fresh** in the ledger
to wipe it to a truly empty page one. Your place can also be exported and imported as a
small JSON file. Everything is stored only in your browser.

## Running it

Serve the app locally:

```
node serve.ts            # then open the printed local address, port 8080 by default
node serve.ts --port 8123
```

Build the submission dossier:

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The build first verifies the guide data — 55 trophies, each with exactly one home
(a story chapter, or Off The Script), no empty chapters — and prints a one-line PASS
summary before writing anything.

## Data and sources

Trophy names, descriptions and grades are the official PlayStation 5 list of 55 trophies
for Grand Theft Auto VI (list dated 2026-11-18). Every scene guide, step list and tip is
original writing for this guide. Each trophy credits one reference source by name —
rotating among PowerPyx, PSNProfiles, PlayStationTrophies.org, TrueTrophies, Exophase,
the GTA Wiki (Fandom) and Push Square. The app is fully offline: system fonts only, no
external requests, the only file it loads is its own `app/data/trophies.json`.

## The competition

[![Competition badge](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Rank badge](https://make.fun/badge/gta6-trophy-guide-01/Yuu078/gta6-platinum-path/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Reward badge](https://make.fun/badge/gta6-trophy-guide-01/Yuu078/gta6-platinum-path/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

Built for the make.fun competition `gta6-trophy-guide-01`.
