import { state, saveState } from '../state.js';

export function addToHistory(result) {
  state.historyEntries.unshift(result);
  renderHistory();
  saveState();
}

export function clearHistory() {
  if (!confirm('Clear all history entries?')) return;
  state.historyEntries = [];
  renderHistory();
  saveState();
}

export function renderHistory() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  
  if (!state.historyEntries.length) {
    empty.style.display = 'flex';
    list.innerHTML = '';
    return;
  }
  
  empty.style.display = 'none';
  list.innerHTML = state.historyEntries.map((e, i) => {
    const d = new Date(e.timestamp);
    const ds = d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const ss = e.symptoms.length > 100 ? e.symptoms.substring(0, 100) + '…' : e.symptoms;
    const dangerLabel = { fine: 'Fine', moderate: 'Moderate', urgent: 'Urgent', emergency: 'Emergency' };
    
    return `
    <div class="history-card" style="animation-delay:${i * 0.05}s">
      <div class="history-top">
        <div class="history-name">${e.name}, ${e.age} yrs</div>
        <div class="history-date">${ds}</div>
      </div>
      <div class="history-symptoms">${ss}</div>
      <div class="history-meta">
        <div class="history-duration">${e.duration || '—'} · ${e.location}${e.regions && e.regions !== 'Not specified' ? ' · ' + e.regions : ''}</div>
        <div class="danger-pill ${e.dangerLevel}"><div class="pill-dot"></div>${dangerLabel[e.dangerLevel] || e.dangerLevel}</div>
      </div>
    </div>`;
  }).join('');
}
