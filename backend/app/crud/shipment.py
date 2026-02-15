from sqlalchemy.orm import Session
from ..models import Shipment
import uuid

def get_shipment(db: Session, shipment_id: str, tenant_id: str):
    # If using RLS, we can just query directly.
    # explicit filtering for application-level safety as well:
    try:
         uuid_obj = uuid.UUID(shipment_id)
         query = db.query(Shipment).filter(Shipment.id == uuid_obj)
    except ValueError:
         query = db.query(Shipment).filter(Shipment.tracking_number == shipment_id)
    
    if tenant_id != 'default': # 'default' implies maybe admin or specific dev handling
         query = query.filter(Shipment.tenant_id == uuid.UUID(tenant_id))
         
    return query.first()

def get_shipments_by_tenant(db: Session, tenant_id: str, skip: int = 0, limit: int = 100):
    query = db.query(Shipment)
    if tenant_id != 'default':
        query = query.filter(Shipment.tenant_id == uuid.UUID(tenant_id))
    return query.offset(skip).limit(limit).all()

def create_shipment(db: Session, shipment: dict, tenant_id: str):
    # shipment dict should match model fields
    db_shipment = Shipment(**shipment)
    if tenant_id != 'default':
        db_shipment.tenant_id = uuid.UUID(tenant_id)
    
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment
