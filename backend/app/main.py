import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.middleware import TenantMiddleware
from app.api.api import api_router
from app.database import engine, Base
from app.services.escrow_sync import EscrowEventSync
from app.services.oracle_service import OracleService
from app import models  # Ensure models are imported so metadata is registered

logger = logging.getLogger(__name__)

# Create Tables (for dev usage)
# Base.metadata.create_all(bind=engine)  # Disabled in favor of Alembic migrations


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


app = FastAPI(title="LogiNexus API", lifespan=lifespan)

# Middleware (order matters: last added = outermost = runs first)
# TenantMiddleware runs AFTER CORS, so CORS headers are always set
app.add_middleware(TenantMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://loginexus.vercel.app",
        "https://loginexus.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to LogiNexus API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
