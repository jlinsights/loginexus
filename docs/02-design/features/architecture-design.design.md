# Design: Architecture Design Improvements

> **Feature**: architecture-design
> **Plan Reference**: `docs/01-plan/features/architecture-design.plan.md`
> **Created**: 2026-02-21
> **Status**: Draft
> **Level**: Dynamic

---

## 1. Design Overview

### Scope

This design specifies implementation details for 5 architecture improvements to make LogiNexus production-ready. Each section includes exact file paths, code structures, schemas, and integration points.

### Architecture After Implementation

```
┌────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)                      │
│  Login Page → Auth Interceptor → Protected Routes → Error Bounds  │
├────────────────────────────────────────────────────────────────────┤
│                         API Gateway Layer                          │
│  /api/v1/ → RateLimiter → AuthMiddleware → TenantMiddleware       │
├────────────────────────────────────────────────────────────────────┤
│                         Application Layer                          │
│  Routers → Dependencies → CRUD → Services                        │
│  Structured Logging (structlog) + Correlation IDs                 │
├────────────────────────────────────────────────────────────────────┤
│                         Data Layer                                 │
│  PostgreSQL (RLS) + Blockchain (Sepolia) + Config (pydantic)      │
└────────────────────────────────────────────────────────────────────┘
```

### Middleware Execution Order (outermost first)
```
Request → CORS → RateLimiter → Auth → Tenant → Router → Handler
```

---

## 2. Component Design

### 2.1 Configuration Management (`backend/app/core/config.py`)

**Replace** the current plain-class `Settings` with `pydantic-settings` `BaseSettings`.

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    # --- Application ---
    PROJECT_NAME: str = "LogiNexus API"
    API_VERSION: str = "v1"
    DEMO_MODE: bool = Field(default=True, description="Bypass auth for demo")
    DEBUG: bool = False

    # --- Database ---
    DATABASE_URL: str = "postgresql://jaehong@localhost/loginexus"

    # --- Auth ---
    SECRET_KEY: str = Field(default="change-me-in-production", min_length=16)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # --- CORS ---
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://loginexus.vercel.app",
        "https://loginexus.com"
    ]

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 100

    # --- Blockchain ---
    BLOCKCHAIN_RPC_URL: str = "https://sepolia.infura.io/v3/YOUR_KEY"
    CHAIN_ID: int = 11155111
    ORACLE_PRIVATE_KEY: str = ""
    ORACLE_ADDRESS: str = ""
    ESCROW_CONTRACT_ADDRESS: str = ""

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json | console

    model_config = {"env_file": ".env.local", "env_file_encoding": "utf-8"}

settings = Settings()
```

**Impact**: `database.py` and `main.py` import `settings.DATABASE_URL`, `settings.ALLOWED_ORIGINS`, etc. instead of raw `os.getenv()`.

**Files modified**:
- `backend/app/core/config.py` (rewrite)
- `backend/app/database.py` (use `settings.DATABASE_URL`)
- `backend/app/main.py` (use `settings.ALLOWED_ORIGINS`)

---

### 2.2 Authentication & Authorization

#### 2.2.1 Auth Module (`backend/app/core/auth.py`) - NEW

```python
# backend/app/core/auth.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/{settings.API_VERSION}/auth/login")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(*roles: str):
    """Dependency factory for role-based access."""
    async def role_checker(user: models.User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

async def get_optional_user(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="token", auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """For demo mode: returns user if authenticated, None otherwise."""
    if not token or settings.DEMO_MODE:
        return None
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None
```

#### 2.2.2 Auth Endpoints (`backend/app/api/endpoints/auth.py`) - NEW

```python
# backend/app/api/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ...database import get_db
from ...core.auth import verify_password, hash_password, create_access_token, get_current_user
from ... import models, schemas

router = APIRouter()

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(user: models.User = Depends(get_current_user)):
    return user
```

#### 2.2.3 Auth Schemas (`backend/app/schemas.py`) - EXTEND

```python
# Add to existing schemas.py
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    tenant_id: str
    role: str
    exp: int
```

#### 2.2.4 Endpoint Protection Strategy

| Endpoint | Method | Auth Required | Demo Mode |
|----------|--------|---------------|-----------|
| `POST /auth/login` | POST | No | N/A |
| `GET /auth/me` | GET | Yes | Skip |
| `GET /shipments/` | GET | No (public list) | Allow |
| `GET /shipments/{id}` | GET | No (public read) | Allow |
| `GET /shipments/tracking/{num}` | GET | No (public) | Allow |
| `POST /shipments/` | POST | Yes (admin/member) | Skip |
| `POST /shipments/{id}/pod` | POST | Yes (member) | Skip |
| `POST /escrows/` | POST | Yes (admin/member) | Skip |
| `POST /escrows/{id}/release` | POST | Yes (admin) | Skip |
| `POST /escrows/{id}/dispute` | POST | Yes (member) | Skip |
| `GET /analytics/*` | GET | Yes (any role) | Skip |
| `GET /tenants/me` | GET | No | Allow |
| `POST /tenants/` | POST | No (registration) | Allow |
| `GET /users/` | GET | Yes (admin) | Skip |
| `POST /users/invite` | POST | Yes (admin) | Skip |
| `GET /health` | GET | No | Allow |
| `GET /health/ready` | GET | No | Allow |

**Demo Mode Logic**: When `DEMO_MODE=true`, use `get_optional_user` instead of `get_current_user`. Mutations proceed without auth, reads return all data.

---

### 2.3 Rate Limiting

#### 2.3.1 Setup (`backend/app/core/rate_limit.py`) - NEW

```python
# backend/app/core/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from .config import settings

def _get_tenant_or_ip(request: Request) -> str:
    """Rate limit key: tenant_id if available, otherwise IP."""
    tenant_id = getattr(request.state, "tenant_id", None)
    if tenant_id and tenant_id != "default":
        return f"tenant:{tenant_id}"
    return get_remote_address(request)

limiter = Limiter(key_func=_get_tenant_or_ip)
```

#### 2.3.2 Integration (`backend/app/main.py`)

```python
# Add to main.py
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

#### 2.3.3 Per-Endpoint Decoration

```python
# Example usage in endpoints
from app.core.rate_limit import limiter

@router.post("/")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
def create_shipment(request: Request, ...):
    ...
```

**Limits**:
- Default: 100 req/min per tenant
- Auth endpoints: 10 req/min (brute-force protection)
- Analytics: 30 req/min (heavy queries)
- Public reads: 200 req/min

---

### 2.4 API Versioning & Error Handling

#### 2.4.1 Router Restructure (`backend/app/api/api.py`)

```python
# backend/app/api/api.py
from fastapi import APIRouter
from .endpoints import shipments, tenants, escrows, analytics, users, rates, auth, health

# Versioned router
v1_router = APIRouter()
v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
v1_router.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
v1_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
v1_router.include_router(escrows.router, prefix="/escrows", tags=["escrows"])
v1_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
v1_router.include_router(users.router, prefix="/users", tags=["users"])
v1_router.include_router(rates.router, prefix="/rates", tags=["rates"])

# Top-level router
api_router = APIRouter()
api_router.include_router(v1_router, prefix="/v1")
api_router.include_router(health.router, tags=["health"])

# Backward compatibility: redirect /api/shipments → /api/v1/shipments
# Handled via main.py middleware or explicit legacy routes
```

**URL Change**: `/api/shipments/` -> `/api/v1/shipments/`

**Backward Compatibility**: Add redirect middleware for `/api/{resource}` -> `/api/v1/{resource}` during transition.

#### 2.4.2 Standardized Error Response

```python
# backend/app/core/errors.py - NEW
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import uuid

class ErrorResponse(BaseModel):
    detail: str
    code: str
    timestamp: str
    request_id: str

async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": getattr(request.state, "request_id", str(uuid.uuid4()))
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": _status_to_code(exc.status_code),
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": getattr(request.state, "request_id", str(uuid.uuid4()))
        }
    )

def _status_to_code(status: int) -> str:
    return {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
    }.get(status, "ERROR")
```

#### 2.4.3 Pagination

```python
# backend/app/core/pagination.py - NEW
from fastapi import Query
from typing import TypeVar, Generic, List
from pydantic import BaseModel

T = TypeVar('T')

class PaginationParams:
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    ):
        self.skip = skip
        self.limit = limit

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
```

**Usage in endpoints**:
```python
@router.get("/", response_model=PaginatedResponse[schemas.ShipmentResponse])
def read_shipments(pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    total = db.query(models.Shipment).count()
    shipments = db.query(models.Shipment).offset(pagination.skip).limit(pagination.limit).all()
    return PaginatedResponse(items=shipments, total=total, skip=pagination.skip, limit=pagination.limit)
```

---

### 2.5 Structured Logging

#### 2.5.1 Logger Setup (`backend/app/core/logging.py`) - NEW

```python
# backend/app/core/logging.py
import structlog
import logging
from .config import settings

def setup_logging():
    """Configure structlog for JSON or console output."""
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.LOG_FORMAT == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Set root logger level
    logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper()))

def get_logger(name: str = __name__):
    return structlog.get_logger(name)
```

#### 2.5.2 Request Logging Middleware (`backend/app/core/middleware.py`) - EXTEND

```python
# Add to existing middleware.py
import time
import uuid
import structlog

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        logger = structlog.get_logger()
        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        tenant_id = getattr(request.state, "tenant_id", "unknown")

        logger.info(
            "request_completed",
            status_code=response.status_code,
            duration_ms=duration_ms,
            tenant_id=tenant_id,
        )

        response.headers["X-Request-ID"] = request_id
        return response
```

#### 2.5.3 Updated Middleware Order in `main.py`

```python
# Middleware order (last added = outermost = runs first):
app.add_middleware(TenantMiddleware)           # 4. Extract tenant
# AuthMiddleware is handled via Depends(), not middleware
app.add_middleware(RequestLoggingMiddleware)    # 3. Log request
app.add_middleware(CORSMiddleware, ...)        # 2. CORS headers
# SlowAPI rate limiting via exception handler  # 1. Rate limit
```

---

### 2.6 Health Check Endpoints (`backend/app/api/endpoints/health.py`) - NEW

```python
# backend/app/api/endpoints/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...database import get_db
from ...core.config import settings

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "version": settings.API_VERSION}

@router.get("/health/ready")
def health_ready(db: Session = Depends(get_db)):
    checks = {"database": False, "config": True}
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass

    all_ok = all(checks.values())
    return {
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
        "version": settings.API_VERSION,
    }
```

---

### 2.7 Frontend Auth Integration

#### 2.7.1 API Client Update (`frontend/lib/api.ts`) - MODIFY

```typescript
// Add auth interceptors to existing api instance

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    if (token) {
        localStorage.setItem('access_token', token);
    } else {
        localStorage.removeItem('access_token');
    }
};

export const getAccessToken = (): string | null => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('access_token');
    }
    return accessToken;
};

// Request interceptor: attach token
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            setAccessToken(null);
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export interface LoginRequest {
    username: string;  // email
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    const response = await api.post<LoginResponse>('/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    setAccessToken(response.data.access_token);
    return response.data;
};

export const logout = () => {
    setAccessToken(null);
};

export const fetchMe = async (): Promise<User> => {
    const response = await api.get<User>('/v1/auth/me');
    return response.data;
};
```

**URL Migration**: Update `baseURL` path from `/api` to `/api` (stays same), but all endpoints update from `/shipments/` to `/v1/shipments/`.

#### 2.7.2 Login Page (`frontend/app/[locale]/login/page.tsx`) - NEW

```
Component: LoginPage
├── State: email, password, error, isLoading
├── Handler: handleSubmit → login() → redirect to /dashboard
├── UI: Centered card with email/password fields
└── Redirect: If already authenticated, redirect to /dashboard
```

#### 2.7.3 Frontend Error Boundaries

**Files to create**:
- `frontend/app/[locale]/error.tsx` - Root error boundary
- `frontend/app/[locale]/dashboard/error.tsx` - Dashboard error boundary
- `frontend/app/[locale]/loading.tsx` - Root loading state
- `frontend/app/components/ErrorFallback.tsx` - Reusable error component

```typescript
// frontend/app/[locale]/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-gray-500">{error.message}</p>
            <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Try again
            </button>
        </div>
    );
}
```

---

## 3. Data Design

### 3.1 Schema Changes

**No new tables required.** The existing `users` table already has `email`, `password_hash`, `role`, and `tenant_id` fields.

### 3.2 New Backend Dependencies

```
# Add to requirements.txt
python-jose[cryptography]   # JWT token creation/verification
passlib[bcrypt]              # Password hashing
slowapi                      # Rate limiting (built on limits)
structlog                    # Structured JSON logging
pydantic-settings            # Environment variable validation
```

### 3.3 New Frontend Dependencies

None required for auth (uses existing axios). Testing dependencies are separate and optional:

```
# Only if implementing tests (Phase 4)
vitest @testing-library/react @testing-library/jest-dom msw
```

---

## 4. File Change Matrix

### New Files (8)

| File | Purpose |
|------|---------|
| `backend/app/core/auth.py` | JWT auth, password hashing, dependencies |
| `backend/app/core/rate_limit.py` | SlowAPI limiter setup |
| `backend/app/core/errors.py` | Standardized error responses |
| `backend/app/core/logging.py` | Structlog configuration |
| `backend/app/core/pagination.py` | Pagination params & response model |
| `backend/app/api/endpoints/auth.py` | Login & me endpoints |
| `backend/app/api/endpoints/health.py` | Health check endpoints |
| `frontend/app/[locale]/login/page.tsx` | Login page |

### Modified Files (8)

| File | Changes |
|------|---------|
| `backend/app/core/config.py` | Rewrite with `pydantic-settings BaseSettings` |
| `backend/app/core/middleware.py` | Add `RequestLoggingMiddleware` |
| `backend/app/main.py` | New middleware order, rate limiter, error handlers, CORS from settings |
| `backend/app/api/api.py` | Add `/v1/` prefix, include auth + health routers |
| `backend/app/database.py` | Import `DATABASE_URL` from settings |
| `backend/app/schemas.py` | Add `Token`, `TokenPayload` schemas |
| `backend/requirements.txt` | Add 5 new dependencies |
| `frontend/lib/api.ts` | Add auth interceptors, login/logout functions, `/v1/` paths |

### Optional Files (4) - Error Boundaries

| File | Purpose |
|------|---------|
| `frontend/app/[locale]/error.tsx` | Root error boundary |
| `frontend/app/[locale]/loading.tsx` | Root loading state |
| `frontend/app/[locale]/dashboard/error.tsx` | Dashboard error boundary |
| `frontend/app/components/ErrorFallback.tsx` | Reusable error UI |

---

## 5. Implementation Order

### Step 1: Configuration (Foundation)
1. Rewrite `backend/app/core/config.py` with `pydantic-settings`
2. Update `backend/app/database.py` to use `settings.DATABASE_URL`
3. Update `backend/requirements.txt` with all new dependencies
4. Install dependencies: `pip install -r requirements.txt`

### Step 2: Logging & Error Handling
5. Create `backend/app/core/logging.py`
6. Create `backend/app/core/errors.py`
7. Add `RequestLoggingMiddleware` to `backend/app/core/middleware.py`
8. Register logging + error handlers in `backend/app/main.py`

### Step 3: Auth System
9. Create `backend/app/core/auth.py`
10. Create `backend/app/api/endpoints/auth.py`
11. Add `Token`/`TokenPayload` to `backend/app/schemas.py`
12. Add auth router to `backend/app/api/api.py`

### Step 4: Rate Limiting
13. Create `backend/app/core/rate_limit.py`
14. Register limiter in `backend/app/main.py`
15. Add `@limiter.limit()` to write endpoints

### Step 5: API Versioning & Pagination
16. Restructure `backend/app/api/api.py` with `/v1/` prefix
17. Create `backend/app/core/pagination.py`
18. Create `backend/app/api/endpoints/health.py`
19. Update `backend/app/main.py` CORS from settings
20. Apply pagination to list endpoints

### Step 6: Frontend Integration
21. Update `frontend/lib/api.ts` with interceptors + `/v1/` paths
22. Create `frontend/app/[locale]/login/page.tsx`
23. Create error boundary files
24. Verify all frontend API calls work with new paths

---

## 6. API Contract Changes

### New Endpoints

```
POST /api/v1/auth/login        → { access_token, token_type }
GET  /api/v1/auth/me           → UserResponse
GET  /api/health               → { status, version }
GET  /api/health/ready         → { status, checks, version }
```

### Changed Endpoints (URL prefix)

All existing endpoints move from `/api/{resource}` to `/api/v1/{resource}`:

```
/api/shipments/     → /api/v1/shipments/
/api/tenants/       → /api/v1/tenants/
/api/escrows/       → /api/v1/escrows/
/api/analytics/     → /api/v1/analytics/
/api/users/         → /api/v1/users/
/api/rates/         → /api/v1/rates/
```

### Response Format Change (Errors)

```json
// Before
{ "detail": "Not found" }

// After
{
    "detail": "Not found",
    "code": "NOT_FOUND",
    "timestamp": "2026-02-21T12:00:00Z",
    "request_id": "a1b2c3d4"
}
```

### Pagination Response Change (List Endpoints)

```json
// Before
[{ ... }, { ... }]

// After
{
    "items": [{ ... }, { ... }],
    "total": 128,
    "skip": 0,
    "limit": 50
}
```

---

## 7. Verification Checklist

| # | Item | Verification Method |
|---|------|---------------------|
| 1 | Config loads from `.env.local` | `python -c "from app.core.config import settings; print(settings.PROJECT_NAME)"` |
| 2 | App starts without errors | `uvicorn app.main:app --reload` |
| 3 | Health endpoint responds | `curl localhost:8000/api/health` |
| 4 | Health/ready checks DB | `curl localhost:8000/api/health/ready` |
| 5 | Auth login returns token | `curl -X POST localhost:8000/api/v1/auth/login -d "username=...&password=..."` |
| 6 | Protected endpoint rejects unauthenticated | `curl localhost:8000/api/v1/shipments/ -X POST` returns 401 |
| 7 | Demo mode bypasses auth | `DEMO_MODE=true` allows unauth mutations |
| 8 | Rate limiting enforces limits | 101st request within 1 min returns 429 |
| 9 | Structured logs output JSON | Check stdout format |
| 10 | Request ID in response headers | `X-Request-ID` header present |
| 11 | Versioned URLs work | `curl localhost:8000/api/v1/shipments/` |
| 12 | Paginated response format | `items`, `total`, `skip`, `limit` in response |
| 13 | Error response format | `detail`, `code`, `timestamp`, `request_id` in error |
| 14 | Frontend login page loads | `localhost:3000/en/login` |
| 15 | Frontend API calls use `/v1/` | Network tab shows versioned URLs |
| 16 | Error boundary catches errors | Trigger error, verify fallback UI shows |

---

## 8. Risk Mitigation

| Risk | Mitigation | Implementation |
|------|------------|----------------|
| Auth breaks demo mode | `DEMO_MODE=true` flag | `get_optional_user` dependency returns `None` in demo |
| Rate limiter blocks legitimate traffic | Generous defaults (100/min) | Configurable via `RATE_LIMIT_PER_MINUTE` env var |
| URL change breaks frontend | Update all API calls at once | Step 6 updates `api.ts` paths; use find-replace |
| Pagination breaks existing consumers | Wrapper response model | Frontend updates to read `.items` from response |
| structlog adds overhead | Minimal processor chain | Only 4 processors; ~0.1ms per request |

---

## 9. Dependencies Summary

### Python (add to `requirements.txt`)
```
python-jose[cryptography]
passlib[bcrypt]
slowapi
structlog
pydantic-settings
```

### Frontend
No new npm dependencies required.
