import { supabase } from './supabase.js';
import { state, saveState, loadState } from './state.js';
import { showToast } from './ui.js';

export function openAuthModal() {
  if (state.user) {
    if (confirm('Do you want to sign out?')) {
      signOut();
    }
  } else {
    document.getElementById('auth-modal').classList.remove('hidden');
  }
}

export function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

export async function signUp() {
  if (!supabase) return showToast('Supabase not configured');
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById('auth-error').textContent = error.message;
  } else {
    showToast('Check your email for confirmation!');
    closeAuthModal();
  }
}

export async function signIn() {
  if (!supabase) return showToast('Supabase not configured');
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('auth-error').textContent = error.message;
  } else {
    state.user = data.user;
    showToast('Welcome back!');
    updateAuthUI();
    await loadState(); // Reload to get cloud data
    closeAuthModal();
  }
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  state.user = null;
  updateAuthUI();
  showToast('Signed out');
}

export function updateAuthUI() {
  const btnText = document.getElementById('auth-btn-text');
  const userLabel = document.getElementById('auth-user-label');
  if (state.user) {
    btnText.textContent = 'Sign Out';
    userLabel.textContent = state.user.email.split('@')[0];
  } else {
    btnText.textContent = 'Sign In';
    userLabel.textContent = 'Cloud Sync';
  }
}
