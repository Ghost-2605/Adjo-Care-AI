export function renderMedications(meds) {
  if (!meds || !meds.length) return;
  document.getElementById('meds-empty').style.display = 'none';
  document.getElementById('meds-list').style.display = 'block';
  document.getElementById('meds-content').innerHTML = meds.map(m => `
    <div class="med-card">
      <div class="med-icon">${m.icon || '💊'}</div>
      <div class="med-info">
        <div class="med-name">${m.name}</div>
        <div style="font-size:.78rem;color:var(--text2);margin-bottom:.2rem;">${m.purpose}</div>
        <div class="med-dose">📋 ${m.dosage}</div>
        ${m.warning ? `<div class="med-warning">⚠️ ${m.warning}</div>` : ''}
      </div>
    </div>
  `).join('');
}
