import './css/main.css';

import sidebarHtml from './partials/sidebar.html?raw';
import topbarHtml from './partials/topbar.html?raw';
import modalsHtml from './partials/modals.html?raw';
import checkHtml from './partials/panels/symptom-check.html?raw';
import analysisHtml from './partials/panels/ai-analysis.html?raw';
import hospitalsHtml from './partials/panels/hospitals.html?raw';
import medicationsHtml from './partials/panels/medications.html?raw';
import drugsHtml from './partials/panels/drug-checker.html?raw';
import vitalsHtml from './partials/panels/vitals.html?raw';
import scoreHtml from './partials/panels/health-score.html?raw';
import historyHtml from './partials/panels/history.html?raw';
import tipsHtml from './partials/panels/health-tips.html?raw';

// Assemble DOM
document.getElementById('app-root').innerHTML = `
  ${modalsHtml}
  <div class="app" id="app">
    ${sidebarHtml}
    <div class="main">
      ${topbarHtml}
      <div class="panels">
        ${checkHtml}
        ${analysisHtml}
        ${hospitalsHtml}
        ${medicationsHtml}
        ${drugsHtml}
        ${vitalsHtml}
        ${scoreHtml}
        ${historyHtml}
        ${tipsHtml}
      </div>
    </div>
  </div>
`;

// Initialize Application Logic
import { initApp } from './js/init.js';
initApp();
