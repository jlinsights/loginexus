"""Billing service for Stripe integration, usage tracking, and plan enforcement."""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import stripe
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.billing.plans import (
    PLAN_TIERS,
    RESOURCE_FIELD_MAP,
    RESOURCE_LIMIT_MAP,
    get_plans_with_price_ids,
    price_id_to_tier,
)
from app.core.config import settings
from app.models import Tenant, UsageRecord, WebhookEvent

logger = logging.getLogger(__name__)

# Configure Stripe SDK
stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Handles all Stripe and billing-related operations."""

    # ──── Plan Listing ────

    @staticmethod
    def get_plans() -> list[dict]:
        return get_plans_with_price_ids()

    # ──── Stripe Customer ────

    @staticmethod
    def get_or_create_stripe_customer(db: Session, tenant: Tenant) -> str:
        """Get existing or create new Stripe customer for tenant."""
        if tenant.stripe_customer_id:
            return tenant.stripe_customer_id

        customer = stripe.Customer.create(
            email=tenant.contact_email or f"{tenant.subdomain}@loginexus.com",
            name=tenant.name,
            metadata={"tenant_id": str(tenant.id), "subdomain": tenant.subdomain},
        )
        tenant.stripe_customer_id = customer.id
        db.commit()
        return customer.id

    # ──── Checkout ────

    @staticmethod
    def create_checkout_session(
        db: Session, tenant: Tenant, price_id: str, base_url: str
    ) -> dict:
        """Create a Stripe Checkout session for subscription."""
        # Validate price_id
        valid_prices = [settings.STRIPE_PRICE_PRO, settings.STRIPE_PRICE_ENTERPRISE]
        if price_id not in valid_prices:
            raise HTTPException(status_code=400, detail="Invalid price ID")

        # Check for existing paid subscription
        if tenant.stripe_subscription_id and tenant.subscription_status == "active":
            raise HTTPException(
                status_code=409,
                detail="Active subscription exists. Use billing portal to change plans.",
            )

        customer_id = BillingService.get_or_create_stripe_customer(db, tenant)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{base_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/billing/canceled",
            metadata={"tenant_id": str(tenant.id)},
        )

        return {"checkout_url": session.url, "session_id": session.id}

    # ──── Portal ────

    @staticmethod
    def create_portal_session(tenant: Tenant, return_url: str, base_url: str) -> dict:
        """Create a Stripe Billing Portal session."""
        if not tenant.stripe_customer_id:
            raise HTTPException(
                status_code=400,
                detail="No billing account. Subscribe to a plan first.",
            )

        session = stripe.billing_portal.Session.create(
            customer=tenant.stripe_customer_id,
            return_url=f"{base_url}{return_url}",
        )

        return {"portal_url": session.url}

    # ──── Invoices ────

    @staticmethod
    def get_invoices(tenant: Tenant, limit: int = 10) -> dict:
        """Fetch invoice history from Stripe."""
        if not tenant.stripe_customer_id:
            return {"invoices": [], "has_more": False}

        invoices = stripe.Invoice.list(
            customer=tenant.stripe_customer_id, limit=min(limit, 100)
        )

        return {
            "invoices": [
                {
                    "id": inv.id,
                    "amount_due": inv.amount_due,
                    "amount_paid": inv.amount_paid,
                    "currency": inv.currency,
                    "status": inv.status,
                    "invoice_url": inv.hosted_invoice_url,
                    "invoice_pdf": inv.invoice_pdf,
                    "period_start": datetime.fromtimestamp(
                        inv.period_start, tz=timezone.utc
                    ).isoformat()
                    if inv.period_start
                    else None,
                    "period_end": datetime.fromtimestamp(
                        inv.period_end, tz=timezone.utc
                    ).isoformat()
                    if inv.period_end
                    else None,
                    "created": datetime.fromtimestamp(
                        inv.created, tz=timezone.utc
                    ).isoformat()
                    if inv.created
                    else None,
                }
                for inv in invoices.data
            ],
            "has_more": invoices.has_more,
        }

    # ──── Webhook Processing ────

    @staticmethod
    def handle_webhook_event(db: Session, payload: bytes, sig_header: str) -> dict:
        """Process a Stripe webhook event with idempotency."""
        # 1. Verify signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")

        # 2. Idempotency check
        existing = (
            db.query(WebhookEvent)
            .filter(WebhookEvent.stripe_event_id == event.id)
            .first()
        )
        if existing:
            return {"status": "already_processed"}

        # 3. Process event
        event_type = event.type
        data_object = event.data.object

        if event_type == "checkout.session.completed":
            BillingService._handle_checkout_completed(db, data_object)
        elif event_type == "customer.subscription.updated":
            BillingService._handle_subscription_updated(db, data_object)
        elif event_type == "customer.subscription.deleted":
            BillingService._handle_subscription_deleted(db, data_object)
        elif event_type == "invoice.payment_succeeded":
            BillingService._handle_payment_succeeded(db, data_object)
        elif event_type == "invoice.payment_failed":
            BillingService._handle_payment_failed(db, data_object)
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")

        # 4. Record event for idempotency
        db.add(
            WebhookEvent(
                stripe_event_id=event.id,
                event_type=event_type,
                payload={"object_id": getattr(data_object, "id", None)},
            )
        )
        db.commit()

        return {"status": "processed"}

    @staticmethod
    def _handle_checkout_completed(db: Session, session) -> None:
        customer_id = session.customer
        tenant = (
            db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()
        )
        if not tenant:
            logger.warning(
                f"No tenant found for customer {customer_id} on checkout.session.completed"
            )
            return

        sub = stripe.Subscription.retrieve(session.subscription)
        tenant.stripe_subscription_id = sub.id
        tenant.plan_tier = price_id_to_tier(sub.items.data[0].price.id)
        tenant.subscription_status = "active"
        tenant.billing_period_start = datetime.fromtimestamp(
            sub.current_period_start, tz=timezone.utc
        )
        tenant.billing_period_end = datetime.fromtimestamp(
            sub.current_period_end, tz=timezone.utc
        )

        # Create initial usage record for this period
        BillingService._ensure_usage_record(db, tenant)
        logger.info(
            f"Tenant {tenant.id} subscribed to {tenant.plan_tier} plan"
        )

    @staticmethod
    def _handle_subscription_updated(db: Session, subscription) -> None:
        tenant = (
            db.query(Tenant)
            .filter(Tenant.stripe_customer_id == subscription.customer)
            .first()
        )
        if not tenant:
            return

        tenant.plan_tier = price_id_to_tier(subscription.items.data[0].price.id)
        tenant.subscription_status = subscription.status
        tenant.billing_period_start = datetime.fromtimestamp(
            subscription.current_period_start, tz=timezone.utc
        )
        tenant.billing_period_end = datetime.fromtimestamp(
            subscription.current_period_end, tz=timezone.utc
        )
        logger.info(
            f"Tenant {tenant.id} subscription updated to {tenant.plan_tier}"
        )

    @staticmethod
    def _handle_subscription_deleted(db: Session, subscription) -> None:
        tenant = (
            db.query(Tenant)
            .filter(Tenant.stripe_customer_id == subscription.customer)
            .first()
        )
        if not tenant:
            return

        tenant.plan_tier = "free"
        tenant.subscription_status = "canceled"
        tenant.stripe_subscription_id = None
        tenant.billing_period_start = None
        tenant.billing_period_end = None
        logger.info(f"Tenant {tenant.id} subscription canceled, downgraded to free")

    @staticmethod
    def _handle_payment_succeeded(db: Session, invoice) -> None:
        tenant = (
            db.query(Tenant)
            .filter(Tenant.stripe_customer_id == invoice.customer)
            .first()
        )
        if not tenant:
            return

        tenant.subscription_status = "active"

        # Reset usage for new billing period
        if invoice.subscription:
            sub = stripe.Subscription.retrieve(invoice.subscription)
            tenant.billing_period_start = datetime.fromtimestamp(
                sub.current_period_start, tz=timezone.utc
            )
            tenant.billing_period_end = datetime.fromtimestamp(
                sub.current_period_end, tz=timezone.utc
            )
            BillingService._ensure_usage_record(db, tenant)

        logger.info(f"Tenant {tenant.id} payment succeeded")

    @staticmethod
    def _handle_payment_failed(db: Session, invoice) -> None:
        tenant = (
            db.query(Tenant)
            .filter(Tenant.stripe_customer_id == invoice.customer)
            .first()
        )
        if not tenant:
            return

        tenant.subscription_status = "past_due"
        logger.info(f"Tenant {tenant.id} payment failed, marked past_due")

    # ──── Usage Tracking ────

    @staticmethod
    def _ensure_usage_record(db: Session, tenant: Tenant) -> UsageRecord:
        """Get or create usage record for current billing period."""
        if not tenant.billing_period_start or not tenant.billing_period_end:
            # Free tier: use calendar month
            now = datetime.now(timezone.utc)
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                period_end = period_start.replace(year=now.year + 1, month=1)
            else:
                period_end = period_start.replace(month=now.month + 1)
        else:
            period_start = tenant.billing_period_start
            period_end = tenant.billing_period_end

        record = (
            db.query(UsageRecord)
            .filter(
                UsageRecord.tenant_id == tenant.id,
                UsageRecord.period_start == period_start,
            )
            .first()
        )
        if not record:
            record = UsageRecord(
                tenant_id=tenant.id,
                period_start=period_start,
                period_end=period_end,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
        return record

    @staticmethod
    def get_or_create_usage_record(
        db: Session, tenant_id: UUID
    ) -> UsageRecord:
        """Public method to get current usage record for a tenant."""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return BillingService._ensure_usage_record(db, tenant)

    @staticmethod
    def check_plan_limit(
        db: Session, tenant_id: UUID, resource_type: str
    ) -> bool:
        """Check if tenant is under plan limit. Raises 402 if exceeded."""
        if settings.DEMO_MODE or not settings.BILLING_ENABLED:
            return True

        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return True

        plan = PLAN_TIERS.get(tenant.plan_tier, PLAN_TIERS["free"])
        limit_key = RESOURCE_LIMIT_MAP.get(resource_type)
        if not limit_key:
            return True

        limit = plan["limits"][limit_key]
        if limit == -1:  # unlimited
            return True

        usage = BillingService._ensure_usage_record(db, tenant)
        field = RESOURCE_FIELD_MAP[resource_type]
        current = getattr(usage, field, 0)

        if current >= limit:
            raise HTTPException(
                status_code=402,
                detail={
                    "message": f"{resource_type.capitalize()} limit exceeded for {plan['name']} plan",
                    "error_code": "PLAN_LIMIT_EXCEEDED",
                    "context": {
                        "resource": resource_type,
                        "used": current,
                        "limit": limit,
                        "plan_tier": tenant.plan_tier,
                        "upgrade_url": "/billing/pricing",
                    },
                },
            )
        return True

    @staticmethod
    def increment_usage(
        db: Session, tenant_id: UUID, resource_type: str
    ) -> None:
        """Increment usage counter after successful resource creation."""
        if settings.DEMO_MODE or not settings.BILLING_ENABLED:
            return

        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return

        usage = BillingService._ensure_usage_record(db, tenant)
        field = RESOURCE_FIELD_MAP.get(resource_type)
        if field:
            setattr(usage, field, getattr(usage, field, 0) + 1)
            db.commit()

    @staticmethod
    def get_usage_details(
        db: Session, tenant: Tenant
    ) -> dict:
        """Get detailed usage breakdown for current period."""
        usage = BillingService._ensure_usage_record(db, tenant)
        plan = PLAN_TIERS.get(tenant.plan_tier, PLAN_TIERS["free"])

        def make_item(used: int, limit: int) -> dict:
            if limit == -1:
                return {"used": used, "limit": -1, "percentage": 0.0}
            pct = round((used / limit) * 100, 1) if limit > 0 else 0.0
            return {"used": used, "limit": limit, "percentage": pct}

        return {
            "period_start": usage.period_start.isoformat() if usage.period_start else None,
            "period_end": usage.period_end.isoformat() if usage.period_end else None,
            "shipments": make_item(
                usage.shipment_count, plan["limits"]["shipments_per_month"]
            ),
            "users": make_item(usage.user_count, plan["limits"]["users"]),
            "escrows": make_item(usage.escrow_count, plan["limits"]["escrows"]),
            "api_calls": make_item(
                usage.api_call_count,
                plan["limits"]["api_rate_limit"] * 60 * 24 * 30,  # monthly estimate
            ),
        }

    # ──── Subscription Info ────

    @staticmethod
    def get_subscription_info(
        db: Session, tenant: Tenant
    ) -> dict:
        """Get full subscription info with usage summary."""
        usage = BillingService._ensure_usage_record(db, tenant)
        plan = PLAN_TIERS.get(tenant.plan_tier, PLAN_TIERS["free"])

        def usage_summary(used: int, limit: int) -> dict:
            return {"used": used, "limit": limit}

        return {
            "tenant_id": str(tenant.id),
            "plan_tier": tenant.plan_tier,
            "subscription_status": tenant.subscription_status,
            "billing_period_start": tenant.billing_period_start.isoformat()
            if tenant.billing_period_start
            else None,
            "billing_period_end": tenant.billing_period_end.isoformat()
            if tenant.billing_period_end
            else None,
            "usage": {
                "shipments": usage_summary(
                    usage.shipment_count, plan["limits"]["shipments_per_month"]
                ),
                "users": usage_summary(usage.user_count, plan["limits"]["users"]),
                "escrows": usage_summary(
                    usage.escrow_count, plan["limits"]["escrows"]
                ),
            },
            "stripe_subscription_id": tenant.stripe_subscription_id,
        }


# ──── Demo Mode Helpers ────

class DemoBillingService:
    """Mock billing service for DEMO_MODE."""

    @staticmethod
    def get_subscription_info(tenant: Tenant) -> dict:
        return {
            "tenant_id": str(tenant.id),
            "plan_tier": "free",
            "subscription_status": "active",
            "billing_period_start": None,
            "billing_period_end": None,
            "usage": {
                "shipments": {"used": 12, "limit": 50},
                "users": {"used": 2, "limit": 3},
                "escrows": {"used": 1, "limit": 5},
            },
            "stripe_subscription_id": None,
        }

    @staticmethod
    def get_usage_details() -> dict:
        return {
            "period_start": None,
            "period_end": None,
            "shipments": {"used": 12, "limit": 50, "percentage": 24.0},
            "users": {"used": 2, "limit": 3, "percentage": 66.7},
            "escrows": {"used": 1, "limit": 5, "percentage": 20.0},
            "api_calls": {"used": 340, "limit": 2592000, "percentage": 0.0},
        }

    @staticmethod
    def create_checkout_session() -> dict:
        return {
            "checkout_url": "/billing/success?session_id=demo_session",
            "session_id": "demo_session",
        }

    @staticmethod
    def create_portal_session() -> dict:
        return {"portal_url": "/billing"}

    @staticmethod
    def get_invoices() -> dict:
        return {"invoices": [], "has_more": False}
