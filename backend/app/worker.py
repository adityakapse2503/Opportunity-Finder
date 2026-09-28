from celery import Celery
from .core.config import settings
from .db import SessionLocal
from .models import Project, SearchRun
from .services.pipeline import run_pipeline

celery_app = Celery("opportunity_finder", broker=settings.redis_url, backend=settings.redis_url)

@celery_app.task
def run_search(project_id: str, search_id: str, query: str, depth: str):
    db = SessionLocal()
    try:
        project = db.get(Project, project_id)
        search = db.get(SearchRun, search_id)
        search.status = "running"
        db.commit()

        run_pipeline(db, project, query, depth)

        search.status = "completed"
        db.commit()
    except Exception:
        search = db.get(SearchRun, search_id)
        if search:
            search.status = "error"
            db.commit()
        raise
    finally:
        db.close()
