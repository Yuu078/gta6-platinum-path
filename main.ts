// Platinum Path — story-first GTA VI trophy guide: build entrypoint.
// Copies the static app (and any screenshots) into the output folder and
// writes dossier.json with the vendored make.fun library. Before copying,
// it verifies the authored trophy data so a broken guide can never ship.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const CONFIG = {
  textCap: 163840,
  shotMax: 4,
  shotBytes: 262144,
  appFileCap: 993,
  appByteCap: 50331648,
  expectedTrophies: 55,
};

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- authored verification: counts and shapes only, never content dumps ---
function verifyGuide() {
  const raw = readFileSync(join(rootDir, 'app', 'data', 'trophies.json'), 'utf8');
  const data = JSON.parse(raw);
  const trophies = data.trophies;
  const chapters = data.chapters;
  if (!Array.isArray(trophies) || trophies.length !== CONFIG.expectedTrophies) {
    throw new Error('trophy count mismatch');
  }
  const ids = new Set(trophies.map((t) => t.id));
  if (ids.size !== CONFIG.expectedTrophies) throw new Error('duplicate trophy ids');
  for (let i = 1; i <= CONFIG.expectedTrophies; i += 1) {
    if (!ids.has(i)) throw new Error('missing trophy id ' + i);
  }
  const chapterNums = new Set(chapters.map((c) => c.n));
  if (chapters.length !== 6) throw new Error('expected exactly 6 story chapters');
  for (const t of trophies) {
    if (typeof t.guide !== 'string' || t.guide.length < 40) throw new Error('guide too short for id ' + t.id);
    if (!Array.isArray(t.steps) || t.steps.length < 3) throw new Error('steps too few for id ' + t.id);
    if (typeof t.source !== 'string' || t.source.length === 0) throw new Error('source missing for id ' + t.id);
    const inChapter = chapterNums.has(t.chapter);
    const offScript = t.offscript === true && t.chapter === null;
    if (inChapter === offScript) throw new Error('trophy must have exactly one home, id ' + t.id);
  }
  for (const c of chapters) {
    if (!trophies.some((t) => t.chapter === c.n)) throw new Error('empty chapter ' + c.n);
  }
  const storyCount = trophies.filter((t) => chapterNums.has(t.chapter)).length;
  const offCount = trophies.filter((t) => t.offscript === true).length;
  const missableCount = trophies.filter((t) => t.missable).length;
  console.log(`PASS: 55 trophies verified — ${storyCount} story beats in ${chapters.length} chapters, ${offCount} off the script, ${missableCount} points of no return`);
}

verifyGuide();

mkdirSync(outDir, { recursive: true });
cpSync(join(rootDir, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(rootDir, 'screenshots'))) {
  cpSync(join(rootDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: CONFIG.textCap,
    screenshots: { max: CONFIG.shotMax, max_bytes: CONFIG.shotBytes },
    app_max_files: CONFIG.appFileCap,
    app_max_bytes: CONFIG.appByteCap,
  }),
);
