# Opportunity Finder V1

Evidence-first market intelligence platform.

## Stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Python + FastAPI + SQLAlchemy + PostgreSQL + pgvector
- Jobs: Redis + Celery
- Connectors: replaceable `SourceConnector` interface
- V1 connectors: mock + Reddit-ready skeleton + Web-ready skeleton

## 1. Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop

## 2. Start infrastructure
```bash
docker compose up -d
```

## 3. Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## 4. Worker
Open another terminal:
```bash
cd backend
.venv\Scripts\Activate.ps1
celery -A app.worker.celery_app worker --loglevel=info
```

## 5. Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173

## Production deployment
The Vercel frontend needs a separately hosted backend; the API, PostgreSQL, Redis, and Celery worker are not deployed by Vercel with this frontend. Set the Vercel project environment variable `VITE_API_URL` to the backend's public HTTPS origin (for example, `https://api.example.com`, without `/api`), then redeploy. Configure the backend's `CORS_ORIGINS` to include `https://opportunity-finder-azure-mu.vercel.app` and any Vercel preview origins you use. Verify the backend is reachable at `/health` and `/api/sources` before testing research.

## V1 flow
Project -> Search configuration -> query expansion -> connectors -> normalization -> deduplication -> relevance/intent -> evidence -> dashboard.

Real credentials are intentionally not embedded. Sources that cannot be connected are shown as MOCK/UNAVAILABLE rather than silently producing fake data.
