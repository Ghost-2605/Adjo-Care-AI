export const state = {
  currentLang: 'en',
  currentTheme: 'light',
  selectedDuration: '',
  historyEntries: [],
  lastResult: null,
  selectedRegions: {},
  userApiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  drugList: [],
  vitalsLog: [],
  reminderHospName: '',
  voiceRecognition: null,
  isRecording: false,
  photoBase64: null,
  photoMediaType: null
};

export function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('adjoCare_v3') || '{}');
    if (s.theme) state.currentTheme = s.theme;
    if (s.lang) state.currentLang = s.lang;
    if (s.history) state.historyEntries = s.history;
    if (s.vitals) state.vitalsLog = s.vitals;
    if (s.apiKey) state.userApiKey = s.apiKey; // Override env if user set one locally
  } catch (e) {}
}

export function saveState() {
  try {
    localStorage.setItem('adjoCare_v3', JSON.stringify({
      theme: state.currentTheme,
      lang: state.currentLang,
      history: state.historyEntries,
      vitals: state.vitalsLog,
      apiKey: state.userApiKey
    }));
  } catch (e) {}
}
