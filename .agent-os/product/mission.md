# Product Mission

## Pitch

LogiNexus is a multi-tenant enterprise logistics platform that helps freight forwarders, shippers, and 3PL providers manage shipments, track cargo, and secure payments on-chain by providing a unified dashboard with blockchain-powered escrow and AI-driven insights.

## Users

### Primary Customers

- **Freight Forwarders**: Companies managing cargo transport, customs clearance, and route optimization across global supply chains
- **Shippers / Exporters**: Businesses shipping goods internationally who need visibility, cost control, and payment security
- **3PL / Logistics Providers**: Third-party logistics companies managing warehousing, fulfillment, and last-mile delivery

### User Personas

**Operations Manager** (30-50 years old)
- **Role:** Logistics operations lead at a mid-size freight forwarder
- **Context:** Manages 50-200 active shipments daily across multiple carriers and routes
- **Pain Points:** Scattered tracking data across carrier portals, manual status updates, payment disputes with shippers
- **Goals:** Centralized shipment visibility, automated status sync, secure and transparent payment flows

**Supply Chain Director** (35-55 years old)
- **Role:** Head of supply chain at a manufacturing exporter
- **Context:** Oversees international shipments to multiple markets with different compliance requirements
- **Pain Points:** Lack of real-time cargo visibility, slow customs processes, difficulty auditing freight spend
- **Goals:** End-to-end shipment tracking, document management, analytics-driven cost optimization

**Platform Administrator** (25-40 years old)
- **Role:** IT lead managing the logistics platform for a tenant organization
- **Context:** Configures branding, manages users, oversees integrations
- **Pain Points:** Rigid SaaS platforms that can't match company branding, limited API access
- **Goals:** White-labeled platform, flexible API integrations, multi-tenant data isolation

## The Problem

### Fragmented Shipment Visibility

Logistics operators typically juggle 5-10 different carrier portals to track shipments, leading to delayed status updates and blind spots in the supply chain. An estimated 30% of logistics manager time is spent manually checking shipment status.

**Our Solution:** A unified dashboard with real-time polling, interactive map visualization, and centralized tracking across all carriers.

### Payment Disputes and Trust Gaps

International logistics payments involve multiple parties, long settlement cycles, and frequent disputes over delivery confirmation. Over $50B annually is tied up in logistics payment disputes globally.

**Our Solution:** On-chain USDC escrow via smart contracts that automatically lock buyer funds and release them upon delivery confirmation, providing transparent and trustless payment settlement.

### One-Size-Fits-All SaaS Platforms

Most logistics SaaS platforms offer generic branding and no tenant isolation, making it impossible for 3PLs to offer a white-labeled experience to their own customers.

**Our Solution:** Multi-tenant architecture with subdomain-based recognition, dynamic branding (logo, colors, name), and application-level + RLS data isolation.

## Differentiators

### Blockchain-Secured Payments

Unlike traditional logistics platforms that rely on bank transfers and manual reconciliation, LogiNexus uses on-chain USDC escrow smart contracts. This provides immutable payment records, automatic fund release on delivery, and dispute resolution without intermediaries.

### Multi-Tenant White-Label Architecture

Unlike generic SaaS logistics tools, LogiNexus provides true multi-tenancy with subdomain-based tenant isolation, customizable branding per tenant, and PostgreSQL RLS policies for database-level data separation. Each tenant gets their own branded experience.

### AI-Powered Logistics Intelligence

Unlike dashboards that only show historical data, LogiNexus integrates AI (Gemini) for intelligent logistics queries, predictive insights, and automated quote generation, turning raw data into actionable decisions.

## Key Features

### Core Features

- **Shipment Management**: Create, track, and manage shipments with real-time status updates and 3-second polling intervals
- **Interactive Map Tracking**: Leaflet-based map visualization of vessel/container locations with detailed cargo information
- **Smart Contract Escrow**: USDC payment locking via EscrowFactory + ShipmentEscrow contracts on Ethereum (Sepolia)
- **AI Quote System**: Instant freight quote generation powered by AI
- **Multi-Tenant Dashboard**: Role-based views (shipper, forwarder) with real-time KPIs (total, in-transit, arrived)

### Platform Features

- **White-Label Branding**: Dynamic logo, color, and name customization per tenant via WhitelabelProvider
- **Internationalization**: Full i18n support with next-intl (English, Korean)
- **Control Tower**: Centralized operations view for managing all active shipments
- **Audit Logging**: JSONB-based audit trail for all entity changes

### Planned Features

- **Live GPS Tracking**: Real-time vessel/container tracking with WebSocket updates
- **Payment & Invoicing**: Full payment flow beyond escrow (invoices, settlements)
- **Document Management**: Bill of lading, customs docs, certificates
- **Analytics & Reporting**: Business intelligence dashboards and KPI tracking
