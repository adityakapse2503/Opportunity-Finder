from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session
from .core.config import settings
from .db import Base, engine, get_db
from .models import Project, SearchRun, NormalizedDocument, Lead, Source
from .schemas import ProjectCreate, ProjectOut, SearchCreate, SearchOut, ResultOut
from .connectors.registry import CONNECTORS
from .worker import run_search

# DB init: crash na kare, error logs me dikhe
try:
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print("DB init error:", repr(e))

app = FastAPI(title="Opportunity Finder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.cors_origins.split(",") if x.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"name": "Opportunity Finder API", "status": "ok", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/sources")
def sources():
    return [
        {"name": c.name, "signal_type": c.signal_type, "status": c.health_check()}
        for c in CONNECTORS.values()
    ]


@app.post("/api/projects", response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    p = Project(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@app.get("/api/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return list(db.scalars(select(Project).order_by(Project.created_at.desc())))


@app.post("/api/projects/{project_id}/search", response_model=SearchOut)
def create_search(project_id: str, payload: SearchCreate, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    search = SearchRun(project_id=project_id, query=payload.query, depth=payload.depth)
    db.add(search)
    db.commit()
    db.refresh(search)

    # Vercel serverless me Celery worker nahi chalta, isliye search yahin run hota hai
    run_search(project_id, search.id, payload.query, payload.depth)
    db.refresh(search)
    return search


@app.get("/api/projects/{project_id}/results", response_model=list[ResultOut])
def results(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    rows = db.scalars(
        select(NormalizedDocument)
        .where(NormalizedDocument.business_type == project.business_type)
        .order_by(NormalizedDocument.relevance_score.desc(), NormalizedDocument.collected_at.desc())
        .limit(100)
    )
    return [
        ResultOut(
            id=x.id, source=x.source, title=x.title,
            excerpt=x.text[:300], source_url=x.source_url,
            published_at=x.published_at, author=x.author,
            intent_type=x.intent_type, intent_score=x.intent_score,
            relevance_score=x.relevance_score, engagement=x.engagement
        )
        for x in rows
    ]


@app.get("/api/projects/{project_id}/metrics")
def metrics(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    base = NormalizedDocument.business_type == project.business_type
    return {
        "sources_scanned": len(CONNECTORS),
        "relevant_results": db.scalar(select(func.count()).select_from(NormalizedDocument).where(base)) or 0,
        "potential_leads": db.scalar(select(func.count()).select_from(Lead)) or 0,
        "high_intent_signals": db.scalar(
            select(func.count()).select_from(NormalizedDocument).where(base, NormalizedDocument.intent_score >= 65)
        ) or 0,
        "emerging_topics": 0,
        "communities": 0,
    }