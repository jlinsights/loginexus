"""Billing API endpoints for subscription management, usage tracking, and Stripe integration."""

import logging

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_role
from app.core.config import settings
from app.database import get_db
from app.models import Tenant, User
from app.services.billing_service import BillingService, DemoBillingService

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_tenant(user: User, db: Session) -> Tenant:
    """Get tenant for authenticated user."""
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


def _get_base_url(request: Request) -> str:
    """Extract base URL from request for redirect URLs."""
    origin = request.headers.get("origin")
    if origin:
        return origin
    # Fallback to frontend URL
    return "http://localhost:3000"


@router.get("/plans")
async def list_plans():
    """List available subscription plans. Public endpoint."""
    plans = BillingService.get_plans()
    return {"plans": plans}


@router.get("/subscription")
async def get_subscription(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Get current tenant subscription details and usage summary."""
    tenant = _get_tenant(user, db)

    if settings.DEMO_MODE or not settings.BILLING_ENABLED:
        return DemoBillingService.get_subscription_info(tenant)

    return BillingService.get_subscription_info(db, tenant)


@router.post("/checkout")
async def create_checkout(
    request: Request,
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for subscribing to a plan."""
    tenant = _get_tenant(user, db)
    base_url = _get_base_url(request)

    if settings.DEMO_MODE or not settings.BILLING_ENABLED:
        return DemoBillingService.create_checkout_session()

    body = await request.json()
    price_id = body.get("price_id")
    if not price_id:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="price_id is required")

    return BillingService.create_checkout_session(db, tenant, price_id, base_url)


@router.post("/portal")
async def create_portal(
    request: Request,
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Create a Stripe Billing Portal session."""
    tenant = _get_tenant(user, db)
    base_url = _get_base_url(request)

    if settings.DEMO_MODE or not settings.BILLING_ENABLED:
        return DemoBillingService.create_portal_session()

    body = await request.json()
    return_url = body.get("return_url", "/billing")

    return BillingService.create_portal_session(tenant, return_url, base_url)


@router.get("/invoices")
async def list_invoices(
    limit: int = Query(default=10, ge=1, le=100),
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """List tenant invoice history from Stripe."""
    tenant = _get_tenant(user, db)

    if settings.DEMO_MODE or not settings.BILLING_ENABLED:
        return DemoBillingService.get_invoices()

    return BillingService.get_invoices(tenant, limit)


@router.get("/usage")
async def get_usage(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Get current period usage breakdown."""
    tenant = _get_tenant(user, db)

    if settings.DEMO_MODE or not settings.BILLING_ENABLED:
        return DemoBillingService.get_usage_details()

    return BillingService.get_usage_details(db, tenant)


@router.post("/webhooks")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Stripe webhook handler. No auth required (verified via signature)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if settings.DEMO_MODE or not settings.BILLING_ENABLED:
        return {"status": "demo_mode"}

    return BillingService.handle_webhook_event(db, payload, sig_header)
