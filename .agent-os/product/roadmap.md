# Product Roadmap

## Phase 0: Already Completed

The following features have been implemented:

- [x] Multi-tenant architecture with subdomain-based tenant isolation
- [x] WhitelabelProvider with dynamic branding (logo, colors, name)
- [x] Shipment CRUD with real-time 3-second polling dashboard
- [x] Interactive map tracking with Leaflet (vessel location visualization)
- [x] AI-powered quote system
- [x] Smart contract escrow (EscrowFactory + ShipmentEscrow on Sepolia) `XL`
- [x] USDC fund/release/dispute/refund on-chain lifecycle `XL`
- [x] Backend event sync for on-chain state -> PostgreSQL `L`
- [x] Frontend wagmi hooks for all escrow operations `M`
- [x] Escrow UI components (EscrowPanel, FundEscrowModal, StatusBadge) `M`
- [x] i18n with next-intl (English, Korean) `S`
- [x] Audit logging with JSONB old/new values `S`
- [x] Tenant registration and middleware `M`
- [x] PostgreSQL RLS policies for data isolation `S`
- [x] Control tower dashboard view `M`

## Phase 1: Payment & Document Infrastructure

**Goal:** Complete the payment lifecycle and add document management
**Success Criteria:** End-to-end payment flow from invoice to settlement; document upload/download for shipments

### Features

- [ ] Invoice generation from escrow data - `M`
- [ ] Payment settlement tracking and history - `M`
- [ ] Bill of lading document upload/storage - `L`
- [ ] Customs document management - `L`
- [ ] Certificate/compliance document templates - `M`
- [ ] Document versioning and audit trail - `S`

### Dependencies

- Cloud storage setup (S3 or Vercel Blob) for document files
- PDF generation library integration

## Phase 2: Live Tracking & Real-Time

**Goal:** Real-time shipment tracking with WebSocket-based updates
**Success Criteria:** Live GPS updates within 30s latency; WebSocket connection for dashboard events

### Features

- [ ] WebSocket server for real-time shipment updates - `L`
- [ ] Live GPS tracking integration (AIS data or carrier API) - `XL`
- [ ] Push notifications for status changes - `M`
- [ ] Real-time escrow event notifications - `S`
- [ ] ETA prediction with historical data - `L`
- [ ] Geofencing alerts (port arrival/departure) - `M`

### Dependencies

- WebSocket infrastructure (FastAPI WebSocket or dedicated service)
- AIS data provider or carrier tracking API integration

## Phase 3: Analytics & Intelligence

**Goal:** Business intelligence dashboards and AI-powered insights
**Success Criteria:** Executive KPI dashboard; automated anomaly detection; cost optimization recommendations

### Features

- [ ] Executive KPI dashboard (cost, volume, on-time delivery rate) - `L`
- [ ] Shipment performance analytics by route/carrier - `M`
- [ ] Cost analysis and spend tracking - `M`
- [ ] AI anomaly detection for delayed shipments - `L`
- [ ] Automated reporting (weekly/monthly summaries) - `M`
- [ ] Carbon emissions tracking and ESG reporting - `L`

### Dependencies

- Analytics data pipeline (aggregation jobs or materialized views)
- Charting library integration (Recharts already in node_modules)

## Phase 4: Multi-Chain & Scale

**Goal:** Expand blockchain support and platform scalability
**Success Criteria:** Support 2+ chains; handle 1000+ concurrent tenants; mainnet deployment

### Features

- [ ] Multi-chain escrow support (Polygon, Base) - `XL`
- [ ] Mainnet deployment with security audit - `XL`
- [ ] Escrow timeout/auto-refund mechanism - `M`
- [ ] Gas estimation and fee display in UI - `S`
- [ ] Horizontal scaling for backend services - `L`
- [ ] CDN and edge caching for global performance - `M`

### Dependencies

- Slither security audit completion
- Multi-chain RPC provider setup
- Production USDC contract addresses

## Phase 5: Enterprise Features

**Goal:** Enterprise-grade features for large-scale logistics operations
**Success Criteria:** SSO integration; role-based access control; API marketplace

### Features

- [ ] SSO/SAML authentication for enterprise tenants - `L`
- [ ] Granular role-based access control (RBAC) - `L`
- [ ] Public API with rate limiting and API keys - `L`
- [ ] Webhook system for third-party integrations - `M`
- [ ] Multi-currency support beyond USDC - `M`
- [ ] White-label mobile app (React Native) - `XL`
- [ ] Carrier API integrations (Maersk, MSC, CMA CGM) - `XL`

### Dependencies

- Identity provider integration
- API gateway infrastructure
- Mobile development environment setup
