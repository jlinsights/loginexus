# Plan: Architecture Design Improvements

> **Feature**: architecture-design
> **Created**: 2026-02-21
> **Status**: Draft
> **Level**: Dynamic
> **Priority**: High

---

## 1. Overview

### Problem Statement

LogiNexus is a multi-tenant logistics platform with blockchain escrow that has grown to 34 pages, 38 components, 25+ API endpoints, and 3 smart contracts. While the codebase is clean and functional, it lacks several architectural foundations needed for production readiness:

1. **No authentication/authorization** - Backend endpoints are completely open
2. **No test coverage** - Zero unit/integration/e2e tests
3. **No rate limiting** - API vulnerable to abuse
4. **Minimal logging/observability** - Difficult to debug production issues
5. **Hardcoded CORS origins** - Not environment-configurable
6. **No API versioning** - Breaking changes have no migration path

### Goals

| Goal | Metric | Target |
|------|--------|--------|
| Security hardening | Auth coverage | 100% protected endpoints |
| API reliability | Rate limiting | Per-tenant throttling |
| Observability | Structured logging | All API calls logged |
| Deployment readiness | Environment config | Zero hardcoded values |
| Code quality | Test coverage | >= 60% for critical paths |
| Developer experience | API versioning | /api/v1/ prefix |

### Non-Goals

- UI/UX redesign (separate feature)
- New business features
- Smart contract upgrades
- Database migration to a different provider
- Mobile app development

---

## 2. Current Architecture Analysis

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                      │
│  Next.js 14 App Router + i18n + Wagmi/Viem              │
│  34 Pages | 38 Components | TanStack Query              │
├─────────────────────────────────────────────────────────┤
│                    API Layer                              │
│  FastAPI + SQLAlchemy + Pydantic v2                      │
│  6 Routers | 25+ Endpoints | TenantMiddleware           │
├─────────────────────────────────────────────────────────┤
│              PostgreSQL + Blockchain                     │
│  7 Tables | RLS | 3 Solidity Contracts (Sepolia)        │
└─────────────────────────────────────────────────────────┘
```

### Frontend Architecture (Strengths)
- Clean Server/Client component boundary (`layout.tsx` -> `client-layout.tsx`)
- Provider chain: WagmiProvider > QueryClientProvider > ThemeProvider > WhitelabelProvider
- Path alias `@/*` with strict TypeScript
- i18n via `next-intl` (ko, en)
- Dynamic imports for Leaflet maps (`ssr: false`)

### Backend Architecture (Strengths)
- Multi-tenancy via subdomain middleware + RLS
- Audit logging with JSONB old/new values
- Carbon emission calculation by transport mode
- Background escrow sync service
- Proper Pydantic v2 schemas

### Blockchain Architecture (Strengths)
- Factory pattern for per-shipment escrows
- Oracle-based delivery confirmation
- NFT-linked bill of lading
- Wagmi hooks abstraction layer

### Identified Gaps

| Category | Gap | Impact | Priority |
|----------|-----|--------|----------|
| **Security** | No auth middleware | Critical | P0 |
| **Security** | No rate limiting | High | P1 |
| **Security** | Hardcoded CORS | Medium | P2 |
| **Reliability** | No error boundary strategy | High | P1 |
| **Observability** | Minimal logging | High | P1 |
| **Quality** | Zero test coverage | High | P1 |
| **API** | No versioning | Medium | P2 |
| **API** | No pagination on list endpoints | Medium | P2 |
| **Config** | Env vars not validated | Medium | P2 |
| **Frontend** | No error/loading states pattern | Low | P3 |

---

## 3. Improvement Areas

### Area 1: Authentication & Authorization (P0)

**Current**: No auth. `TenantMiddleware` only extracts tenant context.
**Target**: JWT-based auth with role-based access control (RBAC).

**Approach**:
- Add `python-jose` + `passlib` for JWT token handling
- Create `AuthMiddleware` alongside existing `TenantMiddleware`
- Implement `Depends(get_current_user)` for protected routes
- Role hierarchy: `admin > member > viewer`
- Frontend: Add login page, token storage in httpOnly cookies
- Protect all mutation endpoints, allow read-only for demo mode

**Files to modify/create**:
- `backend/app/core/auth.py` (new)
- `backend/app/core/middleware.py` (extend)
- `backend/app/api/endpoints/auth.py` (new)
- `frontend/app/[locale]/login/page.tsx` (new)
- `frontend/lib/api.ts` (add interceptors)

### Area 2: API Hardening (P1)

**Rate Limiting**:
- Use `slowapi` (built on limits library)
- Per-tenant rate limits: 100 req/min default
- Configurable per-tenant via database

**API Versioning**:
- Prefix all routes with `/api/v1/`
- Maintain backward compatibility via redirect

**Pagination**:
- Add `skip`/`limit` params to list endpoints
- Return `total_count` in response headers
- Default limit: 50, max: 200

**Error Handling**:
- Standardize error response format: `{ detail, code, timestamp }`
- Add global exception handler
- Map SQLAlchemy errors to HTTP status codes

### Area 3: Observability (P1)

**Structured Logging**:
- Use `structlog` for JSON-formatted logs
- Log all API requests with: method, path, tenant_id, duration_ms, status_code
- Add correlation IDs via middleware
- Sensitive field masking (passwords, tokens)

**Health Checks**:
- `GET /health` - Basic liveness
- `GET /health/ready` - DB connection + blockchain provider status

### Area 4: Configuration Management (P2)

**Environment Validation**:
- Use `pydantic-settings` (already in Pydantic v2)
- Create `Settings` class with validation
- Fail-fast on missing required config
- Support `.env`, `.env.local`, `.env.production`

**CORS**:
- Move origins to environment variable `ALLOWED_ORIGINS`
- Parse as comma-separated list

### Area 5: Frontend Architecture (P2)

**Error Boundaries**:
- Add `error.tsx` to key route segments
- Standardize loading states with `loading.tsx`
- Create reusable `<ErrorFallback>` component

**API Layer**:
- Add request/response interceptors for auth tokens
- Implement retry logic for transient failures
- Add request cancellation via AbortController

### Area 6: Testing Foundation (P1)

**Backend** (pytest):
- Test factory pattern for fixtures
- API endpoint tests with httpx `TestClient`
- CRUD operation tests
- Auth flow tests

**Frontend** (vitest + testing-library):
- Component render tests for critical components
- Hook tests for custom wagmi hooks
- API client mock tests

---

## 4. Implementation Priority

### Phase 1: Security Foundation (Week 1)
1. Environment config validation (`pydantic-settings`)
2. CORS from environment
3. JWT auth middleware + login endpoint
4. Protected route decorators

### Phase 2: API Hardening (Week 1-2)
5. Rate limiting (`slowapi`)
6. Standardized error responses
7. API versioning (`/api/v1/`)
8. Pagination on list endpoints

### Phase 3: Observability (Week 2)
9. Structured logging (`structlog`)
10. Health check endpoints
11. Request correlation IDs
12. Error tracking integration

### Phase 4: Testing (Week 2-3)
13. Backend test setup (pytest + fixtures)
14. Critical API endpoint tests
15. Frontend test setup (vitest)
16. Component tests for auth flow

### Phase 5: Frontend Polish (Week 3)
17. Error boundaries (`error.tsx`)
18. Loading states (`loading.tsx`)
19. Auth token interceptors
20. Login/logout UI

---

## 5. Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| All mutations require auth | Endpoint audit | 100% |
| Rate limiting active | Load test | 100 req/min/tenant |
| Structured logging | Log format check | JSON with correlation ID |
| Config from env | Hardcoded value scan | 0 hardcoded secrets |
| Test coverage (backend) | pytest --cov | >= 60% |
| Health endpoint | curl /health | 200 OK |
| API versioning | URL check | /api/v1/ prefix |
| Error responses | Schema validation | Standardized format |

---

## 6. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Auth breaks demo mode | High | High | Add `DEMO_MODE` env flag to bypass auth |
| Rate limiting too aggressive | Medium | Medium | Start with generous limits, tune later |
| Migration breaks existing clients | Medium | High | Keep `/api/` redirects to `/api/v1/` |
| Test setup slows development | Low | Medium | Focus on critical paths only |

---

## 7. Dependencies

### Backend
```
python-jose[cryptography]  # JWT handling
passlib[bcrypt]            # Password hashing
slowapi                    # Rate limiting
structlog                  # Structured logging
httpx                      # Test client
pytest                     # Testing framework
pytest-asyncio             # Async test support
```

### Frontend
```
vitest                     # Test runner
@testing-library/react     # Component testing
@testing-library/jest-dom  # DOM matchers
msw                        # API mocking
```

---

## 8. References

- [FastAPI Security docs](https://fastapi.tiangolo.com/tutorial/security/)
- [SlowAPI rate limiting](https://github.com/laurentS/slowapi)
- [Structlog for Python](https://www.structlog.org/)
- [Vitest for Next.js](https://nextjs.org/docs/app/building-your-application/testing/vitest)
- Archived features: `smart-contract-escrow` (92%), `analytics-reporting` (93.3%)
