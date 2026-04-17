import { state, loadState, saveState } from './state.js';
import { applyTheme, applyLang, setLang, toggleTheme, toggleSidebar, closeSidebar, showTab, showToast, enterApp, showEmergency, hideEmergency, callEmergency, showPrint, hidePrint, downloadPDF } from './ui.js';
import { toggleRegion, selectDuration, detectLocation, toggleVoice, handlePhotoDrop, handlePhotoSelect, removePhoto, analyzeSymptoms } from './features/symptoms.js';
import { renderHealthScore } from './features/results.js';
import { openReminderModal, closeReminderModal, confirmReminder } from './features/hospitals.js';
import { focusDrugInput, handleDrugInputKey, addDrugFromInput, removeDrug, checkDrugInteractions } from './features/drugs.js';
import { logVitals, renderVitalsLog } from './features/vitals.js';
import { renderHistory, clearHistory } from './features/history.js';
import { setupPWAInstall, installPWA } from './pwa.js';

export function initApp() {
  loadState();

  // Apply state
  if (state.currentTheme) applyTheme(state.currentTheme);
  if (state.currentLang) applyLang(state.currentLang);

  renderHistory();
  renderHealthScore();
  renderVitalsLog();
  renderTips();

  // Setup DOM Events
  setupEvents();

  // Show welcome / modal
  if (!state.userApiKey) {
    document.getElementById('api-modal').classList.remove('hidden');
  } else {
    document.getElementById('welcome').style.display = 'flex';
  }

  // Setup PWA
  setupPWAInstall();
}

function setupEvents() {
  // Sidebar & Layout
  document.getElementById('hamburger-btn')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => showTab(e.currentTarget.dataset.tab, e.currentTarget));
  });

  document.querySelectorAll('.lang-btn').forEach(el => {
    el.addEventListener('click', (e) => setLang(e.currentTarget.dataset.lang));
  });

  // Welcome
  document.getElementById('welcome-cta')?.addEventListener('click', enterApp);
  document.getElementById('welcome-footer-link')?.addEventListener('click', enterApp);

  // Topbar
  document.getElementById('emergency-btn')?.addEventListener('click', showEmergency);
  
  // Overlays
  document.getElementById('call-108-btn')?.addEventListener('click', callEmergency);
  document.getElementById('cancel-emergency-btn')?.addEventListener('click', hideEmergency);
  document.getElementById('download-pdf-btn')?.addEventListener('click', downloadPDF);
  document.getElementById('cancel-print-btn')?.addEventListener('click', hidePrint);
  document.getElementById('show-print-btn')?.addEventListener('click', showPrint);

  // Symptoms
  document.querySelectorAll('.body-region').forEach(el => {
    el.addEventListener('click', e => toggleRegion(e.currentTarget.dataset.id, e.currentTarget.dataset.label));
  });
  
  // Event delegation for dynamically added region remove buttons
  document.getElementById('selected-regions-list')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-remove-region]');
    if (btn) {
      const id = btn.dataset.removeRegion;
      const el = document.getElementById('br-' + id);
      toggleRegion(id, el ? el.dataset.label : id);
    }
  });

  document.querySelectorAll('#duration-chips .chip').forEach(el => {
    el.addEventListener('click', e => selectDuration(e.currentTarget.dataset.val, e.currentTarget));
  });

  document.getElementById('locate-btn')?.addEventListener('click', detectLocation);
  
  const severityInput = document.getElementById('inp-severity');
  if (severityInput) {
    severityInput.addEventListener('input', e => {
      document.getElementById('severity-val').textContent = e.target.value;
    });
  }

  document.getElementById('voice-btn')?.addEventListener('click', toggleVoice);
  document.getElementById('analyze-btn')?.addEventListener('click', analyzeSymptoms);

  // Photo
  const photoDrop = document.getElementById('photo-drop');
  if (photoDrop) {
    photoDrop.addEventListener('click', () => document.getElementById('photo-file').click());
    photoDrop.addEventListener('dragover', e => { e.preventDefault(); photoDrop.classList.add('drag-over'); });
    photoDrop.addEventListener('dragleave', () => photoDrop.classList.remove('drag-over'));
    photoDrop.addEventListener('drop', handlePhotoDrop);
  }
  document.getElementById('photo-file')?.addEventListener('change', e => handlePhotoSelect(e.target));
  document.getElementById('remove-photo-btn')?.addEventListener('click', removePhoto);

  // Vitals
  document.getElementById('log-vitals-btn')?.addEventListener('click', logVitals);

  // Drugs
  const drugArea = document.getElementById('drug-chip-area');
  if (drugArea) {
    drugArea.addEventListener('click', (e) => {
      if (e.target === drugArea || e.target.id === 'drug-placeholder') focusDrugInput();
    });
    // Event delegation for drug remove buttons
    drugArea.addEventListener('click', e => {
      const btn = e.target.closest('.drug-chip-remove');
      if (btn) removeDrug(btn.dataset.drug);
    });
  }
  document.getElementById('drug-text-input')?.addEventListener('keydown', handleDrugInputKey);
  document.getElementById('add-drug-btn')?.addEventListener('click', addDrugFromInput);
  document.getElementById('drug-check-btn')?.addEventListener('click', checkDrugInteractions);

  // Hospitals
  // Event delegation for dynamic hospital buttons
  document.getElementById('hospital-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.remind');
    if (btn) openReminderModal(btn.dataset.remind);
  });
  
  document.getElementById('confirm-reminder-btn')?.addEventListener('click', confirmReminder);
  document.getElementById('cancel-reminder-btn')?.addEventListener('click', closeReminderModal);

  // History
  document.getElementById('clear-history-btn')?.addEventListener('click', clearHistory);

  // API Modal Handling
  document.getElementById('api-save-btn')?.addEventListener('click', saveApiKey);
  document.getElementById('api-skip-btn')?.addEventListener('click', skipApiKey);
  document.getElementById('api-key-eye')?.addEventListener('click', toggleKeyVisibility);

  // PWA Install
  document.getElementById('pwa-install-btn')?.addEventListener('click', installPWA);
}

// Inline API Modal logic because it's only used here
function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) {
    document.getElementById('api-error').textContent = 'Please enter an API Key';
    document.getElementById('api-error').classList.add('show');
    return;
  }
  state.userApiKey = key;
  saveState();
  document.getElementById('api-modal').classList.add('hidden');
  document.getElementById('api-error').classList.remove('show');
  document.getElementById('welcome').style.display = 'flex';
  showToast('✅ API key saved');
}

function skipApiKey() {
  document.getElementById('api-modal').classList.add('hidden');
  document.getElementById('welcome').style.display = 'flex';
}

function toggleKeyVisibility() {
  const i = document.getElementById('api-key-input');
  i.type = i.type === 'password' ? 'text' : 'password';
}

// Static tips
const TIPS = [
  { icon: '💧', title: 'Stay Hydrated', text: 'Drink at least 8 glasses of water daily to support all body functions.' },
  { icon: '🌙', title: 'Quality Sleep', text: 'Aim for 7–9 hours of sleep each night to allow your body to repair.' },
  { icon: '🥦', title: 'Eat Balanced', text: 'Include vegetables, whole grains, and lean proteins in every meal.' },
  { icon: '🚶', title: 'Stay Active', text: '30 minutes of moderate exercise most days reduces chronic disease risk.' },
  { icon: '🧘', title: 'Manage Stress', text: 'Deep breathing, yoga, or meditation can lower cortisol significantly.' },
  { icon: '🩺', title: 'Regular Checkups', text: 'Annual health screenings can catch issues before they become serious.' },
  { icon: '🚭', title: 'Avoid Smoking', text: 'Quitting smoking is the single biggest step toward better lung health.' },
  { icon: '🍷', title: 'Limit Alcohol', text: 'Keeping to recommended limits protects your liver and heart long-term.' },
  { icon: '☀️', title: 'Get Sunlight', text: '15–20 minutes of morning sunlight boosts vitamin D and mood.' },
  { icon: '🫁', title: 'Deep Breathing', text: 'Box breathing exercises can reduce anxiety and lower blood pressure instantly.' }
];

function renderTips() {
  const grid = document.getElementById('tips-grid');
  if(grid) {
    grid.innerHTML = TIPS.map(tp => `
      <div class="tip-card"><div class="tip-icon">${tp.icon}</div><div class="tip-text"><strong>${tp.title}</strong>${tp.text}</div></div>
    `).join('');
  }
}
