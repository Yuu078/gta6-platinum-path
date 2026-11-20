// offscript.js — OFF THE SCRIPT: everything that never belonged to a chapter.
// Collectibles, activities, free-roam feats, the 100 percent marathon and the
// platinum itself live back here, after the story, with their own search.

export function renderOffScript({ container, data, state, onChange }) {
  const items = data.trophies.filter((t) => t.offscript === true);
  let query = '';
  let grade = 'all';

  function visible() {
    return items.filter((t) => {
      if (grade !== 'all' && t.grade !== grade) return false;
      if (query && !(t.name + ' ' + t.description + ' ' + t.beat).toLowerCase().includes(query)) return false;
      return true;
    });
  }

  function draw() {
    const list = visible();
    container.innerHTML = `
      <h2>Off The Script</h2>
      <p class="os-intro">The story ends, but Leonida does not. Everything on this page was never
      a scene in anyone's chapter — stunt counts, card decks, vaults, strange nights and the two
      big finishers. Work it in any order, at any hour, once the credits have rolled.</p>
      <div class="os-controls">
        <input type="search" id="os-search" placeholder="Search the back pages…" value="${query.replace(/"/g, '&quot;')}">
        <select id="os-grade">
          <option value="all" ${grade === 'all' ? 'selected' : ''}>Every grade</option>
          <option value="platinum" ${grade === 'platinum' ? 'selected' : ''}>Platinum</option>
          <option value="gold" ${grade === 'gold' ? 'selected' : ''}>Gold</option>
          <option value="silver" ${grade === 'silver' ? 'selected' : ''}>Silver</option>
          <option value="bronze" ${grade === 'bronze' ? 'selected' : ''}>Bronze</option>
        </select>
      </div>
      <div id="os-list">
        ${list.length === 0 ? '<p class="empty-note">Nothing in the back pages matches that. Loosen the filters and look again.</p>' : list.map(card).join('')}
      </div>`;
    const search = container.querySelector('#os-search');
    search.addEventListener('input', () => {
      query = search.value.trim().toLowerCase();
      const pos = search.selectionStart;
      draw();
      const again = container.querySelector('#os-search');
      again.focus();
      again.setSelectionRange(pos, pos);
    });
    container.querySelector('#os-grade').addEventListener('change', (ev) => { grade = ev.target.value; draw(); });
    container.querySelectorAll('[data-os-earn]').forEach((box) => {
      box.addEventListener('change', () => {
        const id = Number(box.dataset.osEarn);
        if (box.checked && !state.earned.includes(id)) state.earned.push(id);
        if (!box.checked) state.earned = state.earned.filter((x) => x !== id);
        onChange(false);
      });
    });
  }

  function card(t) {
    const earned = state.earned.includes(t.id);
    return `
      <article class="os-card">
        <span class="grade-chip grade-${t.grade}">${t.grade}</span>
        <h4>${t.name}</h4>
        <p class="official">${t.description}</p>
        <p class="guide">${t.guide}</p>
        ${t.tip ? `<p class="tip"><strong>Set-side tip:</strong> ${t.tip}</p>` : ''}
        <ol class="steps">${t.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        ${t.missable ? `<p class="warn">Before you wander here: ${t.missable}</p>` : ''}
        <p class="source">Source: ${t.source}</p>
        <label class="earn-row"><input type="checkbox" data-os-earn="${t.id}" ${earned ? 'checked' : ''}> I earned this one</label>
      </article>`;
  }

  draw();
  return { redraw: draw };
}
