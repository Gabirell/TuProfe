# TuProfe: Intelligent Course Architect 🎓

TuProfe is a high-performance, AI-driven educational assistant designed to transform dense course material into manageable, high-retention learning paths. Powered by Google's Gemini 3.0 models, it simplifies complex concepts, generates interactive quizzes, and builds conceptual hierarchies in seconds.

## 🚀 Key Features

- **Multi-Model Synthesis**: Uses `gemini-3-pro-preview` for deep reasoning and `gemini-3-flash-preview` for lightning-fast chapter detection.
- **Adaptive Learning Depth**: Choose from "Basic", "Standard", or "Deep Analysis" depending on your study needs.
- **Search Grounding**: In "Internet" mode, the AI cross-references current web data to add real-world context and trending FAQs.
- **Interactive AI Tutor**: A built-in chat interface focused specifically on your uploaded document.
- **Mastery Checkpoints**: Automatically generates high-fidelity quizzes with detailed pedagogical explanations.
- **Export to PDF**: Generate clean, formatted study guides for offline use.
- **Cloud Sync**: Securely save your analyses using Firebase Authentication and Firestore.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **AI Engine**: Google Gemini API (@google/genai).
- **Backend/Auth**: Firebase (Auth & Firestore).
- **Iconography**: Lucide React.
- **Processing**: PDF.js, Mammoth.js (Word), html2canvas, jsPDF.

## 📦 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/tuprofe-ai.git
   cd tuprofe-ai
   ```

2. **Environment Variables**:
   Create a `.env` file or set your environment variables in your hosting provider (e.g., Vercel, Netlify):
   - `API_KEY`: Your Google AI Studio (Gemini) API Key.

3. **Firebase Configuration**:
   Update `services/firebase.ts` with your project's credentials found in the Firebase Console.

4. **Deploy**:
   This project is ready to be hosted as a static site. Simply upload the root folder to your provider of choice.

## 🔒 Security & Privacy

- **Client-Side Processing**: Document parsing (PDF/Word) happens locally in the browser.
- **Safe AI**: System instructions are hardened to prevent prompt injection and ensure educational focus.
- **Auth-Protected**: User data is siloed per Firebase UID.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
