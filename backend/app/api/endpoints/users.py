from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ... import schemas, models
from uuid import UUID
import uuid

router = APIRouter()

@router.get("/", response_model=List[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), request: Request = None):
    # In a real app, strict tenant filtering is mandatory.
    # For demo/benchmarking, we'll try to use the tenant_id in state if present.
    tenant_id = getattr(request.state, "tenant_id", "default")
    
    query = db.query(models.User)
    if tenant_id != "default":
        # Check if tenant exists
         try:
            tenant_uuid = uuid.UUID(str(tenant_id))
            query = query.filter(models.User.tenant_id == tenant_uuid)
         except ValueError:
             pass 

    return query.offset(skip).limit(limit).all()

@router.post("/invite", response_model=schemas.UserResponse)
def invite_user(invite: schemas.UserInvite, db: Session = Depends(get_db), request: Request = None):
    tenant_id = getattr(request.state, "tenant_id", "default")
    
    # Needs a valid tenant context
    if tenant_id == "default":
        # For demo, if no tenant context, pick the first one or error
        first_tenant = db.query(models.Tenant).first()
        if not first_tenant:
             raise HTTPException(status_code=400, detail="No tenants exist to invite user to.")
        tenant_uuid = first_tenant.id
    else:
        try:
             tenant_uuid = uuid.UUID(str(tenant_id))
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid tenant ID")

    # Check if email exists
    if db.query(models.User).filter(models.User.email == invite.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create User (Mock password for now)
    db_user = models.User(
        email=invite.email,
        full_name=invite.full_name,
        role=invite.role,
        tenant_id=tenant_uuid,
        password_hash="mock_hash_123" # In real app, generate temp password or send email link
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
