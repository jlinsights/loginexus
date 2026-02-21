# Multi-Tenant Billing Design Document

> **Summary**: Technical design for Stripe-based subscription billing, usage metering, and invoicing for LogiNexus tenants
>
> **Project**: LogiNexus
> **Version**: 0.1.0
> **Author**: Development Team
> **Date**: 2026-02-21
> **Status**: Draft
> **Planning Doc**: [multi-tenant-billing.plan.md](../../01-plan/features/multi-tenant-billing.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **Minimal Frontend Footprint**: Use Stripe Checkout (redirect-based) and Stripe Billing Portal to avoid handling payment details in our codebase
2. **Backend-Only Stripe Integration**: All Stripe API calls happen server-side; no `@stripe/stripe-js` SDK in frontend
3. **Idempotent Webhook Processing**: Handle Stripe webhook replays safely with event ID deduplication
4. **Low-Latency Usage Enforcement**: Plan limit checks add < 10ms overhead via in-memory caching
5. **Graceful Degradation**: Billing pages work even if Stripe API is temporarily unavailable

### 1.2 Design Principles

- **Single Responsibility**: Billing logic isolated in `billing` service module, separate from core shipment/escrow logic
- **Open/Closed**: Plan tiers defined as constants; new tiers addable without modifying enforcement logic
- **Defense in Depth**: Webhook signature verification + idempotent handlers + DB constraints
- **Convention Consistency**: Follow existing FastAPI patterns (router → endpoint → service → DB)

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                          │
│                                                                  │
│  /billing           /billing/pricing     /billing/success        │
│  ┌──────────┐       ┌──────────┐        ┌──────────┐            │
│  │ Dashboard │       │ Pricing  │        │ Success  │            │
│  │ - Plan    │       │ - Tiers  │        │ - Confirm│            │
│  │ - Usage   │       │ - CTA    │        └──────────┘            │
│  │ - Invoice │       │ - Compare│                                │
│  └──────────┘       └──────────┘                                │
│       │                   │                                      │
│       └───────────────────┴───── fetch() ─────────┐              │
├───────────────────────────────────────────────────┼──────────────┤
│                      Backend (FastAPI)             │              │
│                                                    ▼              │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  /api/v1/billing/*                                       │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │     │
│  │  │  plans   │  │ checkout │  │ webhooks │  │ usage   │ │     │
│  │  │  GET     │  │ POST     │  │ POST     │  │ GET     │ │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │     │
│  └──────────────────────┬──────────────────────────────────┘     │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────┐     │
│  │  BillingService                                          │     │
│  │  - create_checkout_session()                             │     │
│  │  - handle_webhook_event()                                │     │
│  │  - get_usage()                                           │     │
│  │  - check_plan_limit()                                    │     │
│  └──────────────────────┬──────────────────────────────────┘     │
│                         │                                        │
├─────────────────────────┼────────────────────────────────────────┤
│                         │       External Services                │
│                         ▼                                        │
│              ┌──────────────────┐                                │
│              │   Stripe API     │                                │
│              │   - Customers    │                                │
│              │   - Checkout     │                                │
│              │   - Subscriptions│                                │
│              │   - Invoices     │                                │
│              │   - Portal       │                                │
│              │   - Webhooks     │                                │
│              └──────────────────┘                                │
├──────────────────────────────────────────────────────────────────┤
│                         Database                                 │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐       │
│  │ Tenant   │  │ UsageRecord  │  │ WebhookEvent        │       │
│  │ (extend) │  │ (new)        │  │ (new, idempotency)  │       │
│  └──────────┘  └──────────────┘  └─────────────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Subscription Flow:
  Tenant Admin → GET /billing/plans → Select Tier
    → POST /billing/checkout {price_id} → Backend creates Stripe Customer + Checkout Session
    → Redirect to Stripe Checkout URL → User pays
    → Stripe sends webhook (checkout.session.completed)
    → Backend updates Tenant.plan_tier + subscription fields
    → Redirect to /billing/success

Usage Tracking Flow:
  POST /shipments/ (or /escrows/, /users/invite)
    → UsageEnforcementMiddleware intercepts
    → billing_service.check_plan_limit(tenant_id, resource_type)
    → If under limit → proceed + increment UsageRecord counter
    → If at/over limit → HTTP 402 {error: "Plan limit exceeded", upgrade_url}

Webhook Processing Flow:
  Stripe → POST /api/v1/billing/webhooks
    → Verify webhook signature (HMAC SHA256)
    → Check WebhookEvent table for event_id (idempotency)
    → If new: process event → insert WebhookEvent record
    → If duplicate: return 200 OK (skip processing)

Invoice Flow:
  Tenant Admin → GET /billing/invoices
    → Backend calls stripe.Invoice.list(customer=stripe_customer_id)
    → Return formatted invoice list
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| BillingService | Stripe Python SDK (`stripe>=7.0.0`) | All Stripe API interactions |
| BillingService | Settings (config.py) | Stripe API keys, price IDs |
| BillingService | Tenant model | Read/update billing fields |
| BillingService | UsageRecord model | Track and query usage counts |
| UsageEnforcement | BillingService | Plan limit checks |
| Billing endpoints | auth.py (require_role) | Admin-only access |
| Frontend billing pages | `/api/v1/billing/*` | Data fetching via Axios |

---

## 3. Data Model

### 3.1 Tenant Model Extension

```python
# backend/app/models.py - Extend existing Tenant class

class Tenant(Base):
    __tablename__ = "tenants"

    # ... existing fields (id, name, subdomain, logo_url, primary_color, contact_email, created_at, updated_at)

    # NEW: Billing fields
    stripe_customer_id = Column(String, nullable=True, unique=True)
    plan_tier = Column(String, default="free")  # free | pro | enterprise
    subscription_status = Column(String, default="active")  # active | past_due | canceled | trialing
    stripe_subscription_id = Column(String, nullable=True, unique=True)
    billing_period_start = Column(DateTime(timezone=True), nullable=True)
    billing_period_end = Column(DateTime(timezone=True), nullable=True)
```

### 3.2 UsageRecord Model (New)

```python
# backend/app/models.py

class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    shipment_count = Column(Integer, default=0)
    user_count = Column(Integer, default=0)
    escrow_count = Column(Integer, default=0)
    api_call_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        # One record per tenant per billing period
        # Uses period_start as the unique constraint anchor
        {"schema": None},
    )
```

### 3.3 WebhookEvent Model (New)

```python
# backend/app/models.py

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    stripe_event_id = Column(String, unique=True, nullable=False, index=True)
    event_type = Column(String, nullable=False)  # e.g. checkout.session.completed
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    payload = Column(JSONB)  # Store raw event data for debugging
```

### 3.4 Entity Relationships

```
[Tenant] 1 ──── N [UsageRecord]        (one per billing period)
[Tenant] 1 ──── 1 [Stripe Customer]    (external, via stripe_customer_id)
[Tenant] 1 ──── 1 [Stripe Subscription](external, via stripe_subscription_id)

[WebhookEvent] - standalone (idempotency tracking, no FK)
```

### 3.5 Database Schema (SQL)

```sql
-- Extend tenants table
ALTER TABLE tenants
    ADD COLUMN stripe_customer_id VARCHAR UNIQUE,
    ADD COLUMN plan_tier VARCHAR DEFAULT 'free',
    ADD COLUMN subscription_status VARCHAR DEFAULT 'active',
    ADD COLUMN stripe_subscription_id VARCHAR UNIQUE,
    ADD COLUMN billing_period_start TIMESTAMPTZ,
    ADD COLUMN billing_period_end TIMESTAMPTZ;

-- New: Usage tracking per billing period
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    shipment_count INTEGER DEFAULT 0,
    user_count INTEGER DEFAULT 0,
    escrow_count INTEGER DEFAULT 0,
    api_call_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, period_start)
);

CREATE INDEX idx_usage_records_tenant_period ON usage_records(tenant_id, period_start);

-- New: Webhook idempotency
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR UNIQUE NOT NULL,
    event_type VARCHAR NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB
);

CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/billing/plans` | List available plans with limits | Public (no auth) |
| GET | `/api/v1/billing/subscription` | Current tenant subscription + usage | Admin role |
| POST | `/api/v1/billing/checkout` | Create Stripe Checkout session | Admin role |
| POST | `/api/v1/billing/portal` | Create Stripe Billing Portal session | Admin role |
| GET | `/api/v1/billing/invoices` | List tenant invoices | Admin role |
| GET | `/api/v1/billing/usage` | Current period usage breakdown | Admin role |
| POST | `/api/v1/billing/webhooks` | Stripe webhook handler | No auth (signature verified) |

### 4.2 Detailed Specification

#### `GET /api/v1/billing/plans`

Returns all available plan tiers with their limits. Public endpoint (used on pricing page).

**Response (200 OK):**
```json
{
  "plans": [
    {
      "tier": "free",
      "name": "Free",
      "price_monthly": 0,
      "price_id": null,
      "limits": {
        "shipments_per_month": 50,
        "users": 3,
        "escrows": 5,
        "api_rate_limit": 60
      },
      "features": {
        "analytics": "basic",
        "whitelabel": false,
        "email_support": false,
        "webhook_notifications": false
      }
    },
    {
      "tier": "pro",
      "name": "Pro",
      "price_monthly": 49,
      "price_id": "price_pro_monthly",
      "limits": {
        "shipments_per_month": 500,
        "users": 15,
        "escrows": 50,
        "api_rate_limit": 200
      },
      "features": {
        "analytics": "full",
        "whitelabel": true,
        "email_support": true,
        "webhook_notifications": true
      }
    },
    {
      "tier": "enterprise",
      "name": "Enterprise",
      "price_monthly": 199,
      "price_id": "price_enterprise_monthly",
      "limits": {
        "shipments_per_month": -1,
        "users": -1,
        "escrows": -1,
        "api_rate_limit": 500
      },
      "features": {
        "analytics": "full_export",
        "whitelabel": true,
        "email_support": true,
        "webhook_notifications": true
      }
    }
  ]
}
```

#### `GET /api/v1/billing/subscription`

Returns the tenant's current subscription details and usage summary.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "tenant_id": "uuid",
  "plan_tier": "pro",
  "subscription_status": "active",
  "billing_period_start": "2026-02-01T00:00:00Z",
  "billing_period_end": "2026-03-01T00:00:00Z",
  "usage": {
    "shipments": { "used": 142, "limit": 500 },
    "users": { "used": 8, "limit": 15 },
    "escrows": { "used": 12, "limit": 50 }
  },
  "stripe_subscription_id": "sub_xxx"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role

#### `POST /api/v1/billing/checkout`

Creates a Stripe Checkout Session for subscribing or upgrading.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "price_id": "price_pro_monthly"
}
```

**Response (200 OK):**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_xxx",
  "session_id": "cs_xxx"
}
```

**Business Logic:**
1. Get tenant from authenticated user
2. If no `stripe_customer_id` → create Stripe Customer with tenant email
3. Create Checkout Session with `mode=subscription`, `customer`, `price_id`
4. Set `success_url` to `/billing/success?session_id={CHECKOUT_SESSION_ID}`
5. Set `cancel_url` to `/billing/canceled`
6. Store `stripe_customer_id` on tenant if newly created
7. Return checkout URL

**Error Responses:**
- `400 Bad Request`: Invalid `price_id`
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role
- `409 Conflict`: Tenant already has active paid subscription (must use portal to change)

#### `POST /api/v1/billing/portal`

Creates a Stripe Billing Portal session for managing subscription, payment methods, and invoices.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "return_url": "/billing"
}
```

**Response (200 OK):**
```json
{
  "portal_url": "https://billing.stripe.com/p/session/xxx"
}
```

**Error Responses:**
- `400 Bad Request`: No `stripe_customer_id` on tenant (never subscribed)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role

#### `GET /api/v1/billing/invoices`

Returns tenant's invoice history from Stripe.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional, default: 10, max: 100)

**Response (200 OK):**
```json
{
  "invoices": [
    {
      "id": "in_xxx",
      "amount_due": 4900,
      "amount_paid": 4900,
      "currency": "usd",
      "status": "paid",
      "invoice_url": "https://invoice.stripe.com/i/xxx",
      "invoice_pdf": "https://pay.stripe.com/invoice/xxx/pdf",
      "period_start": "2026-01-01T00:00:00Z",
      "period_end": "2026-02-01T00:00:00Z",
      "created": "2026-02-01T00:00:00Z"
    }
  ],
  "has_more": false
}
```

**Error Responses:**
- `400 Bad Request`: No Stripe customer (never subscribed; Free tier has no invoices)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role

#### `GET /api/v1/billing/usage`

Returns detailed current-period usage breakdown.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "period_start": "2026-02-01T00:00:00Z",
  "period_end": "2026-03-01T00:00:00Z",
  "shipments": { "used": 142, "limit": 500, "percentage": 28.4 },
  "users": { "used": 8, "limit": 15, "percentage": 53.3 },
  "escrows": { "used": 12, "limit": 50, "percentage": 24.0 },
  "api_calls": { "used": 4521, "limit": 12000, "percentage": 37.7 }
}
```

#### `POST /api/v1/billing/webhooks`

Stripe webhook endpoint. No authentication (verified via Stripe signature).

**Headers:** `Stripe-Signature: t=xxx,v1=xxx`

**Handled Event Types:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `plan_tier`, `subscription_status=active`, `stripe_subscription_id`, billing period dates |
| `customer.subscription.updated` | Update `plan_tier` (on upgrade/downgrade), `subscription_status`, billing period dates |
| `customer.subscription.deleted` | Set `plan_tier=free`, `subscription_status=canceled`, clear subscription fields |
| `invoice.payment_succeeded` | Confirm `subscription_status=active`, reset usage counters for new period |
| `invoice.payment_failed` | Set `subscription_status=past_due` |

**Response:** Always `200 OK` (Stripe expects 2xx to stop retrying)

**Error Handling:**
- Invalid signature → `400 Bad Request`
- Duplicate event (already in `webhook_events`) → `200 OK` (skip processing)
- Unhandled event type → `200 OK` (log and ignore)

---

## 5. UI/UX Design

### 5.1 Page Layout: `/[locale]/billing` (Dashboard)

```
┌────────────────────────────────────────────────────────────────┐
│  Sidebar  │                Billing Dashboard                   │
│           │                                                    │
│  ...      │  ┌──────────────────────────────────────────────┐  │
│  Billing ◀│  │  Current Plan: Pro ($49/mo)                  │  │
│  ...      │  │  Status: Active  │  Next billing: Mar 1, 2026│  │
│           │  │  [Manage Subscription]  [Change Plan]         │  │
│           │  └──────────────────────────────────────────────┘  │
│           │                                                    │
│           │  ┌──────────────────────────────────────────────┐  │
│           │  │  Usage This Period                            │  │
│           │  │                                               │  │
│           │  │  Shipments  ████████░░░░░░░░  142/500 (28%)  │  │
│           │  │  Users      ████████████░░░░   8/15  (53%)   │  │
│           │  │  Escrows    ██████░░░░░░░░░░  12/50  (24%)   │  │
│           │  └──────────────────────────────────────────────┘  │
│           │                                                    │
│           │  ┌──────────────────────────────────────────────┐  │
│           │  │  Recent Invoices                              │  │
│           │  │                                               │  │
│           │  │  Feb 2026  $49.00  Paid  [View] [PDF]        │  │
│           │  │  Jan 2026  $49.00  Paid  [View] [PDF]        │  │
│           │  │  Dec 2025  $49.00  Paid  [View] [PDF]        │  │
│           │  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Page Layout: `/[locale]/billing/pricing` (Plan Comparison)

```
┌────────────────────────────────────────────────────────────────┐
│                        Choose Your Plan                        │
│                                                                │
│  ┌────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │    Free    │  │   Pro ★ Popular │  │    Enterprise      │  │
│  │            │  │                 │  │                    │  │
│  │   $0/mo   │  │   $49/mo        │  │   $199/mo          │  │
│  │            │  │                 │  │                    │  │
│  │ 50 ship/mo│  │ 500 ship/mo     │  │ Unlimited          │  │
│  │ 3 users   │  │ 15 users        │  │ Unlimited          │  │
│  │ 5 escrows │  │ 50 escrows      │  │ Unlimited          │  │
│  │ Basic     │  │ Full Analytics  │  │ Full + Export      │  │
│  │           │  │ Whitelabel      │  │ Whitelabel         │  │
│  │           │  │ Email Support   │  │ Priority Support   │  │
│  │           │  │ Webhooks        │  │ Webhooks           │  │
│  │           │  │                 │  │                    │  │
│  │ [Current] │  │ [Upgrade]       │  │ [Upgrade]          │  │
│  └────────────┘  └─────────────────┘  └────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 User Flow

```
Billing Dashboard Flow:
  Sidebar "Billing" → /billing → View plan/usage/invoices
    → [Manage Subscription] → Stripe Billing Portal (external)
    → [Change Plan] → /billing/pricing

Subscription Flow:
  /billing/pricing → Select Plan → [Upgrade] button
    → POST /billing/checkout → Redirect to Stripe Checkout
    → Payment complete → Stripe webhook → DB updated
    → Redirect to /billing/success → Auto-redirect to /billing (3s)

Invoice Flow:
  /billing → Recent Invoices → [View] → Stripe hosted invoice page
                              → [PDF] → Download PDF directly
```

### 5.4 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `BillingDashboard` | `app/[locale]/billing/page.tsx` | Main billing page (plan, usage, invoices) |
| `PricingPage` | `app/[locale]/billing/pricing/page.tsx` | Plan comparison and upgrade CTA |
| `BillingSuccess` | `app/[locale]/billing/success/page.tsx` | Post-checkout success confirmation |
| `BillingCanceled` | `app/[locale]/billing/canceled/page.tsx` | Post-checkout cancellation |
| `PlanCard` | `app/components/PlanCard.tsx` | Individual plan tier card for pricing page |
| `UsageBar` | `app/components/UsageBar.tsx` | Progress bar for usage display |
| `InvoiceList` | `app/components/InvoiceList.tsx` | Invoice history table |
| `PlanBadge` | `app/components/PlanBadge.tsx` | Badge showing current plan tier |

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | `Invalid price ID` | Unknown price_id in checkout request | Validate against PLAN_TIERS constant |
| 400 | `No billing account` | Tenant has no stripe_customer_id (for portal/invoices) | Suggest subscribing first |
| 401 | `Not authenticated` | Missing or invalid JWT | Redirect to login |
| 402 | `Plan limit exceeded` | Usage at/over plan limit | Return limit info + upgrade URL |
| 403 | `Insufficient permissions` | Non-admin trying billing operations | Show permission error |
| 409 | `Active subscription exists` | Tenant already subscribed (use portal to change) | Redirect to Stripe Portal |
| 503 | `Billing service unavailable` | Stripe API timeout/error | Show cached data + retry later message |

### 6.2 Error Response Format

```json
{
  "detail": "Plan limit exceeded",
  "error_code": "PLAN_LIMIT_EXCEEDED",
  "context": {
    "resource": "shipments",
    "current_usage": 500,
    "plan_limit": 500,
    "plan_tier": "pro",
    "upgrade_url": "/billing/pricing"
  }
}
```

### 6.3 Usage Limit Error (HTTP 402)

```json
{
  "detail": "Shipment limit exceeded for Pro plan",
  "error_code": "PLAN_LIMIT_EXCEEDED",
  "context": {
    "resource": "shipments",
    "used": 500,
    "limit": 500,
    "plan_tier": "pro",
    "upgrade_url": "/billing/pricing"
  }
}
```

---

## 7. Security Considerations

- [x] **Stripe API keys server-only**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only in backend `.env.local`, never in `NEXT_PUBLIC_*` vars
- [x] **Webhook signature verification**: Use `stripe.Webhook.construct_event()` with raw body + signature header
- [x] **Admin-only endpoints**: All billing endpoints (except plans listing and webhooks) require `require_role("admin")`
- [x] **Idempotent webhooks**: `WebhookEvent` table prevents duplicate processing
- [x] **No card data in our system**: Stripe Checkout and Portal handle all PCI-sensitive data
- [x] **CORS protection**: Webhook endpoint excluded from CORS (Stripe server-to-server)
- [x] **Rate limiting**: Billing endpoints covered by existing slowapi rate limiter
- [x] **Input validation**: Pydantic schemas validate all request bodies

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | BillingService methods, plan constants, usage calculations | pytest |
| Unit Test | Pydantic schemas for billing requests/responses | pytest |
| Integration Test | Billing API endpoints with mock Stripe | pytest + httpx |
| Integration Test | Webhook handler with test event payloads | pytest + httpx |
| Manual Test | Full Stripe Checkout flow (test mode) | Browser + Stripe Dashboard |
| Manual Test | Billing Portal subscription management | Browser |

### 8.2 Test Cases (Key)

- [x] Happy path: Free tenant subscribes to Pro via Checkout → webhook updates DB
- [x] Happy path: Pro tenant upgrades to Enterprise via Checkout → proration applied
- [x] Happy path: Tenant views invoices → correct list returned from Stripe
- [x] Error scenario: Non-admin tries to create checkout → 403 Forbidden
- [x] Error scenario: Tenant at shipment limit creates shipment → 402 with limit info
- [x] Error scenario: Invalid webhook signature → 400 rejected
- [x] Edge case: Duplicate webhook event → 200 OK, no duplicate processing
- [x] Edge case: Stripe API down during invoice fetch → 503 with graceful message
- [x] Edge case: Free tier tenant requests portal → 400 (no Stripe customer)
- [x] Edge case: Usage counter at limit - 1 → allow, then next request → deny

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | API routes, request/response handling | `backend/app/api/endpoints/billing.py` |
| **Application** | Business logic, Stripe orchestration | `backend/app/services/billing_service.py` |
| **Domain** | Plan constants, usage rules, schemas | `backend/app/billing/plans.py`, `backend/app/schemas.py` |
| **Infrastructure** | Stripe SDK calls, DB queries | `backend/app/services/billing_service.py` (Stripe), models via SQLAlchemy |
| **Frontend Presentation** | Billing pages, components | `frontend/app/[locale]/billing/`, `frontend/app/components/` |
| **Frontend Infrastructure** | API client functions | `frontend/lib/api.ts` (billing section) |

### 9.2 Dependency Rules

```
┌──────────────────────────────────────────────────────────────┐
│                    Backend Dependency Flow                     │
│                                                               │
│   billing.py (endpoint) → billing_service.py → Stripe SDK   │
│         │                       │                             │
│         └──→ schemas.py         └──→ models.py               │
│              (Pydantic)              (SQLAlchemy)             │
│                   │                       │                   │
│                   └──→ plans.py ←─────────┘                  │
│                        (constants)                            │
│                                                               │
│   Rule: Endpoints never call Stripe directly.                 │
│         All Stripe logic lives in BillingService.             │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `billing.py` (router) | Presentation | `backend/app/api/endpoints/billing.py` |
| `BillingService` | Application | `backend/app/services/billing_service.py` |
| `PLAN_TIERS` constants | Domain | `backend/app/billing/plans.py` |
| `Billing*` schemas | Domain | `backend/app/schemas.py` |
| `Tenant` (extended) | Infrastructure | `backend/app/models.py` |
| `UsageRecord` model | Infrastructure | `backend/app/models.py` |
| `WebhookEvent` model | Infrastructure | `backend/app/models.py` |
| Billing pages | Frontend Presentation | `frontend/app/[locale]/billing/` |
| `PlanCard`, `UsageBar` | Frontend Presentation | `frontend/app/components/` |
| API client (billing) | Frontend Infrastructure | `frontend/lib/api.ts` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Python modules | snake_case | `billing_service.py`, `plans.py` |
| Python classes | PascalCase | `BillingService`, `UsageRecord` |
| Python functions | snake_case | `create_checkout_session()`, `check_plan_limit()` |
| Python constants | UPPER_SNAKE_CASE | `PLAN_TIERS`, `STRIPE_PRICE_PRO` |
| Pydantic schemas | PascalCase | `CheckoutRequest`, `SubscriptionResponse` |
| React components | PascalCase | `BillingDashboard`, `PlanCard` |
| React files | PascalCase.tsx | `PlanCard.tsx`, `UsageBar.tsx` |
| Route folders | kebab-case | `billing/`, `billing/pricing/` |
| API endpoints | kebab-case | `/api/v1/billing/checkout` |

### 10.2 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `STRIPE_SECRET_KEY` | Stripe API authentication | Server only |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Server only |
| `STRIPE_PRICE_PRO` | Pro plan Stripe price ID | Server only |
| `STRIPE_PRICE_ENTERPRISE` | Enterprise plan Stripe price ID | Server only |
| `BILLING_ENABLED` | Feature flag (default: `true`) | Server only |

### 10.3 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Service pattern | Standalone service class (like `EscrowEventSync`, `OracleService`) |
| Router registration | `v1_router.include_router(billing.router, prefix="/billing", tags=["billing"])` |
| Auth enforcement | `Depends(require_role("admin"))` on all billing endpoints except plans + webhooks |
| Error responses | Consistent `{"detail": ..., "error_code": ..., "context": {...}}` format |
| Config management | Add Stripe vars to `Settings(BaseSettings)` in `config.py` |
| Demo mode | Free tier is default in `DEMO_MODE=true`; billing endpoints return mock data |

---

## 11. Implementation Guide

### 11.1 File Structure

```
backend/
├── app/
│   ├── billing/                        # NEW: Billing domain
│   │   ├── __init__.py
│   │   └── plans.py                    # Plan tier constants & limits
│   ├── api/
│   │   └── endpoints/
│   │       └── billing.py              # NEW: Billing API routes
│   ├── services/
│   │   └── billing_service.py          # NEW: Stripe + usage logic
│   ├── models.py                       # EXTEND: Tenant + NEW: UsageRecord, WebhookEvent
│   ├── schemas.py                      # EXTEND: Billing request/response schemas
│   └── core/
│       └── config.py                   # EXTEND: Stripe env vars

frontend/
├── app/
│   ├── [locale]/
│   │   └── billing/                    # NEW: All billing pages
│   │       ├── page.tsx                # Billing dashboard
│   │       ├── layout.tsx              # Billing layout wrapper
│   │       ├── pricing/
│   │       │   └── page.tsx            # Plan comparison
│   │       ├── success/
│   │       │   └── page.tsx            # Post-checkout success
│   │       └── canceled/
│   │           └── page.tsx            # Post-checkout canceled
│   └── components/
│       ├── PlanCard.tsx                # NEW: Plan tier card
│       ├── UsageBar.tsx                # NEW: Usage progress bar
│       ├── InvoiceList.tsx             # NEW: Invoice history
│       └── PlanBadge.tsx               # NEW: Current plan badge
├── lib/
│   └── api.ts                          # EXTEND: Billing API functions
```

### 11.2 Implementation Order

#### Phase 1: Backend Foundation (Priority: High)
1. [x] Add Stripe env vars to `Settings` in `backend/app/core/config.py`
2. [x] Extend `Tenant` model with billing fields in `backend/app/models.py`
3. [x] Create `UsageRecord` model in `backend/app/models.py`
4. [x] Create `WebhookEvent` model in `backend/app/models.py`
5. [x] Create `backend/app/billing/plans.py` with `PLAN_TIERS` constant
6. [x] Add billing Pydantic schemas to `backend/app/schemas.py`

#### Phase 2: Stripe Integration (Priority: High)
7. [x] Install `stripe>=7.0.0` in `backend/requirements.txt`
8. [x] Create `backend/app/services/billing_service.py` with:
   - `get_or_create_stripe_customer(tenant)`
   - `create_checkout_session(tenant, price_id)`
   - `create_portal_session(tenant, return_url)`
   - `handle_webhook_event(payload, signature)`
   - `get_invoices(tenant, limit)`
9. [x] Create `backend/app/api/endpoints/billing.py` router
10. [x] Register billing router in `backend/app/api/api.py`

#### Phase 3: Usage Enforcement (Priority: High)
11. [x] Add `check_plan_limit(tenant_id, resource_type)` to BillingService
12. [x] Add `increment_usage(tenant_id, resource_type)` to BillingService
13. [x] Add `get_or_create_usage_record(tenant_id)` to BillingService
14. [x] Add usage enforcement to shipment/escrow/user creation endpoints
15. [x] Add usage reset logic on `invoice.payment_succeeded` webhook

#### Phase 4: Frontend (Priority: Medium)
16. [x] Add billing API functions to `frontend/lib/api.ts`
17. [x] Create `/billing` dashboard page with plan info, usage bars, invoices
18. [x] Create `/billing/pricing` page with plan comparison cards
19. [x] Create `/billing/success` page (post-checkout confirmation)
20. [x] Create `/billing/canceled` page (checkout abandonment)
21. [x] Add "Billing" link to sidebar navigation
22. [x] Add `PlanBadge` component to sidebar showing current plan

### 11.3 Plan Tier Constants

```python
# backend/app/billing/plans.py

PLAN_TIERS = {
    "free": {
        "name": "Free",
        "price_monthly": 0,
        "price_id": None,  # No Stripe subscription for free tier
        "limits": {
            "shipments_per_month": 50,
            "users": 3,
            "escrows": 5,
            "api_rate_limit": 60,  # requests per minute
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
        "price_id": None,  # Set from STRIPE_PRICE_PRO env var at runtime
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
        "price_id": None,  # Set from STRIPE_PRICE_ENTERPRISE env var at runtime
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

# Resource type mapping for usage enforcement
RESOURCE_LIMIT_MAP = {
    "shipments": "shipments_per_month",
    "users": "users",
    "escrows": "escrows",
}
```

### 11.4 Key Implementation Details

#### Webhook Handler Pseudocode

```python
async def handle_webhook_event(payload: bytes, sig_header: str, db: Session):
    # 1. Verify signature
    event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)

    # 2. Idempotency check
    existing = db.query(WebhookEvent).filter_by(stripe_event_id=event.id).first()
    if existing:
        return {"status": "already_processed"}

    # 3. Process by event type
    if event.type == "checkout.session.completed":
        session = event.data.object
        tenant = db.query(Tenant).filter_by(stripe_customer_id=session.customer).first()
        if tenant:
            sub = stripe.Subscription.retrieve(session.subscription)
            tenant.stripe_subscription_id = sub.id
            tenant.plan_tier = _price_id_to_tier(sub.items.data[0].price.id)
            tenant.subscription_status = "active"
            tenant.billing_period_start = datetime.fromtimestamp(sub.current_period_start, tz=UTC)
            tenant.billing_period_end = datetime.fromtimestamp(sub.current_period_end, tz=UTC)

    elif event.type == "customer.subscription.deleted":
        # Downgrade to free
        tenant = db.query(Tenant).filter_by(stripe_customer_id=event.data.object.customer).first()
        if tenant:
            tenant.plan_tier = "free"
            tenant.subscription_status = "canceled"
            tenant.stripe_subscription_id = None

    elif event.type == "invoice.payment_succeeded":
        # Reset usage for new billing period
        sub = event.data.object
        tenant = db.query(Tenant).filter_by(stripe_customer_id=sub.customer).first()
        if tenant:
            tenant.subscription_status = "active"
            _create_new_usage_record(db, tenant)

    elif event.type == "invoice.payment_failed":
        tenant = db.query(Tenant).filter_by(stripe_customer_id=event.data.object.customer).first()
        if tenant:
            tenant.subscription_status = "past_due"

    # 4. Record processed event
    db.add(WebhookEvent(stripe_event_id=event.id, event_type=event.type, payload=event.data.object))
    db.commit()
    return {"status": "processed"}
```

#### Usage Enforcement Pseudocode

```python
def check_plan_limit(db: Session, tenant_id: UUID, resource_type: str) -> bool:
    """Returns True if under limit, raises HTTPException(402) if exceeded."""
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    plan = PLAN_TIERS[tenant.plan_tier]
    limit_key = RESOURCE_LIMIT_MAP[resource_type]
    limit = plan["limits"][limit_key]

    if limit == -1:  # unlimited
        return True

    usage_record = get_or_create_usage_record(db, tenant_id)
    current_count = getattr(usage_record, f"{resource_type.rstrip('s')}_count", 0)
    # Note: resource_type is "shipments" → field is "shipment_count"

    if current_count >= limit:
        raise HTTPException(
            status_code=402,
            detail=f"{resource_type.capitalize()} limit exceeded for {plan['name']} plan",
            # Include context in a structured way
        )
    return True

def increment_usage(db: Session, tenant_id: UUID, resource_type: str):
    """Increment the usage counter after successful creation."""
    usage_record = get_or_create_usage_record(db, tenant_id)
    field = f"{resource_type.rstrip('s')}_count"  # shipments → shipment_count
    setattr(usage_record, field, getattr(usage_record, field) + 1)
    db.commit()
```

#### Settings Extension

```python
# backend/app/core/config.py - Add to Settings class

# --- Billing (Stripe) ---
STRIPE_SECRET_KEY: str = ""
STRIPE_WEBHOOK_SECRET: str = ""
STRIPE_PRICE_PRO: str = ""
STRIPE_PRICE_ENTERPRISE: str = ""
BILLING_ENABLED: bool = True
```

#### Frontend API Functions

```typescript
// frontend/lib/api.ts - Add billing section

// --- Billing API ---
export interface Plan {
  tier: string;
  name: string;
  price_monthly: number;
  price_id: string | null;
  limits: {
    shipments_per_month: number;
    users: number;
    escrows: number;
    api_rate_limit: number;
  };
  features: {
    analytics: string;
    whitelabel: boolean;
    email_support: boolean;
    webhook_notifications: boolean;
  };
}

export interface UsageItem {
  used: number;
  limit: number;
  percentage: number;
}

export interface SubscriptionInfo {
  tenant_id: string;
  plan_tier: string;
  subscription_status: string;
  billing_period_start: string;
  billing_period_end: string;
  usage: {
    shipments: UsageItem;
    users: UsageItem;
    escrows: UsageItem;
  };
  stripe_subscription_id: string | null;
}

export interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_url: string;
  invoice_pdf: string;
  period_start: string;
  period_end: string;
  created: string;
}

export const getPlans = () => api.get<{ plans: Plan[] }>('/v1/billing/plans');
export const getSubscription = () => api.get<SubscriptionInfo>('/v1/billing/subscription');
export const createCheckout = (priceId: string) =>
  api.post<{ checkout_url: string; session_id: string }>('/v1/billing/checkout', { price_id: priceId });
export const createPortalSession = (returnUrl: string) =>
  api.post<{ portal_url: string }>('/v1/billing/portal', { return_url: returnUrl });
export const getInvoices = (limit = 10) =>
  api.get<{ invoices: Invoice[]; has_more: boolean }>(`/v1/billing/invoices?limit=${limit}`);
export const getUsage = () => api.get('/v1/billing/usage');
```

### 11.5 Demo Mode Behavior

When `DEMO_MODE=true` (default in development):
- `GET /billing/plans` → returns plan data normally (static constants)
- `GET /billing/subscription` → returns mock Free plan with sample usage
- `POST /billing/checkout` → returns mock checkout URL (no actual Stripe call)
- `POST /billing/portal` → returns mock portal URL
- `GET /billing/invoices` → returns empty list
- `GET /billing/usage` → returns mock usage data
- Usage enforcement → disabled (no limits)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-21 | Initial draft | Development Team |
