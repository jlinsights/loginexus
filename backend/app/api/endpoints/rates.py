from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ... import schemas, models
from uuid import UUID
import uuid

router = APIRouter()

@router.get("/subscriptions", response_model=List[schemas.RateSubscriptionResponse])
def read_subscriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), request: Request = None):
    tenant_id = getattr(request.state, "tenant_id", "default")
    
    query = db.query(models.RateSubscription)
    if tenant_id != "default":
        try:
            tenant_uuid = uuid.UUID(str(tenant_id))
            query = query.filter(models.RateSubscription.tenant_id == tenant_uuid)
        except ValueError:
            pass

    return query.offset(skip).limit(limit).all()

@router.post("/subscribe", response_model=schemas.RateSubscriptionResponse)
def create_subscription(subscription: schemas.RateSubscriptionBase, db: Session = Depends(get_db), request: Request = None):
    tenant_id = getattr(request.state, "tenant_id", "default")
    
    if tenant_id == "default":
         first_tenant = db.query(models.Tenant).first()
         if not first_tenant:
             raise HTTPException(status_code=400, detail="No tenants exist.")
         tenant_uuid = first_tenant.id
    else:
         try:
             tenant_uuid = uuid.UUID(str(tenant_id))
         except ValueError:
             raise HTTPException(status_code=400, detail="Invalid tenant ID")

    db_subscription = models.RateSubscription(
        **subscription.model_dump(),
        tenant_id=tenant_uuid
    )
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription
