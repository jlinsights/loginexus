# Technical Stack

## Application Framework

- **Frontend**: Next.js 14.2.14 (App Router)
- **Backend**: FastAPI (Python)
- **Smart Contracts**: Solidity 0.8.24 + Hardhat

## Languages

- **Frontend**: TypeScript 5.x
- **Backend**: Python 3.10+
- **Contracts**: Solidity

## Database System

- PostgreSQL with uuid-ossp extension
- SQLAlchemy (sync) ORM
- Alembic for migrations
- RLS policies for tenant data isolation

## JavaScript Framework

- React 18.3.1

## CSS Framework

- Tailwind CSS 3.4.13

## UI Component Library

- Custom components (no external component library)
- Lucide React icons
- Framer Motion for animations

## Data Fetching

- TanStack Query (React Query) v5 with 3s polling
- Axios HTTP client

## Blockchain

- wagmi v2.5.7 + viem v2.7.1
- Ethereum Sepolia testnet
- OpenZeppelin Contracts v5.1.0
- Hardhat toolbox v5.0.0

## Internationalization

- next-intl v4.8.3
- Languages: English (en), Korean (ko)

## Maps

- Leaflet 1.9.4 + React Leaflet 4.2.1

## Fonts Provider

- System fonts (Next.js built-in)

## Application Hosting

- Vercel (frontend)
- External API server (backend)

## Database Hosting

- PostgreSQL (external, default: postgresql://jaehong@localhost/loginexus)

## Asset Hosting

- Vercel (static assets via Next.js)

## Deployment Solution

- Vercel with vercel.json routing config
- Backend: uvicorn with FastAPI

## Code Repository

- GitHub (private)

## Development Tools

- ESLint + eslint-config-next
- PostCSS + Autoprefixer
- TypeScript strict mode
