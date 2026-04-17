import { state, saveState } from '../state.js';
import { showToast } from '../ui.js';

export function logVitals() {
  const sys = document.getElementById('v-bp-sys').value;
  const dia = document.getElementById('v-bp-dia').value;
  const pulse = document.getElementById('v-pulse').value;
  const temp = document.getElementById('v-temp').value;
  const sugar = document.getElementById('v-sugar').value;
  
  if (!sys && !pulse && !temp && !sugar) {
    showToast('Enter at least one reading');
    return;
  }
  
  state.vitalsLog.unshift({
    timestamp: new Date().toISOString(),
    bp: sys && dia ? `${sys}/${dia}` : '',
    pulse,
    temp,
    sugar
  });
  
  renderVitalsLog();
  saveState();
  showToast('✅ Vitals logged');
  
  ['v-bp-sys', 'v-bp-dia', 'v-pulse', 'v-temp', 'v-sugar'].forEach(id => document.getElementById(id).value = '');
}

export function renderVitalsLog() {
  const el = document.getElementById('vitals-log');
  const empty = document.getElementById('vitals-log-empty');
  
  if (!state.vitalsLog.length) {
    empty.style.display = 'block';
    el.innerHTML = '';
    return;
  }
  
  empty.style.display = 'none';
  el.innerHTML = state.vitalsLog.slice(0, 15).map(v => {
    const d = new Date(v.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const parts = [];
    if (v.bp) parts.push(`BP: <strong>${v.bp}</strong> mmHg`);
    if (v.pulse) parts.push(`Pulse: <strong>${v.pulse}</strong> bpm`);
    if (v.temp) parts.push(`Temp: <strong>${v.temp}°F</strong>`);
    if (v.sugar) parts.push(`Sugar: <strong>${v.sugar}</strong> mg/dL`);
    return `<div class="vital-entry"><span>${parts.join(' · ')}</span><span class="vital-entry-time">${d}</span></div>`;
  }).join('');
}
