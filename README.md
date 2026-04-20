# AI Resume Screening Tool

A fully local, private AI-powered resume screening system. Upload resumes, paste a job description, and get ranked candidates with skill gap analysis — powered by Ollama (runs on your machine, no API costs).

## Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: FastAPI (Python 3.11)
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **LLM**: Ollama (llama3 / mistral)

## Prerequisites

- Node.js 18+
- Python 3.11+
- [Ollama](https://ollama.ai) installed and running

## Quick Start

### 1. Clone & setup

```bash
git clone <your-repo-url>
cd ai-resume-screener
```

### 2. Pull an Ollama model

```bash
ollama pull llama3
# or for faster/lighter:
ollama pull mistral
```

### 3. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Docker (optional)

```bash
docker-compose up --build
```

## Project Structure

```
ai-resume-screener/
├── frontend/          # React + Vite
├── backend/           # FastAPI
│   ├── app/
│   │   ├── routers/   # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── models/    # DB models
│   │   └── schemas/   # Pydantic schemas
│   └── uploads/       # Stored resumes
└── docker-compose.yml
```

## Features

- Upload PDF / DOCX resumes (bulk supported)
- AI-powered JD ↔ resume matching via Ollama
- 0–100 match scoring with skill gap analysis
- Red / green flag detection
- Candidate ranking leaderboard
- One-click shortlisting
- Email notifications (SMTP)
- Full audit log
