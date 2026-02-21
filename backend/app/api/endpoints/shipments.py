from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from ...database import get_db
from ...crud import shipment as crud_shipment
from ... import schemas, models
from ...core.rate_limit import limiter
from ...core.pagination import PaginationParams, PaginatedResponse
import uuid
import base64
from datetime import datetime
from ...services.oracle_service import OracleService

router = APIRouter()

# Emission Factors (kg CO2 per ton-km) - LogiNexus Constants
EMISSION_FACTORS = {
    "SEA": 0.010,   # Very Efficient
    "RAIL": 0.025,  # Efficient
    "TRUCK": 0.060, # Moderate
    "AIR": 0.600    # High Impact
}

def calculate_carbon_footprint(weight_kg: float, mode: str, distance_km: float = 8000.0) -> float:
    """
    Calculate CO2 emissions in kg.
    Default distance is 8000km (Asia-US avg) if not provided (Simplification for MVP).
    """
    mode = mode.upper() if mode else "SEA"
    factor = EMISSION_FACTORS.get(mode, 0.010)
    weight_tons = weight_kg / 1000.0
    
    # Emission = Tons * Km * Factor
    return round(weight_tons * distance_km * factor, 2)

@router.get("/", response_model=PaginatedResponse[schemas.ShipmentResponse])
def read_shipments(pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    # Demo mode: Fetch all shipments without tenant filtering
    total = db.query(models.Shipment).count()
    shipments = db.query(models.Shipment).offset(pagination.skip).limit(pagination.limit).all()

    # Enrichment: Populate blockchain_status from PaymentEscrow
    shipment_ids = [s.id for s in shipments]
    escrows = db.query(models.PaymentEscrow).filter(models.PaymentEscrow.shipment_id.in_(shipment_ids)).all()
    escrow_map = {e.shipment_id: e for e in escrows}

    for s in shipments:
        escrow = escrow_map.get(s.id)
        if escrow:
            s.escrow_id = escrow.id
            if escrow.status == 'created':
                s.blockchain_status = "UNSECURED"
            elif escrow.status == 'funded' and escrow.is_locked:
                 s.blockchain_status = "LOCKED"
            else:
                 s.blockchain_status = "UNSECURED"
        else:
            s.blockchain_status = "NONE"

    return PaginatedResponse(
        items=shipments, total=total, skip=pagination.skip, limit=pagination.limit
    )

@router.get("/{shipment_id}", response_model=schemas.Shipment)
def read_shipment(shipment_id: str, db: Session = Depends(get_db), request: Request = None):
    tenant_id = getattr(request.state, "tenant_id", "default")
    db_shipment = crud_shipment.get_shipment(db, shipment_id=shipment_id, tenant_id=tenant_id)
    if db_shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Enrich with blockchain status
    escrow = db.query(models.PaymentEscrow).filter(models.PaymentEscrow.shipment_id == db_shipment.id).first()
    if escrow:
        db_shipment.escrow_id = escrow.id
        if escrow.status == 'created':
            db_shipment.blockchain_status = "UNSECURED"
        elif escrow.status == 'funded' and escrow.is_locked:
             db_shipment.blockchain_status = "LOCKED"
        else:
             db_shipment.blockchain_status = "UNSECURED"
    else:
        db_shipment.blockchain_status = "NONE"

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
    
    # Enrich with blockchain status
    escrow = db.query(models.PaymentEscrow).filter(models.PaymentEscrow.shipment_id == shipment.id).first()
    if escrow:
        shipment.escrow_id = escrow.id
        if escrow.status == 'created':
            shipment.blockchain_status = "UNSECURED"
        elif escrow.status == 'funded' and escrow.is_locked:
             shipment.blockchain_status = "LOCKED"
        else:
             shipment.blockchain_status = "UNSECURED"
    else:
        shipment.blockchain_status = "NONE"

    return shipment

@router.post("/", response_model=schemas.ShipmentResponse)
@limiter.limit("100/minute")
def create_shipment(request: Request, shipment: schemas.ShipmentCreate, db: Session = Depends(get_db)):
    # 1. Check Tenant Existence
    tenant = db.query(models.Tenant).filter(models.Tenant.id == shipment.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # 1.5 Usage enforcement: check shipment limit
    from ...services.billing_service import BillingService
    BillingService.check_plan_limit(db, shipment.tenant_id, "shipments")

    # 2. Create Shipment
    shipment_data = shipment.model_dump()
    
    # Auto-calculate Carbon Emission
    if shipment_data.get('weight_kg'):
        shipment_data['carbon_emission'] = calculate_carbon_footprint(
            shipment_data['weight_kg'], 
            shipment_data.get('transport_mode', 'SEA')
        )
        # Simple Certification Logic: If emission is efficient (Sea/Rail), mark as Green Candidate
        if shipment_data.get('transport_mode') in ['SEA', 'RAIL']:
            shipment_data['is_green_certified'] = True

    new_shipment = models.Shipment(**shipment_data)
    db.add(new_shipment)
    db.commit()
    db.refresh(new_shipment)
    
    # 2.5 Increment usage counter
    BillingService.increment_usage(db, shipment.tenant_id, "shipments")

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

@router.post("/{tracking_number}/pod", response_model=schemas.PODUploadResponse)
@limiter.limit("100/minute")
async def upload_pod(
    request: Request,
    tracking_number: str,
    background_tasks: BackgroundTasks,
    signature: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    accuracy: Optional[str] = Form(default=None),
    receiver_name: str = Form(...),
    receiver_contact: Optional[str] = Form(default=None),
    photos: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    from ...services.pod_service import PODService

    # Read photo contents
    photo_contents = []
    for photo in photos:
        content = await photo.read()
        photo_contents.append((content, photo.content_type or "image/jpeg"))

    result = PODService.upload_pod(
        db=db,
        tracking_number=tracking_number,
        signature=signature,
        latitude=float(latitude),
        longitude=float(longitude),
        accuracy=float(accuracy) if accuracy else None,
        receiver_name=receiver_name,
        receiver_contact=receiver_contact,
        photo_contents=photo_contents,
    )

    # Trigger Oracle for Automated Settlement
    oracle_service = OracleService()
    if oracle_service.w3:
        background_tasks.add_task(oracle_service.confirm_delivery, tracking_number)

    return result


@router.get("/{tracking_number}/pod", response_model=schemas.PODDetailResponse)
def get_pod(tracking_number: str, db: Session = Depends(get_db)):
    from ...services.pod_service import PODService
    return PODService.get_pod(db, tracking_number)


@router.post("/{tracking_number}/pod/verify", response_model=schemas.PODVerifyResponse)
def verify_pod(
    tracking_number: str,
    body: schemas.PODVerifyRequest,
    db: Session = Depends(get_db),
):
    from ...services.pod_service import PODService
    return PODService.verify_pod(
        db=db,
        tracking_number=tracking_number,
        action=body.action,
        notes=body.notes,
    )


@router.get("/{tracking_number}/pod/receipt", response_model=schemas.PODReceiptResponse)
def get_pod_receipt(tracking_number: str, db: Session = Depends(get_db)):
    from ...services.pod_service import PODService
    return PODService.get_pod_receipt(db, tracking_number)


@router.get("/pods/list", response_model=schemas.PODListResponse)
def list_pods(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    from ...services.pod_service import PODService
    return PODService.list_pods(db, status_filter=status, page=page, limit=limit)
