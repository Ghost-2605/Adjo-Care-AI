const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env', 'utf8');
  const match = env.match(/VITE_GROQ_API_KEY=["']?([^"'\n\r]+)["']?/);
  if (!match || !match[1]) { 
    console.error('No Groq API key found in .env'); 
    process.exit(1); 
  }
  const key = match[1];

  const prompt = `You are AdJoCare AI, a compassionate medical symptom analyzer.

Patient info:
- Name: Patient, Age: 30 yrs, Blood Group: Unknown
- Medical history: None
- Symptoms: Headache and slight fever
- Affected body areas: Not specified
- Severity: 5/10, Duration: Not specified
- Location: Udupi, Karnataka, India

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
    {"name":"Actual Hospital Name","distance":"2.3 km","speciality":"General Medicine","phone":"0820-XXXXXX","mapQuery":"Hospital Name Udupi, Karnataka","doctorName":"Dr. FirstName LastName","doctorQual":"MBBS, MD","doctorSpeciality":"Relevant speciality"}
  ]
}

dangerLevel: fine=minor/home care, moderate=see doctor soon, urgent=see doctor today, emergency=ER immediately.
healthScore: 0-100 wellness score (higher=better).
medications: suggest 2-4 appropriate OTC medications for the symptoms.
hospitals: suggest real hospitals near Udupi, Karnataka, India with realistic doctor profiles matching the condition.`;

  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body
    });
    const data = await res.json();
    if (data.error) {
      console.error('API Error:', data.error.message);
    } else {
      console.log('Success:', data.choices[0].message.content);
    }
  } catch (err) {
    console.error('Fetch Failed:', err.message);
  }
}
test();
