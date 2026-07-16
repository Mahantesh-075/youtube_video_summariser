# YouTube Video Summariser 🚀

An AI-powered web application that turns hours of YouTube videos into structured knowledge in seconds.
(youtube_video_summariser/main/<img width="1919" height="984" alt="Screenshot 2026-05-03 233206" src="https://github.com/user-attachments/assets/020b4fa5-f623-4a51-ac43-aa431193e4c3" />


## Features
- **Instant Transcripts:** Fetches captions using the official YouTube Transcript API (no heavy video downloading required).
- **AI Summarization:** Uses Google's **Gemini 2.5 Flash** model to distill videos into token-optimized, readable markdown with key takeaways.
- **Visual Diagrams:** Dynamically generates **Mermaid.js** block diagrams representing the core concepts of the video, rendered instantly in the browser.
- **Document Export:** Allows users to download the structured summary directly as a `.docx` Word file, or export the diagram as an SVG vector file.
- **Premium UI:** Beautiful dark mode glassmorphism design with responsive components.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS (Glassmorphism UI), Lucide Icons, Mermaid.js
- **Backend:** Python, FastAPI, python-docx, youtube-transcript-api, Google GenAI SDK

## How to Run Locally

### 1. Setup Environment
In the `backend` folder, create a `.env` file and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 2. Start the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to use the app!
