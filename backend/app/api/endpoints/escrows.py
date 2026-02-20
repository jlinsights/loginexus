from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
from ...database import get_db
from ... import schemas, models
from ...core.rate_limit import limiter

router = APIRouter()


@router.post("/", response_model=schemas.EscrowResponse)
@limiter.limit("100/minute")
def create_escrow(request: Request, escrow: schemas.EscrowCreate, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(
        models.Shipment.id == escrow.shipment_id
    ).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    existing = db.query(models.PaymentEscrow).filter(
        models.PaymentEscrow.shipment_id == escrow.shipment_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Escrow already exists for this shipment")

    db_escrow = models.PaymentEscrow(**escrow.model_dump())
    db.add(db_escrow)
    db.commit()
    db.refresh(db_escrow)

    log = models.AuditLog(
        entity_type="ESCROW",
        entity_id=db_escrow.id,
        action="CREATE",
        new_value=escrow.model_dump(mode="json"),
    )
    db.add(log)
    db.commit()

    return db_escrow


@router.get("/{escrow_id}", response_model=schemas.EscrowResponse)
def get_escrow(escrow_id: str, db: Session = Depends(get_db)):
    escrow = db.query(models.PaymentEscrow).filter(
        models.PaymentEscrow.id == escrow_id
    ).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    return escrow


@router.get("/shipment/{shipment_id}", response_model=schemas.EscrowResponse)
def get_escrow_by_shipment(shipment_id: str, db: Session = Depends(get_db)):
    escrow = db.query(models.PaymentEscrow).filter(
        models.PaymentEscrow.shipment_id == shipment_id
    ).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found for this shipment")
    return escrow


@router.post("/{escrow_id}/sync", response_model=schemas.EscrowResponse)
def sync_escrow(escrow_id: str, db: Session = Depends(get_db)):
    """Trigger on-chain event sync for a specific escrow."""
    escrow = db.query(models.PaymentEscrow).filter(
        models.PaymentEscrow.id == escrow_id
    ).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    if not escrow.escrow_contract_address:
        raise HTTPException(status_code=400, detail="No contract address to sync")

    # Sync is handled by the background service; this endpoint
    # returns current DB state. A full implementation would call
    # escrow_sync.sync_single() here.
    return escrow


@router.post("/{escrow_id}/simulate_payment", response_model=schemas.EscrowResponse)
def simulate_payment(escrow_id: str, db: Session = Depends(get_db)):
    """
    BENCHMARK/DEMO ONLY: Simulate funding an escrow.
    """
    escrow = db.query(models.PaymentEscrow).filter(
        models.PaymentEscrow.id == escrow_id
    ).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    escrow.status = "funded"
    escrow.is_locked = True
    escrow.funded_at = func.now()
    
    db.commit()
    db.refresh(escrow)
    
    return escrow
