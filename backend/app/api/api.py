from fastapi import APIRouter
from .endpoints import shipments, tenants

api_router = APIRouter()
api_router.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
