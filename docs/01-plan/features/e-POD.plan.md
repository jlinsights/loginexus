# e-POD (Electronic Proof of Delivery) Planning Document

> **Summary**: Complete the e-POD feature with backend API hardening, file storage, POD history/verification, admin dashboard, and driver-facing mobile-optimized UX
>
> **Project**: LogiNexus
> **Version**: 0.1.0
> **Author**: Development Team
> **Date**: 2026-02-21
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Enhance the existing Electronic Proof of Delivery (e-POD) feature into a production-ready system. Currently, a basic frontend component and backend endpoint exist but lack file storage (photos stored as base64 in DB), POD retrieval/verification endpoints, admin visibility, driver notification flow, and proper error handling. This plan addresses all gaps to make e-POD a reliable, auditable delivery confirmation system.

### 1.2 Background

LogiNexus already has partial e-POD implementation:

**Existing Code:**
- **Frontend component**: `frontend/app/components/ElectronicPOD.tsx` - Signature canvas + photo upload + geolocation capture
- **Frontend page**: `frontend/app/[locale]/pod/[trackingId]/page.tsx` - Standalone POD entry page
- **Backend endpoint**: `POST /api/v1/shipments/{tracking_number}/pod` in `shipments.py` - Accepts signature, photos (base64), GPS coordinates
- **Data model**: Shipment model has `pod_signature`, `pod_photos` (JSONB), `pod_location` (JSONB), `pod_timestamp` fields
- **Schema**: `ShipmentResponse` includes POD fields
- **Dependency**: `react-signature-canvas` already installed
- **Oracle integration**: POD upload triggers `oracle_service.confirm_delivery()` for blockchain settlement

**Key Gaps:**
1. Photos stored as base64 strings in JSONB (DB bloat, not scalable)
2. No POD retrieval/verification API endpoints
3. No admin dashboard to view/verify POD submissions
4. No driver notification flow (SMS/email link to POD page)
5. No file size validation or image compression
6. No POD status tracking (pending, submitted, verified, disputed)
7. Frontend uses raw `fetch()` instead of project's Axios client (`lib/api.ts`)
8. No i18n support on POD component/page
9. No offline capability for drivers in areas with poor connectivity
10. Geolocation error handling is basic (no retry, no manual entry fallback)

### 1.3 Related Documents

- Existing POD component: `frontend/app/components/ElectronicPOD.tsx`
- Shipment model: `backend/app/models.py` (pod_* fields at line 46-50)
- Shipment endpoint: `backend/app/api/endpoints/shipments.py` (upload_pod at line 162)
- Oracle service: `backend/app/services/oracle_service.py`
- Architecture: `docs/archive/2026-02/architecture-design/`

---

## 2. Scope

### 2.1 In Scope

- [ ] Refactor photo storage from base64-in-DB to file system / object storage URLs
- [ ] Add POD retrieval endpoint (`GET /shipments/{tracking}/pod`)
- [ ] Add POD verification endpoint (`POST /shipments/{tracking}/pod/verify`)
- [ ] Add POD status tracking (submitted, verified, disputed)
- [ ] Create admin POD dashboard page (list + detail view)
- [ ] Add file size validation and image compression (client-side)
- [ ] Migrate frontend POD component to use `lib/api.ts` Axios client
- [ ] Add i18n support to POD component and pages
- [ ] Add receiver name/ID input field to POD form
- [ ] Add timestamp display and timezone handling
- [ ] Improve geolocation UX (retry, accuracy indicator, fallback)
- [ ] Add POD notification system (generate shareable POD link)
- [ ] Add POD summary/receipt view (read-only confirmation page)
- [ ] Usage enforcement integration (POD counts toward shipment usage in billing)

### 2.2 Out of Scope

- Offline-first PWA capability (future enhancement)
- OCR for document scanning (future enhancement)
- Video recording for proof of delivery
- Integration with external document management systems
- Native mobile app (Capacitor) POD flow (separate feature)
- Real-time delivery tracking linked to POD (existing tracking feature handles this)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Driver captures delivery photos (max 5, compressed to 800px max dimension) | High | Existing (partial) |
| FR-02 | Receiver signs on digital signature pad | High | Existing |
| FR-03 | System captures GPS coordinates at POD submission | High | Existing |
| FR-04 | Photos stored as file URLs (not base64 in DB) | High | Pending |
| FR-05 | Receiver name and contact info captured | High | Pending |
| FR-06 | Admin can view all POD submissions with filters | High | Pending |
| FR-07 | Admin can verify or dispute a POD | Medium | Pending |
| FR-08 | POD retrieval endpoint returns full POD details | High | Pending |
| FR-09 | Shareable POD verification link (public read-only) | Medium | Pending |
| FR-10 | POD status lifecycle (submitted -> verified / disputed) | Medium | Pending |
| FR-11 | POD timestamp with timezone (UTC stored, local displayed) | Medium | Pending |
| FR-12 | i18n support for POD component (ko/en) | Medium | Pending |
| FR-13 | Image compression before upload (< 500KB per photo) | Medium | Pending |
| FR-14 | POD submission triggers shipment status change to DELIVERED | High | Existing |
| FR-15 | POD submission triggers oracle settlement (blockchain) | High | Existing |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | POD upload completes in < 5s on 4G network | Network timing |
| Performance | Image compression < 500ms per photo | Client-side timing |
| Storage | Photos stored as file URLs, not base64 blobs | DB inspection |
| Security | POD page accessible without full auth (driver link) | Route test |
| Security | Admin POD actions require admin role | Auth check |
| Reliability | POD upload retries on network failure (3 attempts) | Error handling test |
| Accessibility | Signature pad works on touch devices (mobile-first) | Device testing |
| Data Integrity | POD data immutable after verification | API test |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Photo storage migrated from base64 to file URLs
- [ ] POD retrieval and verification endpoints working
- [ ] Admin POD dashboard with list/detail views
- [ ] Frontend component uses lib/api.ts and i18n
- [ ] Receiver name captured and stored
- [ ] Image compression working client-side
- [ ] POD status lifecycle implemented
- [ ] Zero lint/type errors
- [ ] Existing oracle settlement still triggers correctly

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] TypeScript compilation passes
- [ ] POD upload works on mobile (touch signature + camera)
- [ ] POD data displays correctly in admin dashboard

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Large photo files cause slow uploads | Medium | High | Client-side compression to < 500KB; max 5 photos |
| Base64 migration breaks existing POD data | High | Medium | Keep base64 backward compatibility in retrieval; migrate on read |
| GPS accuracy varies by device | Medium | High | Show accuracy indicator; allow manual location override |
| Signature pad not responsive on all mobile devices | Medium | Medium | Test on iOS Safari + Chrome Android; use tested library |
| Oracle settlement fails on POD | High | Low | Already handled by background task with error logging |
| File storage not available | High | Low | Use local file system for dev; object storage for production |
| Driver has no account (POD page is public-ish) | Medium | High | POD page uses tracking number as auth; no full login required |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend, SaaS MVPs | X |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Photo storage | Base64 in DB / Local filesystem / S3 / Supabase Storage | Local filesystem (dev) + configurable path | Simplest for v1; base64 removal is the priority |
| Image compression | Server-side / Client-side / Both | Client-side (browser Canvas API) | Reduces upload time and server load |
| POD page auth | Full JWT / Tracking number only / Magic link | Tracking number only | Drivers don't have accounts; link shared via SMS |
| Signature format | PNG base64 / SVG / Canvas data | PNG base64 (keep existing) | Already implemented; compact enough for signatures |
| POD status | Shipment status field / Separate POD model / Shipment + enum | Shipment fields (pod_status enum) | Keep it simple; POD is 1:1 with shipment |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Backend:
  backend/app/services/pod_service.py       # NEW: POD business logic (upload, verify, retrieve)
  backend/app/api/endpoints/shipments.py    # EXTEND: POD retrieval + verification endpoints
  backend/app/models.py                     # EXTEND: pod_status, pod_receiver_name fields
  backend/app/schemas.py                    # EXTEND: POD request/response schemas
  backend/app/core/storage.py              # NEW: File storage abstraction (local + S3 ready)

Frontend:
  frontend/app/components/ElectronicPOD.tsx # REFACTOR: Use api.ts, add compression, i18n
  frontend/app/[locale]/pod/               # EXTEND: POD entry page improvements
  frontend/app/[locale]/dashboard/pod/     # NEW: Admin POD dashboard
  frontend/app/components/PODDetail.tsx     # NEW: POD detail/verification view
  frontend/app/components/PODList.tsx       # NEW: POD submissions list
  frontend/lib/api.ts                      # EXTEND: POD API functions
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration (eslint-config-next)
- [x] TypeScript configuration (tsconfig.json)
- [x] Pydantic-settings for config management
- [x] API versioning at /api/v1/

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **File storage** | base64 in DB | File path convention + storage abstraction | High |
| **POD status enum** | Missing | submitted / verified / disputed | High |
| **Image naming** | N/A | `{tracking}_{timestamp}_{index}.jpg` | Medium |
| **POD page auth** | None | Tracking number as implicit auth | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `POD_STORAGE_PATH` | Local file storage directory for POD photos | Server | X |
| `POD_STORAGE_BACKEND` | Storage backend type (local / s3) | Server | X |
| `POD_MAX_PHOTOS` | Maximum photos per POD (default: 5) | Server | X |
| `POD_MAX_FILE_SIZE_MB` | Max file size per photo in MB (default: 5) | Server | X |

---

## 8. Dependencies

### Backend
```
# No new dependencies needed
# Pillow can be added later for server-side image processing if needed
```

### Frontend
```
# Already installed:
react-signature-canvas: ^1.1.0-alpha.2
@types/react-signature-canvas: ^1.0.7

# No new dependencies needed
# Browser Canvas API used for image compression (native)
```

---

## 9. Implementation Priority

### Phase 1: Backend Hardening
1. Add `pod_status` and `pod_receiver_name` fields to Shipment model
2. Create storage abstraction (`backend/app/core/storage.py`)
3. Create POD service (`backend/app/services/pod_service.py`)
4. Refactor `upload_pod` endpoint to use service + file storage
5. Add POD retrieval endpoint (`GET /shipments/{tracking}/pod`)
6. Add POD verification endpoint (`POST /shipments/{tracking}/pod/verify`)
7. Add POD listing endpoint (`GET /shipments/pods` with filters)
8. Add POD schemas to `schemas.py`

### Phase 2: Frontend Refactor
9. Refactor `ElectronicPOD.tsx` to use `lib/api.ts`
10. Add client-side image compression (Canvas API)
11. Add receiver name/contact input fields
12. Add geolocation accuracy indicator + retry
13. Add i18n support to POD component
14. Increase max photos from 3 to 5

### Phase 3: Admin Dashboard
15. Create POD admin dashboard page (`/dashboard/pod`)
16. Create POD list component with status filters
17. Create POD detail/verification view
18. Add verify/dispute actions for admin

### Phase 4: Polish
19. Add shareable POD verification link (public read-only)
20. Add POD receipt/summary component
21. Update Sidebar navigation (add POD under Shipments group)

---

## 10. Next Steps

1. [ ] Write design document (`e-POD.design.md`)
2. [ ] Review existing ElectronicPOD.tsx for reusable patterns
3. [ ] Start implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-21 | Initial draft | Development Team |
