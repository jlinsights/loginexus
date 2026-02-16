from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List

from ...database import get_db
from ...schemas import (
    AnalyticsSummary,
    VolumeDataPoint,
    StatusDistribution,
    RoutePerformance,
    EscrowSummary,
)
from ...crud import analytics as analytics_crud

router = APIRouter()


def _get_tenant_id(request: Request) -> str:
    return getattr(request.state, "tenant_id", "default")


def _default_start() -> date:
    return date.today() - timedelta(days=30)


def _default_end() -> date:
    return date.today()


@router.get("/summary", response_model=AnalyticsSummary)
def get_summary(
    request: Request,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db),
):
    tenant_id = _get_tenant_id(request)
    start = start_date or _default_start()
    end = end_date or _default_end()
    return analytics_crud.get_summary(db, tenant_id, start, end)


@router.get("/volume", response_model=List[VolumeDataPoint])
def get_volume(
    request: Request,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    granularity: str = Query(default="daily"),
    db: Session = Depends(get_db),
):
    tenant_id = _get_tenant_id(request)
    start = start_date or _default_start()
    end = end_date or _default_end()
    return analytics_crud.get_volume(db, tenant_id, start, end, granularity)


@router.get("/status-distribution", response_model=List[StatusDistribution])
def get_status_distribution(
    request: Request,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db),
):
    tenant_id = _get_tenant_id(request)
    start = start_date or _default_start()
    end = end_date or _default_end()
    return analytics_crud.get_status_distribution(db, tenant_id, start, end)


@router.get("/route-performance", response_model=List[RoutePerformance])
def get_route_performance(
    request: Request,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db),
):
    tenant_id = _get_tenant_id(request)
    start = start_date or _default_start()
    end = end_date or _default_end()
    return analytics_crud.get_route_performance(db, tenant_id, start, end)


@router.get("/escrow-summary", response_model=EscrowSummary)
def get_escrow_summary(
    request: Request,
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db),
):
    tenant_id = _get_tenant_id(request)
    start = start_date or _default_start()
    end = end_date or _default_end()
    return analytics_crud.get_escrow_summary(db, tenant_id, start, end)
