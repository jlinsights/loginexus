# Multi-Tenant Billing Planning Document

> **Summary**: Stripe-based subscription billing, usage metering, and invoicing for LogiNexus tenants
>
> **Project**: LogiNexus
> **Version**: 0.1.0
> **Author**: Development Team
> **Date**: 2026-02-21
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Add a monetization layer to LogiNexus so tenants pay for platform usage via tiered subscription plans. This enables the platform to generate revenue, control resource usage per tenant, and provide self-service billing management.

### 1.2 Background

LogiNexus currently supports multi-tenancy (subdomain isolation, RLS, whitelabel branding) but has no billing system. All tenants use the platform for free with no usage limits. As the platform moves toward production, a billing system is essential for:

1. **Revenue generation** - Charge tenants based on their plan tier
2. **Resource control** - Limit shipments, users, and API calls per plan
3. **Self-service management** - Tenants manage their own subscriptions
4. **Usage transparency** - Tenants see what they consume and what they owe

The existing Tenant model has `id`, `name`, `subdomain`, `contact_email` but no billing-related fields. The User model has `role` (admin/member/viewer) which naturally maps to billing admin permissions.

### 1.3 Related Documents

- Architecture Design: `docs/archive/2026-02/architecture-design/` (JWT auth, API versioning, config)
- Tenant Model: `backend/app/models.py` (Tenant, User)
- API Structure: `backend/app/api/api.py` (/api/v1/ prefix)

---

## 2. Scope

### 2.1 In Scope

- [ ] Stripe Checkout integration for subscription creation
- [ ] Three-tier subscription plans (Free, Pro, Enterprise)
- [ ] Usage metering (shipments, users, escrows per billing period)
- [ ] Stripe webhook handling (subscription lifecycle events)
- [ ] Billing dashboard page (current plan, usage, invoices)
- [ ] Plan upgrade/downgrade flow
- [ ] Invoice history via Stripe API
- [ ] Tenant model extension (stripe_customer_id, plan tier, usage limits)
- [ ] Usage enforcement middleware (block actions when limit exceeded)
- [ ] Backend billing API endpoints under /api/v1/billing/

### 2.2 Out of Scope

- Custom enterprise pricing negotiation (manual process)
- Usage-based (per-shipment) billing (future enhancement; this cycle uses flat tiers)
- Crypto/blockchain payments (existing escrow system is for shipment payments, not platform billing)
- Multi-currency support (USD only for v1)
- Tax calculation (Stripe Tax can be added later)
- Mobile billing management (web only)
- Tenant self-service plan creation (admin-defined plans only)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Tenant admin can subscribe to a plan via Stripe Checkout | High | Pending |
| FR-02 | System tracks usage (shipments, users, escrows) per tenant per billing period | High | Pending |
| FR-03 | Usage limits enforced based on plan tier (block creation when exceeded) | High | Pending |
| FR-04 | Tenant admin can view current plan, usage, and invoices | High | Pending |
| FR-05 | Tenant admin can upgrade/downgrade plan | Medium | Pending |
| FR-06 | Stripe webhooks update subscription status in real-time | High | Pending |
| FR-07 | Free tier available with limited features (no credit card required) | Medium | Pending |
| FR-08 | Billing portal link for payment method management | Medium | Pending |
| FR-09 | Grace period for overdue payments before restricting access | Low | Pending |
| FR-10 | Usage reset at the start of each billing period | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | Stripe API keys never exposed to frontend | Code audit, env var check |
| Security | Webhook signatures verified (Stripe HMAC) | Integration test |
| Reliability | Webhook handler idempotent (safe to replay) | Duplicate event test |
| Performance | Usage check < 10ms (cached in memory or DB) | Request timing |
| Availability | Billing page loads even if Stripe API is down (graceful degradation) | Manual test |
| Data Integrity | Usage counts accurate within 1 billing period | Reconciliation query |

---

## 4. Plan Tier Design

### 4.1 Subscription Tiers

| Feature | Free | Pro ($49/mo) | Enterprise ($199/mo) |
|---------|------|-------------|---------------------|
| Shipments / month | 50 | 500 | Unlimited |
| Users | 3 | 15 | Unlimited |
| Escrow contracts | 5 | 50 | Unlimited |
| API rate limit | 60 req/min | 200 req/min | 500 req/min |
| Analytics dashboard | Basic | Full | Full + Export |
| Whitelabel branding | No | Yes | Yes |
| Email support | No | Yes | Priority |
| Webhook notifications | No | Yes | Yes |

### 4.2 Stripe Product Structure

```
Stripe Products:
├── LogiNexus Free        (price: $0/mo, no Stripe subscription needed)
├── LogiNexus Pro          (price_id: price_pro_monthly)
│   └── $49/month, recurring
└── LogiNexus Enterprise   (price_id: price_enterprise_monthly)
    └── $199/month, recurring
```

### 4.3 Usage Enforcement Logic

```
On shipment/user/escrow creation:
1. Get tenant's current plan tier
2. Get current period usage count
3. If count >= plan limit → HTTP 402 "Plan limit exceeded"
4. If count < plan limit → proceed with creation
```

---

## 5. System Design Overview

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  Billing Page → Pricing → Checkout → Portal → Invoices  │
├─────────────────────────────────────────────────────────┤
│                    Backend (FastAPI)                      │
│  /api/v1/billing/* → Stripe SDK → Usage Enforcement     │
├─────────────────────────────────────────────────────────┤
│                    External Services                     │
│  Stripe API → Webhooks → Customer Portal                │
├─────────────────────────────────────────────────────────┤
│                    Database                               │
│  Tenant (extended) + UsageRecord + SubscriptionEvent     │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow

```
Subscription Flow:
  Tenant Admin → Pricing Page → Stripe Checkout → Webhook → DB Update

Usage Tracking Flow:
  API Request → UsageMiddleware → Check Limit → Allow/Deny → Increment Counter

Invoice Flow:
  Tenant Admin → Billing Dashboard → Stripe API → Invoice List
```

### 5.3 New Database Models

```
Tenant (extend existing):
  + stripe_customer_id: String (nullable)
  + plan_tier: String (default: "free")  # free, pro, enterprise
  + subscription_status: String (default: "active")  # active, past_due, canceled, trialing
  + stripe_subscription_id: String (nullable)
  + billing_period_start: DateTime (nullable)
  + billing_period_end: DateTime (nullable)

UsageRecord (new):
  id: UUID PK
  tenant_id: UUID FK → Tenant
  period_start: DateTime
  period_end: DateTime
  shipment_count: Integer (default: 0)
  user_count: Integer (default: 0)
  escrow_count: Integer (default: 0)
  api_call_count: Integer (default: 0)
  created_at: DateTime
  updated_at: DateTime
```

### 5.4 API Endpoints

```
GET    /api/v1/billing/plans          → List available plans
GET    /api/v1/billing/subscription   → Current tenant subscription + usage
POST   /api/v1/billing/checkout       → Create Stripe Checkout session
POST   /api/v1/billing/portal         → Create Stripe Billing Portal session
GET    /api/v1/billing/invoices       → List tenant invoices from Stripe
GET    /api/v1/billing/usage          → Current period usage breakdown
POST   /api/v1/billing/webhooks       → Stripe webhook handler (no auth)
```

### 5.5 Frontend Pages

```
/[locale]/billing              → Billing dashboard (plan, usage, invoices)
/[locale]/billing/pricing      → Plan comparison + upgrade/downgrade
/[locale]/billing/success      → Post-checkout success page
/[locale]/billing/canceled     → Post-checkout canceled page
```

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] Tenant can subscribe to Pro/Enterprise via Stripe Checkout
- [ ] Usage counts tracked accurately per billing period
- [ ] Plan limits enforced (HTTP 402 when exceeded)
- [ ] Billing dashboard shows current plan, usage, invoices
- [ ] Stripe webhooks process subscription events correctly
- [ ] Free tier works without credit card
- [ ] Upgrade/downgrade triggers Stripe proration
- [ ] All billing endpoints protected by admin role

### 6.2 Quality Criteria

- [ ] Zero lint/type errors in new code
- [ ] Stripe webhook handler is idempotent
- [ ] Webhook signature verification active
- [ ] Usage enforcement adds < 10ms latency per request
- [ ] Billing page loads within 2 seconds

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Stripe API rate limits during high traffic | Medium | Low | Cache plan data locally; batch usage updates |
| Webhook delivery failures (missed events) | High | Low | Idempotent handlers; Stripe auto-retry; reconciliation cron |
| Usage count drift (missed increments) | Medium | Medium | DB trigger or post-commit hook; periodic reconciliation |
| Free tier abuse (bulk account creation) | Medium | Medium | Rate limit tenant creation; require email verification |
| Stripe secret key exposure | Critical | Low | Server-only env var; never in frontend bundle |
| Plan limit check adds latency | Low | Medium | Cache plan limits in memory; lazy refresh on webhook |
| Demo mode conflict with billing | Medium | High | Free tier is default in DEMO_MODE; billing endpoints return mock data |

---

## 8. Architecture Considerations

### 8.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend, SaaS MVPs | X |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | |

### 8.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Payment processor | Stripe / PayPal / Paddle | Stripe | Best developer API, subscription support, webhook reliability |
| Billing model | Flat tier / Usage-based / Hybrid | Flat tier | Simpler for v1; usage-based can be added later |
| Usage tracking | Real-time counter / Periodic aggregation | Real-time counter | Immediate enforcement; DB increment on each action |
| Plan storage | Hardcoded / DB / Stripe metadata | Hardcoded + Stripe | Plan limits in code constants; prices in Stripe |
| Frontend integration | Stripe Elements / Checkout / Portal | Checkout + Portal | Minimal frontend code; PCI compliance offloaded to Stripe |

### 8.3 Stripe Integration Pattern

```
Backend-Only Pattern (recommended for security):

Frontend:
  → Calls /api/v1/billing/checkout
  → Receives Stripe Checkout URL
  → Redirects to Stripe-hosted page

Backend:
  → Creates Stripe Customer (if none)
  → Creates Checkout Session
  → Returns checkout URL
  → Handles webhooks
  → Queries invoices

No Stripe.js SDK needed in frontend (Checkout is redirect-based)
```

---

## 9. Convention Prerequisites

### 9.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration (eslint-config-next)
- [x] TypeScript configuration (tsconfig.json)
- [x] Pydantic-settings for config management
- [x] API versioning at /api/v1/

### 9.2 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `STRIPE_SECRET_KEY` | Stripe API authentication | Server | X |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Server | X |
| `STRIPE_PRICE_PRO` | Pro plan price ID | Server | X |
| `STRIPE_PRICE_ENTERPRISE` | Enterprise plan price ID | Server | X |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key (if needed) | Client | X |
| `BILLING_ENABLED` | Feature flag to enable/disable billing | Server | X |

---

## 10. Dependencies

### Backend
```
stripe>=7.0.0              # Stripe Python SDK
```

### Frontend
```
# No new dependencies needed
# Stripe Checkout is redirect-based (no @stripe/stripe-js required)
```

---

## 11. Implementation Priority

### Phase 1: Backend Foundation
1. Extend Tenant model with billing fields
2. Create UsageRecord model
3. Add Stripe config to Settings
4. Create billing service module
5. Implement plan constants and limits

### Phase 2: Stripe Integration
6. Stripe customer creation on tenant registration
7. Checkout session creation endpoint
8. Webhook handler (subscription events)
9. Billing portal session endpoint
10. Invoice listing endpoint

### Phase 3: Usage Enforcement
11. Usage tracking middleware/hooks
12. Plan limit enforcement on create endpoints
13. Usage reset on billing period start
14. Usage dashboard endpoint

### Phase 4: Frontend
15. Billing dashboard page
16. Pricing comparison page
17. Post-checkout success/canceled pages
18. Usage progress bars and charts
19. Upgrade/downgrade UI flow

---

## 12. Next Steps

1. [ ] Write design document (`multi-tenant-billing.design.md`)
2. [ ] Create Stripe account and products (manual step)
3. [ ] Start implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-21 | Initial draft | Development Team |
