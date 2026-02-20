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
    
    # e-POD
    pod_signature: Optional[str] = None
    pod_photos: Optional[List[str]] = None
    pod_location: Optional[dict] = None
    pod_timestamp: Optional[datetime] = None

    # Green Supply Chain
    carbon_emission: Optional[float] = 0.0
    is_green_certified: Optional[bool] = False

    # Blockchain / Escrow
    blockchain_status: Optional[str] = "NONE" # NONE, LOCKED, RELEASED
    escrow_id: Optional[UUID] = None

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

# --- Escrow Schemas ---

class EscrowStatus(str, Enum):
    CREATED = "created"
    FUNDED = "funded"
    RELEASED = "released"
    DISPUTED = "disputed"
    REFUNDED = "refunded"

class EscrowCreate(BaseModel):
    shipment_id: UUID
    buyer_wallet_address: str
    seller_wallet_address: str
    amount_usdc: float
    escrow_contract_address: str
    chain_id: Optional[int] = 11155111

class EscrowResponse(BaseModel):
    id: UUID
    shipment_id: UUID
    escrow_contract_address: Optional[str] = None
    buyer_wallet_address: str
    seller_wallet_address: str
    amount_usdc: float
    status: str
    chain_id: Optional[int] = None
    is_locked: bool
    tx_hash_deposit: Optional[str] = None
    tx_hash_release: Optional[str] = None
    tx_hash_dispute: Optional[str] = None
    tx_hash_refund: Optional[str] = None
    funded_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Analytics Schemas ---

class AnalyticsSummary(BaseModel):
    total_shipments: int
    in_transit: int
    delivered: int
    booked: int
    on_time_rate: float
    avg_transit_days: float

class VolumeDataPoint(BaseModel):
    date: str
    count: int
    status_booked: int
    status_in_transit: int
    status_delivered: int

class StatusDistribution(BaseModel):
    status: str
    count: int
    percentage: float

class RoutePerformance(BaseModel):
    origin: str
    destination: str
    shipment_count: int
    avg_transit_days: float
    on_time_rate: float

class EscrowStatusBreakdown(BaseModel):
    status: str
    count: int
    volume_usdc: float

class EscrowSummary(BaseModel):
    total_volume_usdc: float
    escrow_count: int
    status_breakdown: List[EscrowStatusBreakdown]

# --- User Schemas ---

class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "member"

class UserCreate(UserBase):
    tenant_id: UUID
    password: str

class UserResponse(UserBase):
    id: UUID
    tenant_id: UUID
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserInvite(BaseModel):
    email: str
    full_name: str
    role: str = "member"

# --- Auth Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    tenant_id: str
    role: str
    exp: int

# --- Rate Subscription Schemas ---

class RateSubscriptionBase(BaseModel):
    origin: str
    destination: str
    target_price: float
    alert_frequency: str = "daily"

class RateSubscriptionCreate(RateSubscriptionBase):
    tenant_id: UUID

class RateSubscriptionResponse(RateSubscriptionBase):
    id: UUID
    tenant_id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
