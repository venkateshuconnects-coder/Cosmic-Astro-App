# Cosmic Astrology App

A modern responsive astrology web app that generates personalized daily insights based on name, birth date, and location.

## Features

- Responsive React + Tailwind frontend
- FastAPI backend with a `/generate-astro-report` REST endpoint
- Zodiac sign detection
- Numerology score calculation
- Daily cosmic energy factor
- Luck score generation and actionable daily recommendations

## Structure

- `backend/` — FastAPI service and astrology logic
- `frontend/` — React + Tailwind UI with form and dashboard

## Quick Start

### Backend

```powershell
cd d:\AI-Projects\cosmic-astro-app\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd d:\AI-Projects\cosmic-astro-app\frontend
npm install
npm run dev
```

Open the frontend URL shown by Vite, then submit the form to generate your astrology report.

## New Bonus Features

- Saved daily report history via backend SQLite persistence
- Share your result as an image from the UI
- Compatibility checker for two profiles
- Daily cosmic energy refresh based on the current date
