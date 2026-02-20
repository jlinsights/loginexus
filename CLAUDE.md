# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LogiNexus is a multi-tenant logistics management platform with blockchain payment escrow. It's a monorepo with a Next.js frontend and Python FastAPI backend.

## Development Commands

### Frontend (from repo root)

```bash
npm run dev          # Start Next.js dev server (proxies to frontend/)
npm run build        # Production build (requires NODE_ENV=production if shell has NODE_ENV=development)
npm run lint         # ESLint via eslint-config-next
```

### Frontend (from frontend/)

```bash
npx next dev         # Dev server at localhost:3000
npx tsc --noEmit     # TypeScript check
npx eslint .         # Lint (use this instead of `next lint` which has path issues in this monorepo)
```

### Backend (from backend/)

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload                    # API at localhost:8000
uvicorn app.main:app --reload --port 8001        # Alternative port
python seed_db.py                                 # Seed sample tenant + shipment data
```

Backend API docs: `http://localhost:8000/docs` (Swagger UI)

### Build Gotcha

If `NODE_ENV=development` is set in your shell environment, `next build` will fail with `TypeError: Cannot read properties of null (reading 'useState')` during prerendering. Fix: `NODE_ENV=production npx next build`

## Architecture

### Monorepo Structure

```
/                       # Root package.json proxies npm scripts to frontend/
├── backend/            # Python FastAPI (runs independently)
│   └── app/
│       ├── main.py             # FastAPI app entry, CORS, middleware registration
│       ├── models.py           # SQLAlchemy models (Tenant, Shipment, PaymentEscrow, AuditLog)
│       ├── schemas.py          # Pydantic request/response schemas
│       ├── database.py         # Engine, SessionLocal, get_db dependency
│       ├── api/api.py          # Router aggregation (/shipments, /tenants)
│       ├── api/endpoints/      # Route handlers
│       ├── core/middleware.py   # TenantMiddleware (subdomain extraction)
│       └── crud/shipment.py    # Shipment DB operations
├── frontend/           # Next.js 14 App Router
│   ├── app/
│   │   ├── [locale]/           # i18n support
│   │   ├── layout.tsx          # Server Component root (metadata, font)
│   │   ├── client-layout.tsx   # Client Component wrapper (providers + shell UI)
│   │   ├── providers.tsx       # WagmiProvider > QueryClientProvider > WhitelabelProvider
│   │   ├── components/         # All UI components (client-side)
│   │   ├── dashboard/          # Main shipment management page
│   │   ├── register/           # Tenant registration
│   │   └── signup/             # Tenant signup (mock)
│   └── lib/
│       ├── api.ts              # Axios client + TypeScript interfaces
│       └── wagmi.ts            # Wagmi config (mainnet, sepolia, ssr: true)
├── docs/               # Technical documentation & research
│   ├── 01-plan/        # Strategic & implementation plans
│   ├── 02-design/      # Design specs & UI/UX research
│   ├── 03-analysis/    # Technical & data analysis
│   └── 04-report/      # Performance & final reports
└── vercel.json         # Routes all requests to frontend/ for Vercel deployment
```

### Multi-Tenancy Flow

1. **TenantMiddleware** (`backend/app/core/middleware.py`) extracts tenant from subdomain or `x-tenant-id` header
2. Sets `request.state.tenant_id` for downstream use
3. CRUD operations filter by `tenant_id` (application-level); PostgreSQL RLS provides DB-level isolation (`rls_policies.sql`)
4. Frontend **WhitelabelProvider** fetches `/api/tenants/me` to load branding (logo, color, name) per tenant

### Server/Client Component Boundary

`layout.tsx` (Server Component) delegates to `client-layout.tsx` ('use client') which wraps all children in the provider chain. This separation is required because wagmi/React Query providers use React hooks that can't run in Server Components.

Provider chain: `WagmiProvider` > `QueryClientProvider` > `Suspense` > `WhitelabelProvider`

### API Communication

- Frontend uses Axios (`lib/api.ts`) with `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:8000/api`)
- Dashboard polls shipments every 3 seconds via React Query's `refetchInterval`
- Leaflet map components use `next/dynamic` with `ssr: false` (Leaflet requires browser APIs)

### Database

- PostgreSQL with `uuid-ossp` extension (UUID primary keys on all main tables)
- Schema defined in `backend/schema.sql`, RLS policies in `backend/rls_policies.sql`
- SQLAlchemy models auto-create tables via `Base.metadata.create_all()` in `main.py`
- Default dev DB URL: `postgresql://jaehong@localhost/loginexus` (override via `DATABASE_URL` env var in `backend/.env.local`)

### Key Models

- **Tenant**: name, subdomain (unique), logo_url, primary_color
- **Shipment**: tracking_number, origin/destination, current_status, lat/lng coordinates, FK to tenant
- **PaymentEscrow**: buyer/seller wallet addresses, USDC amount, escrow contract address, tx hashes
- **AuditLog**: entity_type/id tracking with JSONB old/new values

### API Endpoints

All prefixed with `/api`:

- `POST /tenants/` - Register tenant (checks subdomain uniqueness)
- `GET /tenants/me` - Current tenant from middleware context
- `GET /shipments/` - List shipments (demo mode: no tenant filter)
- `GET /shipments/{id}` - Single shipment (tenant-filtered)
- `POST /shipments/` - Create shipment with audit log
- `POST /shipments/{id}/deliver` - Simulate arrival (defined in crud, not yet exposed as endpoint)

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:8000/api`)

### Backend

- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://jaehong@localhost/loginexus`)

## Tech Stack

- **Frontend**: Next.js 14.2.14, React 18.3.1, TypeScript, Tailwind CSS v3.4.13, TanStack Query v5, wagmi v2 + viem, Leaflet, Framer Motion, Lucide icons
- **Backend**: FastAPI, SQLAlchemy (sync), Pydantic v2, PostgreSQL
- **Deployment**: Vercel (frontend), Local/Cloud VM (backend)

## Recent Accomplishments

- ✨ **Design Refinements**: Implemented modern Pill-style CTAs, Warm color palette, and Newsletter integration.
- 🌐 **i18n Implementation**: Full internationalization support (Next-intl) with Korean and English locales.
- 🔒 **Security & Remediation**: Hardened CORS policies, improved backend error handling, and refactored core logic for reliability.
- 🎨 **UI Harmonization**: Standardized sidebar, dashboard layouts, and clarified state transitions.

## Version Control

Record a one-line description with emoji in Korean of each change in `.commit_message.txt` (overwrite existing content).
