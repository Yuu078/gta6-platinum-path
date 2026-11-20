// The Collectibles view: every trophy whose official description states a tracked total gets a
// minus/plus counter stored with the rest of the progress. Reaching the target marks the trophy
// earned automatically; dropping back below it clears the tick again.

export function counterStepFor(trophy) {
  return trophy.count >= 10000 ? 5000 : 1;
}

export function trophiesWithCounters(trophies) {
  return trophies.filter((trophy) => typeof trophy.count === "number" && trophy.count > 0);
}

export function counterPercent(current, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function setCounterValue(context, trophy, value) {
  const { state } = context;
  const clamped = Math.max(0, Math.min(trophy.count, value));
  state.counters[trophy.id] = clamped;
  if (clamped >= trophy.count) state.earnedIds.add(trophy.id);
  else if (state.earnedIds.has(trophy.id) && (state.counters[trophy.id] ?? 0) < trophy.count) state.earnedIds.delete(trophy.id);
  context.saveAndRender();
}

export function renderCountersView(view, context) {
  const { state } = context;
  view.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = "Collectibles and counters — the long hauls, tallied";
  const lede = document.createElement("p");
  lede.className = "view-lede";
  lede.textContent = "One counter for every trophy whose official description states a total. Nudge the tally as you play; when a counter reaches its target the trophy ticks itself. Money counters step in 5,000s.";
  view.append(heading, lede);

  const grid = document.createElement("div");
  grid.className = "counter-grid";
  for (const trophy of trophiesWithCounters(context.trophies)) {
    grid.append(buildCounterCard(trophy, context, state));
  }
  view.append(grid);
}

function buildCounterCard(trophy, context, state) {
  const current = state.counters[trophy.id] ?? 0;
  const percent = counterPercent(current, trophy.count);
  const step = counterStepFor(trophy);
  const card = document.createElement("article");
  card.className = "counter-card";

  const name = document.createElement("h3");
  name.textContent = trophy.name;
  const desc = document.createElement("p");
  desc.className = "counter-desc";
  desc.textContent = trophy.description;
  const readout = document.createElement("p");
  readout.className = "counter-readout";
  readout.textContent = `${current.toLocaleString("en-US")} of ${trophy.count.toLocaleString("en-US")} · ${percent}%${state.earnedIds.has(trophy.id) ? " · Earned" : ""}`;

  const track = document.createElement("div");
  track.className = "progress-track";
  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width = `${percent}%`;
  track.append(fill);

  const buttons = document.createElement("div");
  buttons.className = "counter-buttons";
  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = step > 1 ? `− ${step.toLocaleString("en-US")}` : "− 1";
  minus.addEventListener("click", () => setCounterValue(context, trophy, current - step));
  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = step > 1 ? `+ ${step.toLocaleString("en-US")}` : "+ 1";
  plus.addEventListener("click", () => setCounterValue(context, trophy, current + step));
  buttons.append(minus, plus);

  const source = document.createElement("p");
  source.className = "source-line";
  source.textContent = `Source: ${trophy.source}`;

  card.append(name, desc, readout, track, buttons, source);
  return card;
}
