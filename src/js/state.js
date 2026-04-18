import { supabase } from './supabase.js';

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
  photoMediaType: null,
  user: null // Will store Supabase user session
};

export async function loadState() {
  // 1. Load from LocalStorage first (for speed/offline)
  try {
    const s = JSON.parse(localStorage.getItem('adjoCare_v3') || '{}');
    if (s.theme) state.currentTheme = s.theme;
    if (s.lang) state.currentLang = s.lang;
    if (s.history) state.historyEntries = s.history;
    if (s.vitals) state.vitalsLog = s.vitals;
    if (s.apiKey) state.userApiKey = s.apiKey;
  } catch (e) {}

  // 2. Try to load from Supabase if user is logged in
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      state.user = session.user;
      await loadFromCloud();
    }
  }
}

export async function saveState() {
  // 1. Always save to LocalStorage
  try {
    localStorage.setItem('adjoCare_v3', JSON.stringify({
      theme: state.currentTheme,
      lang: state.currentLang,
      history: state.historyEntries,
      vitals: state.vitalsLog,
      apiKey: state.userApiKey
    }));
  } catch (e) {}

  // 2. Save to Cloud if logged in
  if (supabase && state.user) {
    await syncToCloud();
  }
}

async function syncToCloud() {
  if (!supabase || !state.user) return;
  
  // Upsert user data to a 'user_profiles' table or similar
  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: state.user.id, 
      history: state.historyEntries, 
      vitals: state.vitalsLog,
      updated_at: new Date()
    });
    
  if (error) console.error('Cloud Sync Error:', error.message);
}

async function loadFromCloud() {
  if (!supabase || !state.user) return;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('history, vitals')
    .eq('id', state.user.id)
    .single();
    
  if (data && !error) {
    state.historyEntries = data.history || [];
    state.vitalsLog = data.vitals || [];
    // Could re-render UI here if needed
  }
}

