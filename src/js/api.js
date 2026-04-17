import { state } from './state.js';
import { showToast } from './ui.js';

export async function callGroq(promptText) {
  if (!state.userApiKey) {
    throw new Error('No API Key found');
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.userApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'API Error');
  }

  try {
    const text = data.choices[0].message.content;
    return text;
  } catch (err) {
    throw new Error('Failed to parse Groq response');
  }
}
