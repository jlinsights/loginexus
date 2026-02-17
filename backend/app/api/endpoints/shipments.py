from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...crud import shipment as crud_shipment
from ... import schemas, models
import uuid

router = APIRouter()

@router.get("/", response_model=List[schemas.ShipmentResponse])
def read_shipments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Demo mode: Fetch all shipments without tenant filtering
    shipments = db.query(models.Shipment).offset(skip).limit(limit).all()
    return shipments

@router.get("/{shipment_id}", response_model=schemas.Shipment)
def read_shipment(shipment_id: str, db: Session = Depends(get_db), request: Request = None):
    tenant_id = getattr(request.state, "tenant_id", "default")
    db_shipment = crud_shipment.get_shipment(db, shipment_id=shipment_id, tenant_id=tenant_id)
    if db_shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return db_shipment

@router.get("/tracking/{tracking_number}", response_model=schemas.Shipment)
def read_shipment_by_tracking(tracking_number: str, db: Session = Depends(get_db)):
    # Public endpoint: No tenant check enforced for public tracking (or restrict as needed)
    # Using 'default' tenant or searching globally depending on requirements.
    # For now, we search globally or use default if multi-tenancy involves same DB
    
    # Try finding by tracking number directly
    shipment = db.query(models.Shipment).filter(models.Shipment.tracking_number == tracking_number).first()
    if not shipment:
         raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.post("/", response_model=schemas.ShipmentResponse)
def create_shipment(shipment: schemas.ShipmentCreate, db: Session = Depends(get_db)):
    # 1. Check Tenant Existence
    tenant = db.query(models.Tenant).filter(models.Tenant.id == shipment.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # 2. Create Shipment
    new_shipment = models.Shipment(**shipment.model_dump())
    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    
    # 3. Create Audit Log
    try:
        log = models.AuditLog(
            entity_type="SHIPMENT",
            entity_id=new_shipment.id,
            action="CREATE",
            new_value=shipment.model_dump(mode='json') # Serialize UUIDs/DateTimes
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
        # Build should continue even if audit log fails? User didn't specify, but best practice is transactionality.
        # However, for simplicity and following the snippet, we'll keep it separate commits as requested.

    return new_shipment
