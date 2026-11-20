// Platinum Path, a story-first reader for the GTA VI platinum (gta6-trophy-guide-01): the guide is this
// directory's app/ folder, plain static files a browser opens at app/index.html (ES modules, CSS, no build
// step), offline: it loads nothing over the network, and its trophy list and guides are
// app/data/trophies.json. The program hands it in: it copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads (your screenshots, the first load's
// files and bytes, and your source), with the vendored make.fun library. Leave vendor/makefun-frontend.ts
// as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// Read-only verification of the guide's own data, authored for this entry: the reader's promises are only
// worth printing if the data underneath them is whole. This block never writes to app/; it loads
// app/data/trophies.json, checks the shape the design commits to, and either prints the one PASS line or
// throws with the first broken promise it finds.
const guideData = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const allTrophies = guideData.trophies;
if (!Array.isArray(allTrophies) || allTrophies.length !== 55) {
  throw new Error(`expected 55 trophies, found ${Array.isArray(allTrophies) ? allTrophies.length : 'none'}`);
}
for (const trophy of allTrophies) {
  if (typeof trophy.guide !== 'string' || trophy.guide.trim().length === 0) {
    throw new Error(`trophy ${trophy.id} has a blank guide`);
  }
  if (!Array.isArray(trophy.steps) || trophy.steps.length < 2) {
    throw new Error(`trophy ${trophy.id} has fewer than 2 steps`);
  }
  if (typeof trophy.source !== 'string' || trophy.source.trim().length === 0) {
    throw new Error(`trophy ${trophy.id} has no named source`);
  }
}
const storyTrophies = allTrophies.filter((trophy) => typeof trophy.chapter === 'number');
const chaptersCovered = new Set(storyTrophies.map((trophy) => trophy.chapter));
if (storyTrophies.length !== 20 || chaptersCovered.size !== 6) {
  throw new Error(`expected 20 story trophies across 6 chapters, found ${storyTrophies.length} across ${chaptersCovered.size}`);
}
const offscriptTrophies = allTrophies.filter((trophy) => trophy.offscript === true);
if (offscriptTrophies.length !== 35) {
  throw new Error(`expected 35 off-script trophies, found ${offscriptTrophies.length}`);
}
const missableTrophies = allTrophies.filter((trophy) => trophy.missable === true);
if (missableTrophies.length !== 5) {
  throw new Error(`expected 5 missable trophies, found ${missableTrophies.length}`);
}
console.log('PASS: 55 trophies verified — 20 story beats in 6 chapters, 35 off the script, 5 points of no return');
