# AdJoCare AI 🏥

AdJoCare AI is an advanced, AI-powered health assistant designed to provide compassionate medical symptom analysis, health tracking, and local healthcare resources.

## 🚀 Features

- **AI Symptom Analysis**: Powered by Llama 3 via Groq for intelligent and empathetic health assessments.
- **Multilingual Support**: Available in English, Hindi, and Kannada.
- **Interactive Body Map**: Pinpoint symptoms visually on a 3D-integrated mannequin.
- **Voice Recognition**: Describe symptoms naturally using voice input.
- **Local Hospital Integration**: Find real hospitals and doctors near your location.
- **Health Score Breakdown**: Understand your health status with data-driven metrics.
- **Export to PDF**: Generate professional health reports for medical consultation.
- **PWA Ready**: Installable on mobile and desktop for offline-ready access.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS, Vite
- **AI**: Llama-3.3-70b-versatile via Groq API
- **Backend/Storage**: Supabase (Database & Auth)
- **Maps**: OpenStreetMap integration
- **PDF Generation**: jsPDF

## 📦 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ghost-2605/Adjo-Care-AI.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **API Key**:
   Once the app is running, enter your **Groq API Key** in the settings modal to enable AI analysis.

## 🛡️ Disclaimer

AdJoCare AI is a tool for educational and informational purposes only. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

---
Created with ❤️ by Ghost-2605 & Adarsh
