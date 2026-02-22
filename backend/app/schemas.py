from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime, date
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
    pod_status: Optional[str] = None
    pod_receiver_name: Optional[str] = None
    pod_receiver_contact: Optional[str] = None
    pod_notes: Optional[str] = None
    pod_verified_at: Optional[datetime] = None
    pod_verified_by: Optional[str] = None

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
    plan_tier: Optional[str] = "free"
    subscription_status: Optional[str] = "active"
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

# --- Billing Schemas ---

class PlanLimits(BaseModel):
    shipments_per_month: int
    users: int
    escrows: int
    api_rate_limit: int

class PlanFeatures(BaseModel):
    analytics: str
    whitelabel: bool
    email_support: bool
    webhook_notifications: bool

class PlanInfo(BaseModel):
    tier: str
    name: str
    price_monthly: int
    price_id: Optional[str] = None
    limits: PlanLimits
    features: PlanFeatures

class PlansResponse(BaseModel):
    plans: List[PlanInfo]

class CheckoutRequest(BaseModel):
    price_id: str

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class PortalRequest(BaseModel):
    return_url: str = "/billing"

class PortalResponse(BaseModel):
    portal_url: str

class UsageItem(BaseModel):
    used: int
    limit: int
    percentage: float

class SubscriptionResponse(BaseModel):
    tenant_id: UUID
    plan_tier: str
    subscription_status: str
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None
    usage: dict
    stripe_subscription_id: Optional[str] = None

class UsageResponse(BaseModel):
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    shipments: UsageItem
    users: UsageItem
    escrows: UsageItem
    api_calls: UsageItem

class InvoiceInfo(BaseModel):
    id: str
    amount_due: int
    amount_paid: int
    currency: str
    status: Optional[str] = None
    invoice_url: Optional[str] = None
    invoice_pdf: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    created: Optional[datetime] = None

class InvoicesResponse(BaseModel):
    invoices: List[InvoiceInfo]
    has_more: bool

# --- Market Intelligence Schemas ---

class FreightIndexData(BaseModel):
    index_code: str
    index_name: str
    value: float
    change_pct: float
    recorded_at: date
    sparkline: List[float] = []

    model_config = ConfigDict(from_attributes=True)

class IndicesResponse(BaseModel):
    indices: List[FreightIndexData]

class IndexHistoryPoint(BaseModel):
    date: date
    value: float
    change_pct: float

class IndexHistoryResponse(BaseModel):
    index_code: str
    index_name: str
    period: str
    data: List[IndexHistoryPoint]

class RouteRateData(BaseModel):
    origin: str
    destination: str
    mode: str
    carrier: Optional[str] = None
    container_type: Optional[str] = None
    rate_usd: float
    transit_days_min: Optional[int] = None
    transit_days_max: Optional[int] = None
    valid_from: date
    valid_to: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)

class RatesResponse(BaseModel):
    rates: List[RouteRateData]
    total: int
    origin: Optional[str] = None
    destination: Optional[str] = None
    mode: Optional[str] = None

class RouteCompareItem(BaseModel):
    origin: str
    destination: str
    avg_rate_usd: float
    min_rate_usd: float
    max_rate_usd: float
    carrier_count: int
    latest_valid_from: Optional[date] = None

class RatesCompareResponse(BaseModel):
    routes: List[RouteCompareItem]
    mode: Optional[str] = None

class TrendDataPoint(BaseModel):
    date: date
    avg_rate: float
    volume: int

class TrendSummary(BaseModel):
    trend_direction: str  # up, down, stable
    period_change_pct: float
    avg_rate: float
    total_data_points: int

class TrendsResponse(BaseModel):
    period: str
    mode: Optional[str] = None
    data: List[TrendDataPoint]
    summary: TrendSummary

class InsightData(BaseModel):
    type: str
    title: str
    description: str
    severity: str  # info, warning, opportunity
    data: dict = {}

class InsightsResponse(BaseModel):
    insights: List[InsightData]
    generated_at: datetime

# --- Rate Subscription Schemas ---

class RateSubscriptionBase(BaseModel):
    origin: str
    destination: str
    target_price: float
    alert_frequency: str = "daily"
    mode: str = "ocean_fcl"

class RateSubscriptionCreate(RateSubscriptionBase):
    tenant_id: UUID

class RateSubscriptionResponse(RateSubscriptionBase):
    id: UUID
    tenant_id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- POD Schemas ---

class PODStatus(str, Enum):
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    DISPUTED = "disputed"

class PODUploadResponse(BaseModel):
    message: str
    status: str
    pod_status: str
    tracking_number: str
    pod_timestamp: datetime
    photo_count: int

class PODDetailResponse(BaseModel):
    tracking_number: str
    pod_status: Optional[str] = None
    pod_signature: Optional[str] = None
    pod_photos: Optional[List[str]] = None
    pod_location: Optional[dict] = None
    pod_timestamp: Optional[datetime] = None
    pod_receiver_name: Optional[str] = None
    pod_receiver_contact: Optional[str] = None
    pod_notes: Optional[str] = None
    pod_verified_at: Optional[datetime] = None
    pod_verified_by: Optional[str] = None
    shipment_origin: str
    shipment_destination: str
    current_status: str

    model_config = ConfigDict(from_attributes=True)

class PODVerifyRequest(BaseModel):
    action: str
    notes: Optional[str] = None

class PODVerifyResponse(BaseModel):
    tracking_number: str
    pod_status: str
    pod_verified_at: Optional[datetime] = None
    pod_verified_by: Optional[str] = None
    pod_notes: Optional[str] = None

class PODListItem(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    pod_status: Optional[str] = None
    pod_timestamp: Optional[datetime] = None
    pod_receiver_name: Optional[str] = None
    photo_count: int = 0
    current_status: str

    model_config = ConfigDict(from_attributes=True)

class PODListResponse(BaseModel):
    items: List[PODListItem]
    total: int
    page: int
    limit: int

class PODReceiptResponse(BaseModel):
    tracking_number: str
    pod_status: Optional[str] = None
    pod_timestamp: Optional[datetime] = None
    pod_receiver_name: Optional[str] = None
    pod_location: Optional[dict] = None
    photo_count: int = 0
    origin: str
    destination: str
    verified: bool = False
    verified_at: Optional[datetime] = None
