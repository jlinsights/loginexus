from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.middleware import TenantMiddleware
from app.api.api import api_router
from app.database import engine, Base
from app import models # Ensure models are imported so metadata is registered

# Create Tables (for dev usage)
# Base.metadata.create_all(bind=engine)  # Disabled in favor of Alembic migrations

app = FastAPI(title="LogiNexus API")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, set to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TenantMiddleware)

# Include Router
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to LogiNexus API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
