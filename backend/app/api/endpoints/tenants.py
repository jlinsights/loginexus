from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ... import models, schemas, database

router = APIRouter()

@router.post("/", response_model=schemas.TenantResponse)
def create_tenant(tenant: schemas.TenantCreate, db: Session = Depends(database.get_db)):
    # Check for duplicate subdomain
    db_tenant = db.query(models.Tenant).filter(models.Tenant.subdomain == tenant.subdomain).first()
    if db_tenant:
        raise HTTPException(status_code=400, detail="Subdomain already registered")
    
    new_tenant = models.Tenant(**tenant.model_dump())
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant

import uuid
from fastapi import Request

@router.get("/me", response_model=schemas.TenantResponse)
def get_current_tenant(request: Request, db: Session = Depends(database.get_db)):
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id or tenant_id == "default":
        # If no specific tenant is identified (e.g. localhost accessing direct IP or main domain), 
        # we might return 404 or a default system tenant. 
        # For now, let's return 404 to indicate "No Tenant Context".
        raise HTTPException(status_code=404, detail="No tenant context found")
    
    try:
        uuid_obj = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    tenant = db.query(models.Tenant).filter(models.Tenant.id == uuid_obj).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return tenant
