from .db import SessionLocal
from .models import Project, SearchRun
from .services.pipeline import run_pipeline


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
    except Exception as e:
        db.rollback()
        print("run_search error:", repr(e))
        search = db.get(SearchRun, search_id)
        if search:
            search.status = "error"
            db.commit()
    finally:
        db.close()