import { state } from '../state.js';
import { callGroq } from '../api.js';
import { showToast } from '../ui.js';

let healthChart = null;

const DISEASE_DATA = {
  'tuberculosis': {
    name: 'Tuberculosis (TB)',
    desc: 'An infectious bacterial disease caused by Mycobacterium tuberculosis, which most commonly affects the lungs. It is spread through the air when people with lung TB cough, sneeze or spit.',
    indicator: 'MDG_0000000020' // TB incidence
  },
  'diabetes': {
    name: 'Diabetes Mellitus',
    desc: 'A chronic, metabolic disease characterized by elevated levels of blood glucose. Over time it leads to serious damage to the heart, blood vessels, eyes, kidneys and nerves.',
    indicator: 'NCD_GLU_00' // High blood glucose
  },
  'malaria': {
    name: 'Malaria',
    desc: 'A life-threatening disease caused by parasites that are transmitted to people through the bites of infected female Anopheles mosquitoes. It is preventable and curable.',
    indicator: 'MALARIA_EST_DEATHS' 
  }
};

export function initFactsUI() {
  const btn = document.getElementById('disease-search-btn');
  const inp = document.getElementById('disease-search-input');
  
  btn?.addEventListener('click', () => handleSearch(inp.value));
  inp?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch(inp.value);
  });
}

async function handleSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return;

  // 1. Loading state
  document.getElementById('disease-info-card').classList.remove('hidden');
  document.getElementById('disease-routine-section')?.classList.add('hidden');
  document.getElementById('disease-name-title').textContent = 'Searching...';
  document.getElementById('disease-description').textContent = 'Fetching data from NLM, WHO, and AI...';

  // 2. Fetch Description (Wikipedia)
  let wikiDesc = '';
  try {
    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      wikiDesc = wikiData.extract;
    }
  } catch (e) {}

  // 3. WHO Data Processing
  let whoData = null;
  const local = DISEASE_DATA[q];
  const indicatorName = local ? local.indicator : null;
  
  try {
    whoData = await fetchWHOData(indicatorName || q);
  } catch (e) {
    console.warn('WHO API failed', e);
  }

  // 4. Update UI with WHO or AI fallback
  if (whoData) {
    document.getElementById('disease-name-title').textContent = whoData.name;
    document.getElementById('disease-description').textContent = wikiDesc || whoData.description || 'No detailed description found.';
    document.getElementById('chart-main-title').textContent = `WHO Statistics: ${whoData.name}`;
    renderHealthFacts(whoData.labels, whoData.values, whoData.name);
    if (state.userApiKey) generateOnlyRoutine(whoData.name);
  } else if (state.userApiKey) {
    // AI Fallback if WHO is too specific or fails
    await handleAIFallback(query, wikiDesc);
  } else {
    document.getElementById('disease-name-title').textContent = query;
    document.getElementById('disease-description').textContent = wikiDesc || 'No information found. Add Groq API key for AI-powered reports.';
    renderHealthFacts();
  }
}

async function generateOnlyRoutine(name) {
  try {
    const prompt = `For the condition "${name}", generate a recommended health routine.
    Respond ONLY in JSON:
    {
      "urgency": "urgent|moderate",
      "routine": [
        {"time": "Morning", "activity": "Activity", "detail": "Instruction"},
        {"time": "Afternoon", "activity": "Activity", "detail": "Instruction"},
        {"time": "Evening", "activity": "Activity", "detail": "Instruction"}
      ],
      "emergencySolutions": ["Temp solution 1", "Temp solution 2", "Temp solution 3"],
      "dailyExercises": ["Exercise 1", "Exercise 2", "Exercise 3"]
    }
    Translate to ${state.currentLang === 'hi' ? 'Hindi' : state.currentLang === 'kn' ? 'Kannada' : 'English'}.`;
    const raw = await callGroq(prompt);
    renderDiseaseRoutine(JSON.parse(raw));
  } catch (e) {}
}

async function fetchWHOData(query) {
  // First, find an indicator if we don't have a code
  let code = query;
  let name = query;

  if (!query.match(/^[A-Z0-9_]+$/)) {
    const searchRes = await fetch(`https://ghoapi.azureedge.net/api/Indicator?$filter=contains(IndicatorName, '${query}')`);
    const searchData = await searchRes.json();
    if (searchData.value && searchData.value.length > 0) {
      code = searchData.value[0].IndicatorCode;
      name = searchData.value[0].IndicatorName;
    } else {
      throw new Error('No WHO indicator found');
    }
  }

  // Now fetch facts for India (SpatialDim eq 'IND')
  const factRes = await fetch(`https://ghoapi.azureedge.net/api/Fact?$filter=IndicatorCode eq '${code}' and SpatialDim eq 'IND'`);
  const factData = await factRes.json();
  
  if (!factData.value || factData.value.length === 0) {
    throw new Error('No stats for India found in WHO GHO');
  }

  // Group by Year and take most recent 5
  const sorted = factData.value.sort((a, b) => b.TimeDim - a.TimeDim).slice(0, 5).reverse();
  return {
    name: name,
    labels: sorted.map(d => d.TimeDim),
    values: sorted.map(d => d.NumericValue),
    description: name // Use indicator name as desc if wiki fails
  };
}

async function handleAIFallback(query, wikiDesc) {
  try {
    const prompt = `Generate a detailed medical overview for "${query}". 
    Respond ONLY in JSON format:
    {
      "name": "Full Disease Name",
      "description": "Clear 2-3 sentence overview",
      "causes": ["List", "of", "causes"],
      "prevention": ["List", "of", "prevention", "tips"],
      "chartData": [
        {"label": "India (Total)", "value": 120000},
        {"label": "Global (Est)", "value": 5000000}
      ],
      "chartTitle": "Estimated Yearly Cases",
      "urgency": "urgent|moderate",
      "routine": [
        {"time": "Morning", "activity": "Activity name", "detail": "Short instruction"},
        {"time": "Afternoon", "activity": "Activity name", "detail": "Short instruction"},
        {"time": "Evening", "activity": "Activity name", "detail": "Short instruction"}
      ],
      "emergencySolutions": ["Temporary solution 1", "Temporary solution 2", "Temporary solution 3"],
      "dailyExercises": ["Daily exercise/routine 1", "Daily exercise/routine 2", "Daily exercise/routine 3"]
    }
    Translate all values to ${state.currentLang === 'hi' ? 'Hindi' : state.currentLang === 'kn' ? 'Kannada' : 'English'}.`;
    
    const raw = await callGroq(prompt);
    const parsed = JSON.parse(raw);

    document.getElementById('disease-name-title').textContent = parsed.name;
    const fullDesc = `
      ${wikiDesc || parsed.description}
      \n\n**Causes:** ${parsed.causes.join(', ')}
      \n**Prevention:** ${parsed.prevention.join(', ')}
    `;
    document.getElementById('disease-description').innerHTML = fullDesc.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    document.getElementById('chart-main-title').textContent = parsed.chartTitle;
    renderHealthFacts(parsed.chartData.map(d => d.label), parsed.chartData.map(d => d.value), parsed.name);
    
    renderDiseaseRoutine(parsed);
  } catch (err) {
    document.getElementById('disease-name-title').textContent = query;
    document.getElementById('disease-description').textContent = wikiDesc || 'No detailed information found.';
    renderHealthFacts();
  }
}

function renderDiseaseRoutine(data) {
  const section = document.getElementById('disease-routine-section');
  const container = document.getElementById('routine-container');
  if (!section || !container) return;

  section.classList.remove('hidden');
  container.innerHTML = data.routine.map(r => `
    <div class="routine-card ${data.urgency === 'urgent' ? 'urgent' : ''}" data-urgency="${data.urgency}">
      <div class="routine-time">${r.time}</div>
      <div class="routine-activity">${r.activity}</div>
      <div class="routine-detail">${r.detail}</div>
    </div>
  `).join('');

  // Add click listeners to cards
  container.querySelectorAll('.routine-card').forEach(card => {
    card.addEventListener('click', () => {
      showRoutineDetails(data);
    });
  });
}

function showRoutineDetails(data) {
  const popover = document.getElementById('routine-popover');
  const title = document.getElementById('popover-title');
  const content = document.getElementById('popover-content');
  const icon = document.getElementById('popover-icon');

  const isUrgent = data.urgency === 'urgent';
  title.textContent = isUrgent ? 'Emergency Care Guidance' : 'Daily Wellness Routine';
  icon.textContent = isUrgent ? '⚠️' : '🧘';
  icon.style.background = isUrgent ? 'var(--danger-bg)' : 'var(--accent-bg)';
  icon.style.color = isUrgent ? 'var(--danger)' : 'var(--accent)';

  const listItems = isUrgent ? data.emergencySolutions : data.dailyExercises;
  
  content.innerHTML = `
    <p style="margin-bottom:1rem;">${isUrgent ? 'These are <strong>temporary solutions</strong>. Please consult a doctor immediately if symptoms worsen.' : 'Follow these <strong>day-to-day routines</strong> and exercises to manage your health better.'}</p>
    <ul class="popover-list">
      ${listItems.map(item => `<li>${item}</li>`).join('')}
    </ul>
  `;

  popover.classList.add('show');
  
  document.getElementById('routine-popover-close').onclick = () => {
    popover.classList.remove('show');
  };
}

export function renderHealthFacts(customLabels = null, customData = null, label = 'General Mortality') {
  const ctx = document.getElementById('healthFactsChart');
  if (!ctx) return;

  if (healthChart) {
    healthChart.destroy();
  }

  const defaultLabels = ['Cardiovascular', 'Cancer', 'Infectious', 'Respiratory', 'Other'];
  const defaultDatasets = [
    { label: 'Global (Millions)', data: [17.9, 9.6, 7.5, 3.9, 5.1], backgroundColor: ['#1D9E75', '#BA7517', '#E24B4A', '#2D5BD2', '#7D52B2'] }
  ];

  const chartData = {
    labels: customLabels || defaultLabels,
    datasets: customData ? [{
      label: label,
      data: customData,
      backgroundColor: customData.map((_, i) => `hsl(${140 + (i * 40)}, 70%, 40%)`),
      borderRadius: 6
    }] : defaultDatasets
  };

  healthChart = new Chart(ctx, {
    type: customData && customData.length < 5 ? 'pie' : 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { usePointStyle: true }
      },
      scales: (customData && customData.length < 5 && healthChart?.config.type === 'pie') ? {} : {
        y: { beginAtZero: true }
      }
    }
  });
}

