# Analytics & Reporting Design Document

> **Summary**: KPI dashboard with shipment analytics, cost trends, and CSV export for logistics insights
>
> **Project**: LogiNexus
> **Version**: 1.0
> **Author**: Claude
> **Date**: 2026-02-16
> **Status**: Draft
> **Planning Doc**: [analytics-reporting.plan.md](../../01-plan/features/analytics-reporting.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A |
| Phase 2 | Coding Conventions | N/A |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | Defined below |

---

## 1. Overview

### 1.1 Design Goals

- Provide tenant-scoped shipment analytics via dedicated backend endpoints
- Render interactive charts (time-series, distribution, route table) on a new analytics page
- Support date range filtering across all analytics data
- Enable CSV export of filtered data
- Maintain existing architecture patterns (FastAPI + Next.js App Router)

### 1.2 Design Principles

- **Reuse existing patterns**: Follow the same CRUD/endpoint/schema pattern used by shipments and escrows
- **Server-side aggregation**: SQL-level aggregation for performance (not client-side)
- **Lazy loading**: Analytics page loaded dynamically to keep main dashboard fast
- **Tenant isolation**: All queries filtered by `tenant_id` from middleware

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  /dashboard/analytics (page.tsx)                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │ KpiCards │ │VolChart │ │StatusPie │ │RouteTable    │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌──────────────┐ ┌──────────────┐                        │  │
│  │  │EscrowSummary │ │DateRangeBar │                        │  │
│  │  └──────────────┘ └──────────────┘                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│  lib/api.ts  (analytics API functions)                           │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP (axios)
┌──────────────────────────────▼───────────────────────────────────┐
│  Backend (FastAPI)                                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  /api/analytics/*                                        │    │
│  │  endpoints/analytics.py → crud/analytics.py → PostgreSQL │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User selects date range
  → DateRangeBar updates query params
  → React Query fetches /api/analytics/summary?start=...&end=...
  → TenantMiddleware injects tenant_id
  → crud/analytics.py runs SQL aggregation
  → JSON response → Charts render
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Analytics page | React Query, Recharts | Data fetching + chart rendering |
| Backend endpoints | SQLAlchemy, existing models | SQL aggregation queries |
| DateRangeBar | react-day-picker (via shadcn) or native input[type=date] | Date selection |
| CSV export | Client-side blob generation | No new backend dependency |

**New npm dependencies**:
- `recharts` - Lightweight React charting library

**No new Python dependencies** (uses existing SQLAlchemy).

---

## 3. Data Model

### 3.1 Response Types (no new DB tables)

Analytics are computed from existing `shipments` and `payment_escrows` tables via SQL aggregation. No new tables required.

```typescript
// Analytics summary KPIs
interface AnalyticsSummary {
  total_shipments: number;
  in_transit: number;
  delivered: number;
  booked: number;
  on_time_rate: number;        // percentage (0-100)
  avg_transit_days: number;
}

// Time-series data point
interface VolumeDataPoint {
  date: string;                // "2026-02-16" or "2026-W07"
  count: number;
  status_booked: number;
  status_in_transit: number;
  status_delivered: number;
}

// Status distribution
interface StatusDistribution {
  status: string;              // "BOOKED" | "In Transit" | "Delivered"
  count: number;
  percentage: number;
}

// Route performance
interface RoutePerformance {
  origin: string;
  destination: string;
  shipment_count: number;
  avg_transit_days: number;
  on_time_rate: number;
}

// Escrow summary
interface EscrowSummary {
  total_volume_usdc: number;
  escrow_count: number;
  status_breakdown: {
    status: string;            // "created" | "funded" | "released" | "disputed" | "refunded"
    count: number;
    volume_usdc: number;
  }[];
}
```

### 3.2 Entity Relationships

```
[Shipment] ──→ aggregated into ──→ [AnalyticsSummary, VolumeDataPoint, StatusDistribution, RoutePerformance]
[PaymentEscrow] ──→ aggregated into ──→ [EscrowSummary]
All filtered by [Tenant].id via TenantMiddleware
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/analytics/summary | KPI summary (total, in-transit, delivered, on-time rate) | Tenant middleware |
| GET | /api/analytics/volume | Shipment volume time-series | Tenant middleware |
| GET | /api/analytics/status-distribution | Status breakdown (pie chart data) | Tenant middleware |
| GET | /api/analytics/route-performance | Top routes with avg transit time | Tenant middleware |
| GET | /api/analytics/escrow-summary | Escrow payment summary | Tenant middleware |

### 4.2 Common Query Parameters

All endpoints accept:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start_date` | string (YYYY-MM-DD) | 30 days ago | Start of date range |
| `end_date` | string (YYYY-MM-DD) | today | End of date range |
| `granularity` | string | "daily" | For volume endpoint: "daily" / "weekly" / "monthly" |

### 4.3 Detailed Specifications

#### `GET /api/analytics/summary`

**Response (200):**
```json
{
  "total_shipments": 156,
  "in_transit": 42,
  "delivered": 98,
  "booked": 16,
  "on_time_rate": 87.5,
  "avg_transit_days": 12.3
}
```

#### `GET /api/analytics/volume?granularity=daily`

**Response (200):**
```json
[
  {
    "date": "2026-02-14",
    "count": 8,
    "status_booked": 2,
    "status_in_transit": 3,
    "status_delivered": 3
  }
]
```

#### `GET /api/analytics/status-distribution`

**Response (200):**
```json
[
  { "status": "BOOKED", "count": 16, "percentage": 10.3 },
  { "status": "In Transit", "count": 42, "percentage": 26.9 },
  { "status": "Delivered", "count": 98, "percentage": 62.8 }
]
```

#### `GET /api/analytics/route-performance`

**Response (200):**
```json
[
  {
    "origin": "Shanghai",
    "destination": "Los Angeles",
    "shipment_count": 45,
    "avg_transit_days": 14.2,
    "on_time_rate": 82.0
  }
]
```

#### `GET /api/analytics/escrow-summary`

**Response (200):**
```json
{
  "total_volume_usdc": 250000.00,
  "escrow_count": 32,
  "status_breakdown": [
    { "status": "funded", "count": 12, "volume_usdc": 95000.00 },
    { "status": "released", "count": 18, "volume_usdc": 145000.00 },
    { "status": "disputed", "count": 2, "volume_usdc": 10000.00 }
  ]
}
```

**Error Responses (all endpoints):**
- `400 Bad Request`: Invalid date format
- `500 Internal Server Error`: Database query failure

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar  │  Analytics & Reporting                              │
│           │─────────────────────────────────────────────────────│
│  Dashboard│  [DateRangeBar: 📅 Feb 1 - Feb 16 ▾]  [Export CSV] │
│  Analytics│─────────────────────────────────────────────────────│
│  ...      │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│           │  │ Total   │ │In-Trans │ │Delivered│ │On-Time  │ │
│           │  │  156    │ │   42    │ │   98    │ │  87.5%  │ │
│           │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│           │─────────────────────────────────────────────────────│
│           │  ┌──────────────────────┐ ┌────────────────────┐   │
│           │  │  Shipment Volume     │ │  Status Breakdown  │   │
│           │  │  [Bar/Line Chart]    │ │  [Donut Chart]     │   │
│           │  │  Daily ▾             │ │                    │   │
│           │  └──────────────────────┘ └────────────────────┘   │
│           │─────────────────────────────────────────────────────│
│           │  ┌──────────────────────────────────────────────┐  │
│           │  │  Route Performance Table                      │  │
│           │  │  Origin | Destination | Count | Avg Days | %  │  │
│           │  │  Shanghai | LA        |  45   |  14.2    | 82 │  │
│           │  └──────────────────────────────────────────────┘  │
│           │─────────────────────────────────────────────────────│
│           │  ┌──────────────────────────────────────────────┐  │
│           │  │  Escrow Payment Summary                       │  │
│           │  │  Total: $250,000 USDC  |  32 escrows          │  │
│           │  │  [Horizontal bar: funded | released | disputed]│  │
│           │  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
Dashboard → Click "Analytics" in sidebar
  → Analytics page loads with default 30-day range
  → User adjusts date range → All charts re-fetch
  → User clicks "Export CSV" → Downloads filtered data
  → User toggles granularity (daily/weekly/monthly) on volume chart
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `AnalyticsPage` | `frontend/app/dashboard/analytics/page.tsx` | Page layout, date state, data fetching |
| `KpiCards` | `frontend/app/components/analytics/KpiCards.tsx` | 4 summary metric cards |
| `VolumeChart` | `frontend/app/components/analytics/VolumeChart.tsx` | Bar/Line chart with granularity toggle |
| `StatusPieChart` | `frontend/app/components/analytics/StatusPieChart.tsx` | Donut chart for status distribution |
| `RouteTable` | `frontend/app/components/analytics/RouteTable.tsx` | Sortable route performance table |
| `EscrowSummaryCard` | `frontend/app/components/analytics/EscrowSummaryCard.tsx` | Escrow totals + status bar |
| `DateRangeBar` | `frontend/app/components/analytics/DateRangeBar.tsx` | Date pickers + export button |
| `ExportCsvButton` | `frontend/app/components/analytics/ExportCsvButton.tsx` | Client-side CSV generation |

---

## 6. Error Handling

### 6.1 Error Scenarios

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid date range | `start_date > end_date` or bad format | Show inline error, keep previous data |
| 500 | Analytics unavailable | DB query failure | Show error state with retry button |
| Network | Connection failed | Backend unreachable | React Query error state, auto-retry |

### 6.2 Frontend Error States

- **Loading**: Skeleton placeholders for each card/chart
- **Error**: "Unable to load analytics. Please try again." with retry button
- **Empty**: "No shipment data found for this date range." with suggestion to adjust dates

---

## 7. Security Considerations

- [x] Tenant isolation via existing TenantMiddleware (same pattern as shipments)
- [x] Input validation for date parameters (Pydantic)
- [x] No sensitive data exposed (aggregated counts only)
- [ ] Rate limiting (not implemented yet, low risk for analytics)
- [x] SQL injection prevention via SQLAlchemy parameterized queries

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Manual API Test | Backend analytics endpoints | Swagger UI / curl |
| Manual UI Test | Chart rendering, date filtering | Browser |
| Build Verification | TypeScript compilation, Next.js build | `npx tsc --noEmit`, `next build` |

### 8.2 Test Cases (Key)

- [ ] Summary endpoint returns correct counts matching DB data
- [ ] Volume endpoint respects date range filter
- [ ] Volume endpoint granularity (daily/weekly/monthly) returns correct grouping
- [ ] Route performance calculates avg transit days correctly
- [ ] Escrow summary totals match sum of individual escrows
- [ ] Tenant isolation: tenant A cannot see tenant B analytics
- [ ] Empty data: all endpoints return valid empty responses
- [ ] CSV export contains same data visible in charts
- [ ] Charts render without errors on mobile viewport

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | Analytics page, chart components | `frontend/app/dashboard/analytics/`, `frontend/app/components/analytics/` |
| **Infrastructure** | API client functions | `frontend/lib/api.ts` (extended) |
| **Backend API** | Route handlers | `backend/app/api/endpoints/analytics.py` |
| **Backend CRUD** | SQL aggregation queries | `backend/app/crud/analytics.py` |
| **Backend Schemas** | Pydantic response models | `backend/app/schemas.py` (extended) |

### 9.2 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| AnalyticsPage | Presentation | `frontend/app/dashboard/analytics/page.tsx` |
| KpiCards, VolumeChart, etc. | Presentation | `frontend/app/components/analytics/*.tsx` |
| fetchAnalytics* functions | Infrastructure | `frontend/lib/api.ts` |
| analytics router | Backend API | `backend/app/api/endpoints/analytics.py` |
| analytics CRUD | Backend Data | `backend/app/crud/analytics.py` |
| Analytics* schemas | Backend Domain | `backend/app/schemas.py` |

---

## 10. Coding Convention Reference

### 10.1 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase (`KpiCards.tsx`, `VolumeChart.tsx`) |
| File organization | `components/analytics/` subdirectory |
| State management | React Query for server state, `useState` for local (date range, granularity) |
| Error handling | React Query `isError` + retry, backend Pydantic validation |
| Styling | Tailwind CSS classes, consistent with existing dashboard components |
| Chart colors | Slate/blue palette matching LogiNexus brand (`#1E40AF` primary) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── api.py                    # Add analytics router
│   │   └── endpoints/
│   │       └── analytics.py          # NEW: analytics endpoint handlers
│   ├── crud/
│   │       └── analytics.py          # NEW: SQL aggregation queries
│   └── schemas.py                    # EXTEND: add analytics response schemas

frontend/
├── app/
│   ├── dashboard/
│   │   └── analytics/
│   │       └── page.tsx              # NEW: analytics page
│   └── components/
│       └── analytics/
│           ├── KpiCards.tsx           # NEW
│           ├── VolumeChart.tsx        # NEW
│           ├── StatusPieChart.tsx     # NEW
│           ├── RouteTable.tsx         # NEW
│           ├── EscrowSummaryCard.tsx  # NEW
│           ├── DateRangeBar.tsx       # NEW
│           └── ExportCsvButton.tsx    # NEW
├── lib/
│   └── api.ts                        # EXTEND: add analytics fetch functions
```

### 11.2 Implementation Order

1. [ ] **Backend schemas** - Add Pydantic response models to `schemas.py`
2. [ ] **Backend CRUD** - Create `crud/analytics.py` with SQL aggregation queries
3. [ ] **Backend endpoints** - Create `endpoints/analytics.py` and register in `api.py`
4. [ ] **Verify backend** - Test all 5 endpoints via Swagger UI
5. [ ] **Install Recharts** - `npm install recharts` in frontend/
6. [ ] **Frontend API** - Add analytics fetch functions to `lib/api.ts`
7. [ ] **DateRangeBar** - Date pickers + export button component
8. [ ] **KpiCards** - 4 summary metric cards
9. [ ] **VolumeChart** - Bar chart with granularity toggle
10. [ ] **StatusPieChart** - Donut chart
11. [ ] **RouteTable** - Sortable performance table
12. [ ] **EscrowSummaryCard** - Escrow totals + status breakdown
13. [ ] **ExportCsvButton** - Client-side CSV generation
14. [ ] **Analytics page** - Compose all components, wire date state
15. [ ] **Sidebar navigation** - Add "Analytics" link to Sidebar component
16. [ ] **Build verification** - `npx tsc --noEmit` + `NODE_ENV=production npx next build`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-16 | Initial draft | Claude |
