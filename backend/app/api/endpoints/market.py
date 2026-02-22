from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from ...database import get_db
from ...schemas import (
    IndicesResponse,
    IndexHistoryResponse,
    RatesResponse,
    RatesCompareResponse,
    TrendsResponse,
    InsightsResponse,
)
from ...crud import market as market_crud

router = APIRouter()


@router.get("/indices", response_model=IndicesResponse)
def get_indices(db: Session = Depends(get_db)):
    """Get latest freight index values with sparkline data."""
    indices = market_crud.get_indices(db)
    return {"indices": indices}


@router.get("/indices/{index_code}/history", response_model=IndexHistoryResponse)
def get_index_history(
    index_code: str,
    period: str = Query(default="30d", regex="^(7d|30d|90d|180d)$"),
    db: Session = Depends(get_db),
):
    """Get historical data for a specific freight index."""
    result = market_crud.get_index_history(db, index_code.upper(), period)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Index code '{index_code}' not found")
    return result


@router.get("/rates", response_model=RatesResponse)
def search_rates(
    origin: Optional[str] = Query(default=None),
    destination: Optional[str] = Query(default=None),
    mode: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Search route rates with optional filters."""
    return market_crud.search_rates(db, origin, destination, mode)


@router.get("/rates/compare", response_model=RatesCompareResponse)
def compare_rates(
    routes: str = Query(..., description="Comma-separated routes, e.g. KRPUS-USLAX,KRPUS-DEHAM"),
    mode: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Compare rates across multiple routes."""
    route_list = [r.strip() for r in routes.split(",") if r.strip()]
    if not route_list:
        raise HTTPException(status_code=400, detail="At least one route is required")
    results = market_crud.compare_routes(db, route_list, mode)
    return {"routes": results, "mode": mode}


@router.get("/trends", response_model=TrendsResponse)
def get_trends(
    period: str = Query(default="30d", regex="^(7d|30d|90d)$"),
    mode: Optional[str] = Query(default=None),
    origin: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Get rate trends over time."""
    return market_crud.get_trends(db, period, mode, origin)


@router.get("/insight", response_model=InsightsResponse)
def get_insights(db: Session = Depends(get_db)):
    """Get AI-generated market insights (rule-based)."""
    insights = market_crud.get_insights(db)
    return {"insights": insights, "generated_at": datetime.utcnow()}
