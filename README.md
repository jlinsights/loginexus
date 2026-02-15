# LogiNexus | Enterprise Logistics Platform

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

LogiNexus is a modern, enterprise-grade logistics management platform designed to streamline shipment tracking, quote requests, and provide AI-driven insights. This project demonstrates a **Multi-tenant Architecture** with a Next.js frontend, Python/FastAPI backend, and real-time data visualization.

## 🚀 Features

- **🏢 Multi-tenancy & Whitelabeling**:
  - Subdomain-based tenant recognition (e.g., `tenant.loginexus.com`).
  - Dynamic branding (logo, colors, name) per tenant.
  - Data isolation via Tenant ID middleware.

- **📊 Interactive Dashboard**:
  - Real-time overview of shipments (Total, In-Transit, Arrived).
  - Live status updates via polling (every 3 seconds).
  - **"Simulate Arrival"** feature to test real-time state changes.

- **🌍 Advanced Tracking**:
  - **Interactive Map Modal**: Visual representation of current vessel location using Leaflet.
  - Detailed cargo information and ETA tracking.

- **💰 Smart Quote System**: Instant freight quote generation.
- **🤖 AI Assistant**: Integrated Gemini AI for intelligent logistics queries.

## 🛠 Tech Stack

### Frontend (Next.js)

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State/Data**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Maps**: [React Leaflet](https://react-leaflet.js.org/)

### Backend (FastAPI)

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL / SQLite (Dev) via [SQLAlchemy](https://www.sqlalchemy.org/)
- **Validation**: [Pydantic V2](https://docs.pydantic.dev/)
- **Security**: Middleware-based Tenant Isolation

## 📂 Project Structure

```bash
/root
├── backend/ (FastAPI)
│   ├── app/
│   │   ├── api/          # API Endpoints (Tenants, Shipments)
│   │   ├── core/         # Config & Security
│   │   ├── crud/         # Database Operations
│   │   ├── midleware/    # Tenant Identity Middleware
│   │   ├── models/       # SQLAlchemy Models
│   │   ├── schemas/      # Pydantic Schemas
│   │   └── main.py       # Application Entrypoint
│   └── seed_db.py        # Database Seeding Script
├── frontend/ (Next.js)
│   ├── app/
│   │   ├── dashboard/    # Main Dashboard Page
│   │   ├── components/   # UI Components (Map, Tables, Whitelabel)
│   │   └── register/     # Tenant Registration
│   ├── lib/              # API Client (Axios)
│   └── public/
└── docker-compose.yml
```

## ⚡️ Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **Python**: v3.9 or higher

### 1. Backend Setup

1.  **Navigate to backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Run with Auto-reload:**
    ```bash
    uvicorn app.main:app --reload
    ```
    API Docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup

1.  **Navigate to frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Access the app at: `http://localhost:3000`

## 🔄 API Documentation

Key endpoints available in Swagger UI:

- `POST /api/tenants/` - Register a new tenant.
- `GET /api/tenants/me` - Get current tenant context (via Host header).
- `POST /api/shipments/` - Create a new shipment.
- `GET /api/shipments/` - List shipments (Polling enabled).
- `POST /api/shipments/{id}/deliver` - Simulate shipment arrival.

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
