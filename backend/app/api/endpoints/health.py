from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.config import settings
from ...database import get_db

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "version": settings.API_VERSION}


@router.get("/health/ready")
def health_ready(db: Session = Depends(get_db)):
    checks = {"database": False, "config": True}
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass

    all_ok = all(checks.values())
    return {
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
        "version": settings.API_VERSION,
    }
