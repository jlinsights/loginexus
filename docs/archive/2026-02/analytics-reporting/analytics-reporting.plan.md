# Analytics & Reporting Planning Document

> **Summary**: KPI dashboard with shipment analytics, cost trends, and exportable reports for logistics insights
>
> **Project**: LogiNexus
> **Version**: 1.0
> **Author**: Claude
> **Date**: 2026-02-16
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Provide tenant-level analytics and reporting capabilities so logistics managers can track shipment performance, identify bottlenecks, and make data-driven decisions. Currently, the dashboard only shows a real-time list of shipments with no aggregated metrics or historical trends.

### 1.2 Background

LogiNexus has a functional shipment tracking system with multi-tenancy, but lacks any analytical layer. Users cannot see KPIs (on-time delivery rate, average transit time), cost breakdowns, or route performance. Adding analytics transforms the platform from a tracking tool into a decision-support system.

### 1.3 Related Documents

- CLAUDE.md (project architecture)
- `docs/archive/2026-02/smart-contract-escrow/` (completed escrow feature)

---

## 2. Scope

### 2.1 In Scope

- [ ] KPI summary cards (total shipments, in-transit, delivered, on-time rate)
- [ ] Shipment volume chart (daily/weekly/monthly trends)
- [ ] Status distribution chart (pie/donut)
- [ ] Route performance table (origin-destination pairs with avg transit time)
- [ ] Escrow payment summary (total volume, pending, completed)
- [ ] Date range filter for all analytics
- [ ] Export to CSV
- [ ] Backend analytics API endpoints
- [ ] Tenant-scoped data isolation for analytics

### 2.2 Out of Scope

- Predictive analytics / ML-based forecasting
- Custom report builder (drag-and-drop)
- Email-scheduled reports
- Cross-tenant comparison (admin-level analytics)
- Real-time streaming analytics (WebSocket)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | KPI summary cards showing total, in-transit, delivered, on-time rate | High | Pending |
| FR-02 | Time-series chart for shipment volume (daily/weekly/monthly) | High | Pending |
| FR-03 | Status distribution chart (pie/donut breakdown) | High | Pending |
| FR-04 | Route performance table with avg transit time per route | Medium | Pending |
| FR-05 | Escrow payment summary (total USDC volume, status breakdown) | Medium | Pending |
| FR-06 | Date range picker to filter all analytics data | High | Pending |
| FR-07 | CSV export for shipment and analytics data | Medium | Pending |
| FR-08 | All analytics data scoped to current tenant | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Analytics API response < 500ms for 10K shipments | Backend load testing |
| Performance | Chart rendering < 1s on initial load | Lighthouse/browser profiling |
| Responsiveness | Full mobile support for all charts | Manual + Playwright viewport tests |
| Accessibility | Chart data accessible via screen readers (alt text, data tables) | WCAG 2.1 AA audit |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] All functional requirements implemented
- [ ] Backend analytics endpoints with proper tenant isolation
- [ ] Frontend charts rendering correctly with real data
- [ ] Date range filter working across all analytics views
- [ ] CSV export functional
- [ ] TypeScript types fully defined
- [ ] Code review completed

### 4.2 Quality Criteria

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Build succeeds (`NODE_ENV=production npx next build`)
- [ ] API endpoints documented in Swagger

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Large dataset slow queries | High | Medium | Add DB indexes on `created_at`, `current_status`, `tenant_id`; use SQL aggregations |
| Chart library bundle size | Medium | Medium | Use lightweight library (Recharts); lazy-load analytics page |
| No historical shipment data for demo | Low | High | Extend seed script to generate historical data with varied dates/statuses |
| Tenant data leakage in analytics | High | Low | Reuse existing TenantMiddleware; test with multiple tenants |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend, SaaS MVPs | **x** |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Chart Library | Recharts / Chart.js / Nivo | Recharts | React-native, lightweight, Tailwind-friendly |
| Analytics API | Dedicated endpoints / Extend existing | Dedicated `/api/analytics/` | Separation of concerns from CRUD endpoints |
| Date Handling | date-fns / dayjs / native | date-fns | Lightweight, tree-shakeable, already common in Next.js |
| CSV Export | Client-side / Server-side | Client-side | Simpler; data already fetched for charts |
| Data Fetching | Polling / On-demand | On-demand with cache | Analytics don't need real-time polling |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Frontend:
  frontend/app/dashboard/analytics/    # Analytics page
  frontend/app/components/analytics/   # Chart components
  frontend/lib/api.ts                  # Extended with analytics endpoints

Backend:
  backend/app/api/endpoints/analytics.py  # Analytics route handlers
  backend/app/crud/analytics.py           # SQL aggregation queries
  backend/app/schemas.py                  # Extended with analytics schemas
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists
- [x] ESLint configuration (next.config)
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Tailwind CSS for styling

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | Exists (PascalCase components) | Analytics component naming | High |
| **Folder structure** | Exists (app router) | `analytics/` sub-route | High |
| **API patterns** | Exists (REST, axios) | Analytics endpoint conventions | Medium |
| **Chart styling** | Missing | Chart color palette matching tenant branding | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_API_URL` | API endpoint | Client | Exists |
| `DATABASE_URL` | DB connection | Server | Exists |

No new environment variables required.

---

## 8. Next Steps

1. [ ] Write design document (`analytics-reporting.design.md`)
2. [ ] Review and approve plan
3. [ ] Start implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-16 | Initial draft | Claude |
