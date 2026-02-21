"""Plan tier constants and limit definitions for multi-tenant billing."""

from app.core.config import settings

PLAN_TIERS = {
    "free": {
        "name": "Free",
        "price_monthly": 0,
        "price_id": None,
        "limits": {
            "shipments_per_month": 50,
            "users": 3,
            "escrows": 5,
            "api_rate_limit": 60,
        },
        "features": {
            "analytics": "basic",
            "whitelabel": False,
            "email_support": False,
            "webhook_notifications": False,
        },
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 49,
        "price_id": None,  # Set at runtime from settings
        "limits": {
            "shipments_per_month": 500,
            "users": 15,
            "escrows": 50,
            "api_rate_limit": 200,
        },
        "features": {
            "analytics": "full",
            "whitelabel": True,
            "email_support": True,
            "webhook_notifications": True,
        },
    },
    "enterprise": {
        "name": "Enterprise",
        "price_monthly": 199,
        "price_id": None,  # Set at runtime from settings
        "limits": {
            "shipments_per_month": -1,  # unlimited
            "users": -1,
            "escrows": -1,
            "api_rate_limit": 500,
        },
        "features": {
            "analytics": "full_export",
            "whitelabel": True,
            "email_support": True,
            "webhook_notifications": True,
        },
    },
}

# Resource type → limit key mapping
RESOURCE_LIMIT_MAP = {
    "shipments": "shipments_per_month",
    "users": "users",
    "escrows": "escrows",
}

# Resource type → UsageRecord field mapping
RESOURCE_FIELD_MAP = {
    "shipments": "shipment_count",
    "users": "user_count",
    "escrows": "escrow_count",
}


def get_plans_with_price_ids() -> list[dict]:
    """Return plan tiers with runtime price IDs from settings."""
    plans = []
    for tier, plan in PLAN_TIERS.items():
        p = {**plan, "tier": tier}
        if tier == "pro" and settings.STRIPE_PRICE_PRO:
            p["price_id"] = settings.STRIPE_PRICE_PRO
        elif tier == "enterprise" and settings.STRIPE_PRICE_ENTERPRISE:
            p["price_id"] = settings.STRIPE_PRICE_ENTERPRISE
        plans.append(p)
    return plans


def price_id_to_tier(price_id: str) -> str:
    """Map a Stripe price ID back to a plan tier name."""
    if price_id == settings.STRIPE_PRICE_PRO:
        return "pro"
    if price_id == settings.STRIPE_PRICE_ENTERPRISE:
        return "enterprise"
    return "free"
