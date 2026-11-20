// The checklist view: all 55 trophies with their official name, description and grade badge,
// kind chips with counts, grade and stage filters, search, a hide-earned toggle, spoiler
// protection for unearned story trophies, and a detail panel with the cited guide and steps.

import { displayNameFor, isSpoilerHidden } from "./planner.js";

export const KIND_FILTERS = [
  { value: "all", label: "All kinds" },
  { value: "story", label: "Story" },
  { value: "activities", label: "Activities" },
  { value: "collectibles", label: "Collectibles" },
  { value: "meta", label: "Meta" },
  { value: "online", label: "Online" },
  { value: "missable", label: "Missable" },
];

export function countForKindFilter(trophies, value) {
  if (value === "all") return trophies.length;
  if (value === "missable") return trophies.filter((trophy) => trophy.missable).length;
  return trophies.filter((trophy) => trophy.kind === value).length;
}

export function trophyMatchesFilters(trophy, filters) {
  if (filters.kind === "missable" && !trophy.missable) return false;
  if (filters.kind !== "all" && filters.kind !== "missable" && trophy.kind !== filters.kind) return false;
  if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
  if (filters.stage !== "all" && trophy.stage !== Number(filters.stage)) return false;
  if (filters.hideEarned && filters.earnedIds.has(trophy.id)) return false;
  if (filters.search) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

export function renderTrackerView(view, context) {
  const { trophies, state } = context;
  view.replaceChildren();

  const heading = document.createElement("h2");
  heading.textContent = "Trophy checklist — the official 55";
  const lede = document.createElement("p");
  lede.className = "view-lede";
  lede.textContent = "Official names, descriptions and grades, exactly as published. Tick a trophy to save it, select one to read its cited guide, and use the filters to cut the list down.";
  view.append(heading, lede);

  view.append(buildFilterBar(context));

  const layout = document.createElement("div");
  layout.className = "tracker-layout";
  const list = document.createElement("div");
  list.className = "trophy-list";
  const visible = trophies.filter((trophy) => trophyMatchesFilters(trophy, currentFilters(context)));
  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "No trophies match these filters.";
    list.append(empty);
  }
  for (const trophy of visible) list.append(buildTrophyRow(trophy, context));
  layout.append(list);
  layout.append(buildDetailPanel(context));
  view.append(layout);
}

function currentFilters(context) {
  return { ...context.state.filters, earnedIds: context.state.earnedIds };
}

function buildFilterBar(context) {
  const { trophies, state } = context;
  const bar = document.createElement("div");
  bar.className = "filter-bar";

  const chips = document.createElement("div");
  chips.className = "chip-row";
  for (const kind of KIND_FILTERS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = state.filters.kind === kind.value ? "filter-chip is-active" : "filter-chip";
    chip.textContent = `${kind.label} (${countForKindFilter(trophies, kind.value)})`;
    chip.addEventListener("click", () => {
      state.filters.kind = kind.value;
      context.saveAndRender();
    });
    chips.append(chip);
  }
  bar.append(chips);

  const controls = document.createElement("div");
  controls.className = "filter-controls";

  const gradeSelect = document.createElement("select");
  gradeSelect.id = "grade-filter";
  for (const grade of ["all", "platinum", "gold", "silver", "bronze"]) {
    const option = document.createElement("option");
    option.value = grade;
    option.textContent = grade === "all" ? "All grades" : grade;
    gradeSelect.append(option);
  }
  gradeSelect.value = state.filters.grade;
  gradeSelect.addEventListener("change", () => {
    state.filters.grade = gradeSelect.value;
    context.saveAndRender();
  });

  const stageSelect = document.createElement("select");
  stageSelect.id = "stage-filter";
  for (const stage of ["all", "1", "2", "3", "4", "5"]) {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = stage === "all" ? "All stages" : `Stage ${stage}`;
    stageSelect.append(option);
  }
  stageSelect.value = state.filters.stage;
  stageSelect.addEventListener("change", () => {
    state.filters.stage = stageSelect.value;
    context.saveAndRender();
  });

  const search = document.createElement("input");
  search.id = "trophy-search";
  search.type = "search";
  search.placeholder = "Search trophies";
  search.value = state.filters.search;
  search.addEventListener("input", () => {
    state.filters.search = search.value;
    context.saveStateOnly();
    context.renderCurrentViewKeepingFocus("trophy-search");
  });

  const hideLabel = document.createElement("label");
  hideLabel.className = "hide-earned-toggle";
  const hideBox = document.createElement("input");
  hideBox.type = "checkbox";
  hideBox.checked = state.filters.hideEarned;
  hideBox.addEventListener("change", () => {
    state.filters.hideEarned = hideBox.checked;
    context.saveAndRender();
  });
  hideLabel.append(hideBox, document.createTextNode(" Hide earned"));

  const gradeLabel = wrapWithLabel("Grade", gradeSelect);
  const stageLabel = wrapWithLabel("Stage", stageSelect);
  controls.append(gradeLabel, stageLabel, search, hideLabel);
  bar.append(controls);
  return bar;
}

function wrapWithLabel(text, control) {
  const label = document.createElement("label");
  label.className = "filter-label";
  label.append(document.createTextNode(`${text} `), control);
  return label;
}

function buildTrophyRow(trophy, context) {
  const { state } = context;
  const hidden = isSpoilerHidden(trophy, state);
  const row = document.createElement("article");
  row.className = state.selectedTrophyId === trophy.id ? "trophy-row is-selected" : "trophy-row";

  const box = document.createElement("input");
  box.type = "checkbox";
  box.className = "earned-box";
  box.checked = state.earnedIds.has(trophy.id);
  box.setAttribute("aria-label", `Mark ${trophy.name} earned`);
  box.addEventListener("change", () => context.setEarned(trophy.id, box.checked));

  const body = document.createElement("button");
  body.type = "button";
  body.className = "trophy-row-body";
  body.addEventListener("click", () => {
    state.selectedTrophyId = trophy.id;
    context.saveAndRender();
  });
  const name = document.createElement("strong");
  name.className = "trophy-name";
  name.textContent = displayNameFor(trophy, state);
  const desc = document.createElement("span");
  desc.className = "trophy-desc";
  desc.textContent = hidden ? "Spoiler protection is on: earn this story trophy to reveal what it asks for." : trophy.description;
  body.append(name, desc);

  const badge = document.createElement("span");
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = trophy.grade;

  const tags = document.createElement("span");
  tags.className = "trophy-tags";
  tags.textContent = `${trophy.kind} · stage ${trophy.stage}${trophy.missable ? " · MISSABLE" : ""}${trophy.count ? ` · target ${trophy.count}` : ""}`;

  row.append(box, body, badge, tags);
  return row;
}

export function buildDetailPanel(context) {
  const { trophies, state } = context;
  const panel = document.createElement("aside");
  panel.className = "detail-panel";
  const trophy = trophies.find((entry) => entry.id === state.selectedTrophyId) ?? trophies[0];
  if (!trophy) {
    panel.textContent = "Select a trophy to read its guide.";
    return panel;
  }
  const hidden = isSpoilerHidden(trophy, state);

  const badge = document.createElement("p");
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = trophy.grade;
  const title = document.createElement("h3");
  title.textContent = displayNameFor(trophy, state);
  panel.append(badge, title);

  if (hidden) {
    const locked = document.createElement("p");
    locked.className = "spoiler-locked";
    locked.textContent = "Hidden story trophy. Spoiler protection is on, so this trophy's description and guide stay locked until you earn it — or turn spoiler protection off in the header.";
    panel.append(locked);
    return panel;
  }

  const official = document.createElement("p");
  official.className = "official-desc";
  official.textContent = trophy.description;
  panel.append(official);

  if (trophy.missable) {
    const warning = document.createElement("div");
    warning.className = "missable-warning";
    const strong = document.createElement("strong");
    strong.textContent = "Missable warning: ";
    warning.append(strong, document.createTextNode(trophy.missableNote ?? "This trophy can be missed."));
    panel.append(warning);
  }

  const guideHeading = document.createElement("h4");
  guideHeading.textContent = "Guide";
  const guide = document.createElement("p");
  guide.textContent = trophy.guide;
  panel.append(guideHeading, guide);

  const stepsHeading = document.createElement("h4");
  stepsHeading.textContent = "Steps";
  const steps = document.createElement("ol");
  steps.className = "step-list";
  for (const step of trophy.steps) {
    const item = document.createElement("li");
    item.textContent = step;
    steps.append(item);
  }
  panel.append(stepsHeading, steps);

  const facts = document.createElement("p");
  facts.className = "detail-facts";
  facts.textContent = `Kind: ${trophy.kind} · Stage ${trophy.stage} · Difficulty ${trophy.difficulty}/5 · About ${trophy.minutes} minutes`;
  panel.append(facts);

  if (trophy.count) {
    const counterNote = document.createElement("p");
    counterNote.className = "counter-note";
    const current = state.counters[trophy.id] ?? 0;
    counterNote.textContent = `Counter: ${current} of ${trophy.count} tracked in the Collectibles view.`;
    panel.append(counterNote);
  }

  const source = document.createElement("p");
  source.className = "source-line";
  source.textContent = `Source: ${trophy.source}`;
  panel.append(source);
  return panel;
}
