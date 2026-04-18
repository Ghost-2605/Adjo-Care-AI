import { state } from '../state.js';
import { showToast, showTab } from '../ui.js';
import { callGroq } from '../api.js';
import { renderResult, renderHealthScore } from './results.js';
import { renderHospitals } from './hospitals.js';
import { renderMedications } from './medications.js';
import { addToHistory } from './history.js';

/* ─── BODY MAP ───────────────────────────────────────────── */
export function toggleRegion(id, label) {
  if (state.selectedRegions[id]) {
    delete state.selectedRegions[id];
    document.getElementById('br-' + id).classList.remove('selected');
  } else {
    state.selectedRegions[id] = label;
    document.getElementById('br-' + id).classList.add('selected');
  }
  const list = document.getElementById('selected-regions-list');
  const keys = Object.keys(state.selectedRegions);
  if (!keys.length) {
    list.innerHTML = '<span style="font-size:.75rem;color:var(--text3);line-height:2;">Tap body areas to mark affected regions…</span>';
    return;
  }
  list.innerHTML = keys.map(k => `
    <div class="region-tag">${state.selectedRegions[k]}
      <button data-remove-region="${k}"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
    </div>`).join('');
}

/* ─── DURATION ───────────────────────────────────────────── */
export function selectDuration(val, btn) {
  state.selectedDuration = val;
  document.querySelectorAll('#duration-chips .chip').forEach(c => c.classList.remove('selected'));
  btn.classList.add('selected');
}

/* ─── LOCATION ───────────────────────────────────────────── */
export function detectLocation() {
  const btn = document.getElementById('locate-btn');
  btn.classList.add('loading');
  navigator.geolocation.getCurrentPosition(async pos => {
    btn.classList.remove('loading');
    const { latitude: lat, longitude: lon } = pos.coords;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await res.json();
      const a = data.address;
      const place = [a.city || a.town || a.village, a.state].filter(Boolean).join(', ');
      document.getElementById('inp-location').value = place || `${lat.toFixed(4)},${lon.toFixed(4)}`;
      document.getElementById('gps-bar').style.display = 'flex';
      document.getElementById('gps-bar-text').textContent = place || 'Location detected';
      document.getElementById('gps-bar-sub').textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      showToast('📍 Location: ' + place);
    } catch (e) {
      document.getElementById('inp-location').value = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      showToast('📍 Coordinates captured');
    }
  }, () => {
    btn.classList.remove('loading');
    showToast('Could not detect location');
  }, { timeout: 10000 });
}

/* ─── VOICE INPUT ────────────────────────────────────────── */
export function toggleVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('Voice input not supported in this browser');
    return;
  }
  if (state.isRecording) {
    state.voiceRecognition && state.voiceRecognition.stop();
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.voiceRecognition = new SR();
  state.voiceRecognition.lang = 'en-IN';
  state.voiceRecognition.continuous = false;
  state.voiceRecognition.interimResults = false;
  
  state.voiceRecognition.onstart = () => {
    state.isRecording = true;
    document.getElementById('voice-btn').classList.add('recording');
    document.getElementById('voice-btn-label').textContent = 'Stop';
  };
  state.voiceRecognition.onresult = e => {
    const txt = e.results[0][0].transcript;
    const ta = document.getElementById('inp-symptoms');
    ta.value = (ta.value + ' ' + txt).trim();
    showToast('🎤 Voice captured');
  };
  state.voiceRecognition.onend = () => {
    state.isRecording = false;
    document.getElementById('voice-btn').classList.remove('recording');
    document.getElementById('voice-btn-label').textContent = 'Voice';
  };
  state.voiceRecognition.start();
}

/* ─── PHOTO UPLOAD ───────────────────────────────────────── */
export function handlePhotoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  processPhotoFile(file);
}
export function handlePhotoDrop(e) {
  e.preventDefault();
  document.getElementById('photo-drop').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  processPhotoFile(file);
}
function processPhotoFile(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const b64 = ev.target.result.split(',')[1];
    state.photoBase64 = b64;
    state.photoMediaType = file.type;
    document.getElementById('photo-preview-img').src = ev.target.result;
    document.getElementById('photo-preview-wrap').style.display = 'block';
    showToast('📷 Photo added');
  };
  reader.readAsDataURL(file);
}
export function removePhoto() {
  state.photoBase64 = null;
  state.photoMediaType = null;
  document.getElementById('photo-preview-wrap').style.display = 'none';
  document.getElementById('photo-file').value = '';
  showToast('Photo removed');
}

/* ─── MAIN ANALYZE ───────────────────────────────────────── */
export async function analyzeSymptoms() {
  if (!state.userApiKey) {
    document.getElementById('api-modal').classList.remove('hidden');
    showToast('⚠️ Please add your Groq API key first');
    return;
  }
  const name = document.getElementById('inp-name').value.trim();
  const age = document.getElementById('inp-age').value.trim();
  const blood = document.getElementById('inp-blood').value;
  const symptoms = document.getElementById('inp-symptoms').value.trim();
  const severity = document.getElementById('inp-severity').value;
  const location = document.getElementById('inp-location').value.trim() || 'Udupi, Karnataka';
  const medHistory = document.getElementById('inp-history').value.trim();
  const regions = Object.values(state.selectedRegions).join(', ') || 'Not specified';

  if (!symptoms) { showToast('⚠️ Please describe your symptoms.'); return; }
  if (!age) { showToast('⚠️ Please enter your age.'); return; }

  showTab('result');
  document.getElementById('result-empty').style.display = 'none';
  document.getElementById('result-loading').style.display = 'flex';
  document.getElementById('result-content').style.display = 'none';
  document.getElementById('analyze-btn').disabled = true;

  const prompt = `You are AdJoCare AI, a compassionate medical symptom analyzer.

Patient info:
- Name: ${name || 'Patient'}, Age: ${age} yrs, Blood Group: ${blood || 'Unknown'}
- Medical history: ${medHistory || 'None'}
- Symptoms: ${symptoms}
- Affected body areas: ${regions}
- Severity: ${severity}/10, Duration: ${state.selectedDuration || 'Not specified'}
- Location: ${location}, India

Respond ONLY in this exact JSON, no markdown, no extra text:
{
  "dangerLevel": "fine|moderate|urgent|emergency",
  "summary": "2-3 compassionate sentences about what the symptoms may suggest",
  "advice": "2-3 clear actionable medical advice sentences",
  "followUp": "Brief follow-up check guidance for 24-48 hours",
  "healthScore": 72,
  "scoreBreakdown": [
    {"label":"Symptom Severity","value":65,"color":"#EF9F27"},
    {"label":"Risk Level","value":80,"color":"#1D9E75"},
    {"label":"Recovery Outlook","value":75,"color":"#639922"},
    {"label":"Urgency Score","value":70,"color":"#BA7517"}
  ],
  "medications": [
    {"name":"Paracetamol 500mg","purpose":"For fever and pain relief","dosage":"1 tablet every 6 hours, max 4/day","warning":"Avoid if liver disease","icon":"💊"}
  ],
  "hospitals": [
    {"name":"Actual Hospital Name","distance":"2.3 km","speciality":"General Medicine","phone":"0820-XXXXXX","mapQuery":"Hospital Name ${location}","doctorName":"Dr. FirstName LastName","doctorQual":"MBBS, MD","doctorSpeciality":"Relevant speciality"}
  ]
}

dangerLevel: fine=minor/home care, moderate=see doctor soon, urgent=see doctor today, emergency=ER immediately.
healthScore: 0-100 wellness score (higher=better).
medications: suggest 2-4 appropriate OTC medications for the symptoms.
hospitals: suggest real hospitals near ${location}, India with realistic doctor profiles matching the condition.

CRITICAL INSTRUCTION: You must translate ALL of your response strings (summary, advice, followUp, warnings, etc.) into natural ${state.currentLang === 'hi' ? 'Hindi' : state.currentLang === 'kn' ? 'Kannada' : 'English'}. However, you MUST keep the JSON keys EXACTLY in English.`;

  try {
    const raw = await callGroq(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    state.lastResult = {
      name: name || 'Patient', age, blood, location, medHistory,
      symptoms, severity, duration: state.selectedDuration, regions,
      dangerLevel: parsed.dangerLevel, summary: parsed.summary,
      advice: parsed.advice, followUp: parsed.followUp,
      hospitals: parsed.hospitals, medications: parsed.medications,
      healthScore: parsed.healthScore || 70,
      scoreBreakdown: parsed.scoreBreakdown || [],
      timestamp: new Date().toISOString()
    };

    renderResult(parsed);
    renderHospitals(parsed.hospitals, location);
    renderMedications(parsed.medications);
    addToHistory(state.lastResult);
    renderHealthScore();

    document.getElementById('result-loading').style.display = 'none';
    document.getElementById('result-content').style.display = 'block';
    showToast('✅ Analysis complete!');
  } catch (err) {
    document.getElementById('result-empty').style.display = 'flex';
    let msg = 'Analysis failed: ' + err.message;
    document.getElementById('result-empty').querySelector('p').textContent = msg;
    showToast('❌ Error: ' + err.message);
    console.error(err);
  }
  document.getElementById('analyze-btn').disabled = false;
}
