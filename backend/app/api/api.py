from fastapi import APIRouter
from .endpoints import shipments, tenants, escrows, analytics

api_router = APIRouter()
api_router.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(escrows.router, prefix="/escrows", tags=["escrows"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
