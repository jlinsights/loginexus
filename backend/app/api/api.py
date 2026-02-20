from fastapi import APIRouter
from .endpoints import shipments, tenants, escrows, analytics, users, rates

api_router = APIRouter()
api_router.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(escrows.router, prefix="/escrows", tags=["escrows"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(rates.router, prefix="/rates", tags=["rates"])
