// Leonida Platinum Path — wiring. Loads the trophy data, owns the saved state (earned set,
// counters, filters, spoiler setting, selected trophy, active tab) in localStorage, renders the
// active view, and handles export / import of the whole progress file.

import { renderMissablesView, renderPlannerView } from "./planner.js";
import { renderTrackerView } from "./tracker.js";
import { renderCountersView } from "./counters.js";

export const STORAGE_KEY = "leonida-platinum-path-v1";

export function createDefaultState() {
  return {
    earnedIds: new Set(),
    counters: {},
    spoilersOn: true,
    selectedTrophyId: 17,
    activeTab: "planner",
    filters: { kind: "all", grade: "all", stage: "all", search: "", hideEarned: false },
  };
}

export function loadSavedState() {
  const state = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earnedIds = new Set(saved.earned);
    if (saved.counters && typeof saved.counters === "object") state.counters = saved.counters;
    if (typeof saved.spoilersOn === "boolean") state.spoilersOn = saved.spoilersOn;
    if (typeof saved.selectedTrophyId === "number") state.selectedTrophyId = saved.selectedTrophyId;
    if (typeof saved.activeTab === "string") state.activeTab = saved.activeTab;
    if (saved.filters) Object.assign(state.filters, saved.filters);
  } catch {
    return createDefaultState();
  }
  return state;
}

export function serializeState(state) {
  return {
    earned: [...state.earnedIds],
    counters: state.counters,
    spoilersOn: state.spoilersOn,
    selectedTrophyId: state.selectedTrophyId,
    activeTab: state.activeTab,
    filters: state.filters,
  };
}

const viewElement = document.getElementById("view");
const progressElement = document.getElementById("overall-progress");
const barElement = document.getElementById("overall-bar");
const spoilerToggle = document.getElementById("spoiler-toggle");
const state = loadSavedState();
let trophies = [];

export function saveStateOnly() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state)));
}

export function formatProgressSummary(earnedCount, total) {
  const percent = total === 0 ? 0 : Math.round((earnedCount / total) * 100);
  return { text: `${earnedCount} of ${total} · ${percent}%`, percent };
}

export function updateOverallProgress() {
  const total = trophies.length || 55;
  const summary = formatProgressSummary(state.earnedIds.size, total);
  progressElement.textContent = summary.text;
  barElement.style.width = `${summary.percent}%`;
}

export function renderCurrentView() {
  updateOverallProgress();
  for (const button of document.querySelectorAll(".tab-button")) {
    button.classList.toggle("is-active", button.dataset.tab === state.activeTab);
  }
  const context = buildViewContext();
  if (state.activeTab === "trophies") renderTrackerView(viewElement, context);
  else if (state.activeTab === "missables") renderMissablesView(viewElement, context);
  else if (state.activeTab === "collectibles") renderCountersView(viewElement, context);
  else renderPlannerView(viewElement, context);
}

export function renderCurrentViewKeepingFocus(elementId) {
  renderCurrentView();
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
    if (typeof element.setSelectionRange === "function") {
      const end = element.value.length;
      element.setSelectionRange(end, end);
    }
  }
}

function buildViewContext() {
  return {
    trophies,
    state,
    saveStateOnly,
    saveAndRender() {
      saveStateOnly();
      renderCurrentView();
    },
    renderCurrentViewKeepingFocus,
    setEarned(trophyId, earned) {
      if (earned) state.earnedIds.add(trophyId);
      else state.earnedIds.delete(trophyId);
      saveStateOnly();
      renderCurrentView();
    },
    openTrophyDetail(trophyId) {
      state.selectedTrophyId = trophyId;
      state.activeTab = "trophies";
      saveStateOnly();
      renderCurrentView();
    },
  };
}

export function exportProgressFile() {
  const blob = new Blob([JSON.stringify(serializeState(state), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "leonida-platinum-path-progress.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function importProgressFile(file) {
  const parsed = JSON.parse(await file.text());
  const fresh = createDefaultState();
  if (Array.isArray(parsed.earned)) fresh.earnedIds = new Set(parsed.earned);
  if (parsed.counters) fresh.counters = parsed.counters;
  if (typeof parsed.spoilersOn === "boolean") fresh.spoilersOn = parsed.spoilersOn;
  state.earnedIds = fresh.earnedIds;
  state.counters = fresh.counters;
  state.spoilersOn = fresh.spoilersOn;
  spoilerToggle.checked = state.spoilersOn;
  saveStateOnly();
  renderCurrentView();
}

function wireHeaderControls() {
  spoilerToggle.checked = state.spoilersOn;
  spoilerToggle.addEventListener("change", () => {
    state.spoilersOn = spoilerToggle.checked;
    saveStateOnly();
    renderCurrentView();
  });
  document.getElementById("export-progress").addEventListener("click", exportProgressFile);
  document.getElementById("import-progress").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) await importProgressFile(file);
  });
  for (const button of document.querySelectorAll(".tab-button")) {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      saveStateOnly();
      renderCurrentView();
    });
  }
}

async function loadTrophiesAndStart() {
  const response = await fetch("data/trophies.json");
  const data = await response.json();
  trophies = data.trophies;
  wireHeaderControls();
  renderCurrentView();
}

loadTrophiesAndStart();
