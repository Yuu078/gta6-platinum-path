// The roadmap view: five stages in driving order, a progress bar per stage, trophy chips that jump
// straight to a trophy's detail, missable warnings pinned inside the stage where they must be
// earned, and a Next up panel that always points at the earliest unfinished work.

export const ROADMAP_STAGES = [
  { stage: 1, name: "Arrive in Leonida", goal: "Land, learn the state, and sample every activity once.", hours: "About 4 hours" },
  { stage: 2, name: "Build the Crew", goal: "Push the story through Chapter 3 and start the partner and app habits.", hours: "About 6 hours" },
  { stage: 3, name: "Heists and Hustles", goal: "Finish Chapter 4, clear the stranger strands, and make robbery routes routine.", hours: "About 8 hours" },
  { stage: 4, name: "The Statewide Sweep", goal: "Close the story, then sweep Leonida region by region for activities and exploration.", hours: "About 10 hours" },
  { stage: 5, name: "Platinum Cleanup", goal: "Grind the remaining counters, buy the garages, and reach 100 percent.", hours: "About 8 hours" },
];

export function trophiesInStage(trophies, stage) {
  return trophies.filter((trophy) => trophy.stage === stage);
}

export function stageProgressPercent(trophies, earnedIds, stage) {
  const inStage = trophiesInStage(trophies, stage);
  if (inStage.length === 0) return 100;
  const done = inStage.filter((trophy) => earnedIds.has(trophy.id)).length;
  return Math.round((done / inStage.length) * 100);
}

export function nextUpTrophies(trophies, earnedIds, limit = 3) {
  const picks = [];
  for (const stageInfo of ROADMAP_STAGES) {
    for (const trophy of trophiesInStage(trophies, stageInfo.stage)) {
      if (!earnedIds.has(trophy.id)) picks.push(trophy);
      if (picks.length === limit) return picks;
    }
  }
  return picks;
}

export function isSpoilerHidden(trophy, state) {
  return state.spoilersOn && trophy.kind === "story" && !state.earnedIds.has(trophy.id);
}

export function displayNameFor(trophy, state) {
  return isSpoilerHidden(trophy, state) ? "Hidden story trophy" : trophy.name;
}

export function renderPlannerView(view, context) {
  const { trophies, state } = context;
  view.replaceChildren();

  const intro = document.createElement("section");
  intro.className = "planner-intro";
  const heading = document.createElement("h2");
  heading.textContent = "The road to platinum, in five stages";
  const lede = document.createElement("p");
  lede.textContent = "Drive the stages in order. Story first, strands second, the statewide sweep third, and the counters last — missable warnings are pinned inside the stage where the chance is still open.";
  intro.append(heading, lede);
  view.append(intro);

  view.append(buildNextUpPanel(context));

  for (const stageInfo of ROADMAP_STAGES) {
    view.append(buildStageSection(stageInfo, context));
  }
}

function buildNextUpPanel(context) {
  const { state } = context;
  const panel = document.createElement("section");
  panel.className = "next-up-panel";
  const heading = document.createElement("h3");
  heading.textContent = "Next up";
  panel.append(heading);
  const picks = nextUpTrophies(context.trophies, state.earnedIds, 3);
  if (picks.length === 0) {
    const done = document.createElement("p");
    done.textContent = "Every trophy is earned. Leonida Legend status: unlocked.";
    panel.append(done);
    return panel;
  }
  const list = document.createElement("ol");
  list.className = "next-up-list";
  for (const trophy of picks) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "next-up-button";
    button.textContent = `${displayNameFor(trophy, state)} — Stage ${trophy.stage}, ${trophy.grade}`;
    button.addEventListener("click", () => context.openTrophyDetail(trophy.id));
    item.append(button);
    list.append(item);
  }
  panel.append(list);
  return panel;
}

function buildStageSection(stageInfo, context) {
  const { trophies, state } = context;
  const inStage = trophiesInStage(trophies, stageInfo.stage);
  const percent = stageProgressPercent(trophies, state.earnedIds, stageInfo.stage);
  const section = document.createElement("section");
  section.className = "stage-section";

  const head = document.createElement("div");
  head.className = "stage-head";
  const title = document.createElement("h3");
  title.textContent = `Stage ${stageInfo.stage} — ${stageInfo.name}`;
  const hours = document.createElement("span");
  hours.className = "stage-hours";
  hours.textContent = stageInfo.hours;
  head.append(title, hours);

  const goal = document.createElement("p");
  goal.className = "stage-goal";
  goal.textContent = stageInfo.goal;

  const track = document.createElement("div");
  track.className = "progress-track";
  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width = `${percent}%`;
  track.append(fill);
  const barLabel = document.createElement("p");
  barLabel.className = "stage-progress-label";
  const doneCount = inStage.filter((trophy) => state.earnedIds.has(trophy.id)).length;
  barLabel.textContent = `${doneCount} of ${inStage.length} in this stage · ${percent}%`;

  section.append(head, goal, track, barLabel);

  for (const trophy of inStage.filter((entry) => entry.missable)) {
    section.append(buildMissableWarning(trophy, context));
  }

  const chips = document.createElement("div");
  chips.className = "chip-row";
  for (const trophy of inStage) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = state.earnedIds.has(trophy.id) ? "trophy-chip is-earned" : "trophy-chip";
    chip.textContent = `${state.earnedIds.has(trophy.id) ? "✓ " : ""}${displayNameFor(trophy, state)}`;
    chip.addEventListener("click", () => context.openTrophyDetail(trophy.id));
    chips.append(chip);
  }
  section.append(chips);
  return section;
}

export function buildMissableWarning(trophy, context) {
  const box = document.createElement("aside");
  box.className = "missable-warning";
  const title = document.createElement("strong");
  title.textContent = `Missable — ${trophy.name}: `;
  const note = document.createElement("span");
  note.textContent = trophy.missableNote ?? "This chance can pass. Earn it in this stage.";
  const jump = document.createElement("button");
  jump.type = "button";
  jump.className = "warning-jump";
  jump.textContent = "Open guide";
  jump.addEventListener("click", () => context.openTrophyDetail(trophy.id));
  box.append(title, note, jump);
  return box;
}

export function renderMissablesView(view, context) {
  const { trophies, state } = context;
  view.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = "Missables — do not drive past these";
  const lede = document.createElement("p");
  lede.className = "view-lede";
  lede.textContent = "Every trophy flagged missable from its official description, in roadmap order. Each warning says why the chance can close, and the guide says when to take it.";
  view.append(heading, lede);
  const missables = trophies.filter((trophy) => trophy.missable);
  if (missables.length === 0) {
    const none = document.createElement("p");
    none.textContent = "No missable trophies are flagged in this list.";
    view.append(none);
    return;
  }
  for (const trophy of missables) {
    const card = document.createElement("article");
    card.className = "missable-card";
    card.append(buildMissableWarning(trophy, context));
    const meta = document.createElement("p");
    meta.className = "missable-meta";
    meta.textContent = `Stage ${trophy.stage} · ${trophy.grade} · ${state.earnedIds.has(trophy.id) ? "Earned — safe." : "Not yet earned."}`;
    const desc = document.createElement("p");
    desc.textContent = trophy.description;
    const guide = document.createElement("p");
    guide.textContent = trophy.guide;
    const source = document.createElement("p");
    source.className = "source-line";
    source.textContent = `Source: ${trophy.source}`;
    card.append(meta, desc, guide, source);
    view.append(card);
  }
}
