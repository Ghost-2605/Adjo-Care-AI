import { state } from '../state.js';
import { callGroq } from '../api.js';
import { showToast } from '../ui.js';

export function focusDrugInput() {
  document.getElementById('drug-text-input').focus();
}

export function handleDrugInputKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addDrugFromInput();
  }
}

export function addDrugFromInput() {
  const inp = document.getElementById('drug-text-input');
  const val = inp.value.trim();
  if (!val) return;
  addDrug(val);
  inp.value = '';
}

function addDrug(name) {
  if (state.drugList.includes(name)) return;
  state.drugList.push(name);
  renderDrugChips();
}

export function removeDrug(name) {
  state.drugList = state.drugList.filter(d => d !== name);
  renderDrugChips();
  document.getElementById('drug-result').style.display = 'none';
}

function renderDrugChips() {
  const area = document.getElementById('drug-chip-area');
  const ph = document.getElementById('drug-placeholder');
  ph.style.display = state.drugList.length ? 'none' : 'inline';
  
  const chips = area.querySelectorAll('.drug-chip');
  chips.forEach(c => c.remove());
  
  state.drugList.forEach(d => {
    const chip = document.createElement('div');
    chip.className = 'drug-chip';
    chip.innerHTML = `${d}<button class="drug-chip-remove" data-drug="${d}">✕</button>`;
    area.insertBefore(chip, ph);
  });
}

export async function checkDrugInteractions() {
  if (!state.userApiKey) {
    showToast('⚠️ Please add your Groq API key first');
    document.getElementById('api-modal').classList.remove('hidden');
    return;
  }
  if (state.drugList.length < 2) {
    showToast('Add at least 2 medications to check');
    return;
  }
  
  const btn = document.getElementById('drug-check-btn');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  
  const prompt = `You are a clinical pharmacist. Check drug interactions for: ${state.drugList.join(', ')}
Respond ONLY in this JSON format, no markdown:
{"severity":"none|mild|moderate|severe","summary":"2-3 sentences about interactions found","details":"specific interaction details","recommendation":"what patient should do"}

CRITICAL INSTRUCTION: You must translate ALL of your response strings (summary, details, recommendation) into natural ${state.currentLang === 'hi' ? 'Hindi' : state.currentLang === 'kn' ? 'Kannada' : 'English'}. However, you MUST keep the JSON keys EXACTLY in English.`;
  
  try {
    const raw = await callGroq(prompt);
    let cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    const colorMap = { none: 'fine', mild: 'warn', moderate: 'warn', severe: 'danger' };
    const cls = colorMap[parsed.severity] || 'warn';
    
    document.getElementById('drug-result').style.display = 'block';
    document.getElementById('drug-result-content').className = 'drug-interaction-result ' + cls;
    document.getElementById('drug-result-content').innerHTML = `<strong>${parsed.severity.toUpperCase()} INTERACTION</strong><br><br>${parsed.summary}<br><br><strong>Details:</strong> ${parsed.details}<br><br><strong>Recommendation:</strong> ${parsed.recommendation}`;
  } catch (e) {
    showToast('❌ Check failed. Try again.');
    console.error(e);
  }
  btn.disabled = false;
  btn.textContent = 'Check Interactions';
}
