import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.errors import global_exception_handler, http_exception_handler
from app.core.logging import setup_logging
from app.core.middleware import RequestLoggingMiddleware, TenantMiddleware
from app.core.rate_limit import limiter
from app.api.api import api_router
from app.database import engine, Base
from app.services.escrow_sync import EscrowEventSync
from app.services.oracle_service import OracleService
from app import models  # Ensure models are imported so metadata is registered

# Initialize structured logging
setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background tasks
    sync = EscrowEventSync()
    oracle = OracleService()

    sync_task = asyncio.create_task(sync.start())
    oracle_task = asyncio.create_task(oracle.start())

    logger.info("Background tasks (Sync, Oracle) scheduled")
    yield
    # Shutdown: cancel background tasks
    sync_task.cancel()
    oracle_task.cancel()
    try:
        await sync_task
        await oracle_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# --- Rate Limiter ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Error Handlers ---
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

# --- Middleware (order matters: last added = outermost = runs first) ---
# 4. Tenant extraction (innermost)
app.add_middleware(TenantMiddleware)
# 3. Request logging
app.add_middleware(RequestLoggingMiddleware)
# 2. CORS headers (outermost after rate limiting)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Router ---
app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
