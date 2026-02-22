from fastapi import APIRouter

from .endpoints import analytics, auth, billing, escrows, health, market, rates, shipments, tenants, users

# Versioned router
v1_router = APIRouter()
v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
v1_router.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
v1_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
v1_router.include_router(escrows.router, prefix="/escrows", tags=["escrows"])
v1_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
v1_router.include_router(users.router, prefix="/users", tags=["users"])
v1_router.include_router(rates.router, prefix="/rates", tags=["rates"])
v1_router.include_router(billing.router, prefix="/billing", tags=["billing"])
v1_router.include_router(market.router, prefix="/market", tags=["market"])

# Top-level API router
api_router = APIRouter()
api_router.include_router(v1_router, prefix="/v1")
api_router.include_router(health.router, tags=["health"])
