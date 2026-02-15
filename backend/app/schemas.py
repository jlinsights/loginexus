from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from enum import Enum

# --- Shipment Schemas ---

class ShipmentStatus(str, Enum):
    BOOKED = "BOOKED"
    IN_TRANSIT = "In Transit"
    DELIVERED = "Delivered"

# Shared properties
class ShipmentBase(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    current_status: Optional[str] = "BOOKED"
    eta: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    container_number: Optional[str] = None

# Properties to receive on creation
class ShipmentCreate(ShipmentBase):
    tenant_id: UUID

# Properties to return to client
class Shipment(ShipmentBase):
    id: UUID
    tenant_id: Optional[UUID] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ShipmentResponse(ShipmentCreate):
    id: UUID
    current_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Tenant Schemas ---

class TenantBase(BaseModel):
    name: str
    subdomain: str
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#1E40AF"
    contact_email: Optional[str] = None

class TenantCreate(TenantBase):
    pass

class TenantResponse(TenantBase):
    id: UUID
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
