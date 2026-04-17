import { state } from '../state.js';
import { showToast } from '../ui.js';

export function renderHospitals(hospitals, location) {
  if (!hospitals || !hospitals.length) return;
  const container = document.getElementById('hospital-list');
  const empty = document.getElementById('hospital-empty');
  container.style.display = 'block';
  empty.style.display = 'none';

  const hospitalImgs = [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80',
    'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&q=80'
  ];

  container.innerHTML = hospitals.map((h, i) => {
    const imgUrl = hospitalImgs[i % hospitalImgs.length];
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(h.mapQuery || h.name + ' ' + location)}`;
    const initials = (h.doctorName || 'Dr').split(' ').filter((_, i) => i > 0).map(w => w[0]).join('').slice(0, 2) || 'DR';
    
    return `
    <div class="hospital-card" style="animation-delay:${i * 0.1}s">
      <div class="hosp-img-wrap">
        <img src="${imgUrl}" alt="${h.name}" loading="lazy"/>
        <div class="hosp-img-tag">${h.distance}</div>
      </div>
      <div class="hosp-body">
        <div class="hosp-top-row">
          <div class="hosp-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="7" width="12" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M6 16v-4h6v4M9 3v4M7 5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </div>
          <div class="hosp-info">
            <div class="hosp-name">${h.name}</div>
            <div class="hosp-detail">${h.speciality}</div>
          </div>
          <div class="hosp-right">
            <div class="hosp-dist ${parseFloat(h.distance) > 5 ? 'far' : ''}">${h.distance}</div>
            <div class="hosp-phone">${h.phone}</div>
          </div>
        </div>
        ${h.doctorName ? `
        <div class="hosp-doctor">
          <div class="doctor-avatar">${initials}</div>
          <div>
            <div class="doctor-name">Recommended: ${h.doctorName}</div>
            <div class="doctor-qual">${h.doctorQual || ''} · ${h.doctorSpeciality || ''}</div>
          </div>
        </div>` : ''}
      </div>
      <div class="hosp-actions">
        <a class="hosp-action-btn" href="${mapsUrl}" target="_blank">Directions</a>
        <a class="hosp-action-btn call" href="tel:${h.phone.replace(/[^0-9+]/g, '')}">Call</a>
        <button class="hosp-action-btn remind" data-remind="${h.name}">Remind Me</button>
      </div>
    </div>`;
  }).join('');
}

export function openReminderModal(hospName) {
  state.reminderHospName = hospName;
  document.getElementById('reminder-hosp-name').textContent = hospName;
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  document.getElementById('reminder-time').value = now.toISOString().slice(0, 16);
  document.getElementById('reminder-modal').classList.add('show');
}

export function closeReminderModal() {
  document.getElementById('reminder-modal').classList.remove('show');
}

export function confirmReminder() {
  const timeVal = document.getElementById('reminder-time').value;
  if (!timeVal) { showToast('Please select a time'); return; }
  
  const reminderDate = new Date(timeVal);
  const delay = reminderDate - Date.now();
  
  if (delay > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('AdJoCare Reminder', { body: `Time to visit ${state.reminderHospName}` });
      } else {
        showToast(`🏥 Reminder: Visit ${state.reminderHospName}`);
      }
    }, delay);
    if (Notification.permission === 'default') Notification.requestPermission();
    showToast(`⏰ Reminder set for ${reminderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  } else {
    showToast('Please select a future time');
    return;
  }
  closeReminderModal();
}
