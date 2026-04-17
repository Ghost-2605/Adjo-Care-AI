import { state } from '../state.js';

export function renderResult(parsed) {
  const meterMap = { fine: 25, moderate: 50, urgent: 75, emergency: 100 };
  const colorMap = { fine: '#639922', moderate: '#EF9F27', urgent: '#BA7517', emergency: '#E24B4A' };
  
  const fill = document.getElementById('meter-fill');
  fill.style.width = meterMap[parsed.dangerLevel] + '%';
  fill.style.background = colorMap[parsed.dangerLevel];
  
  const dt = document.getElementById('danger-text');
  dt.textContent = { fine: 'Fine', moderate: 'Moderate', urgent: 'Urgent', emergency: 'Emergency' }[parsed.dangerLevel] || parsed.dangerLevel;
  dt.className = 'danger-level-text ' + parsed.dangerLevel;

  document.getElementById('ai-text').innerHTML = `
    <div class="ai-block">
      <div class="ai-block-label">Summary</div>
      <div class="ai-block-text">${parsed.summary}</div>
    </div>
    <div class="ai-block">
      <div class="ai-block-label">Recommendation</div>
      <div class="ai-block-text">${parsed.advice}</div>
    </div>
    ${parsed.followUp ? `<div class="ai-block"><div class="ai-block-label">Follow-Up (24–48 hrs)</div><div class="ai-block-text">${parsed.followUp}</div></div>` : ''}
  `;

  const sbd = document.getElementById('score-breakdown-inline');
  if (parsed.scoreBreakdown && parsed.scoreBreakdown.length) {
    sbd.innerHTML = parsed.scoreBreakdown.map(s => `
      <div class="score-bar-item">
        <div class="score-bar-label">${s.label}</div>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${s.value}%;background:${s.color}"></div></div>
        <div class="score-bar-val">${s.value}/100</div>
      </div>
    `).join('');
  }
}

export function renderHealthScore() {
  if (!state.lastResult || !state.lastResult.healthScore) {
    document.getElementById('score-num').textContent = '—';
    document.getElementById('score-num-big').innerHTML = '—<span style="font-size:1rem;color:var(--text3)">/100</span>';
    document.getElementById('score-desc').textContent = 'Complete a symptom analysis to see your score.';
    return;
  }
  const score = Math.min(100, Math.max(0, state.lastResult.healthScore));
  const circ = 2 * Math.PI * 50;
  const offset = circ - (score / 100) * circ;
  
  const scoreEl = document.getElementById('score-ring-fill');
  const color = score >= 70 ? '#1D9E75' : score >= 40 ? '#EF9F27' : '#E24B4A';
  scoreEl.style.stroke = color;
  scoreEl.style.strokeDashoffset = offset;
  
  document.getElementById('score-num').textContent = score;
  document.getElementById('score-num-big').innerHTML = `${score}<span style="font-size:1rem;color:var(--text3)">/100</span>`;
  
  const desc = score >= 80 ? 'Excellent — keep it up!' : score >= 60 ? 'Moderate — monitor your symptoms.' : score >= 40 ? 'Fair — consider seeing a doctor.' : 'Low — seek medical attention soon.';
  document.getElementById('score-desc').textContent = desc;
  
  if (state.historyEntries.length > 1) {
    document.getElementById('score-trend-card').style.display = 'block';
    const recent = state.historyEntries.slice(0, 5).reverse();
    document.getElementById('score-trend').innerHTML = `
      <div style="display:flex;gap:.5rem;align-items:flex-end;height:60px;margin-bottom:.5rem;">
        ${recent.map(e => { 
          const s = e.healthScore || 50; 
          const h = Math.max(8, (s / 100) * 54); 
          const c = s >= 70 ? '#1D9E75' : s >= 40 ? '#EF9F27' : '#E24B4A'; 
          return `<div style="flex:1;background:${c};border-radius:4px 4px 0 0;height:${h}px;opacity:.85;" title="${s}/100"></div>`; 
        }).join('')}
      </div>
      <div style="font-size:.75rem;color:var(--text3);">Last ${recent.length} analyses — newest right</div>`;
  }
}
