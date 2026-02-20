from sqlalchemy import Column, String, Boolean, Numeric, DateTime, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func, text
from .database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False)
    subdomain = Column(String, unique=True, nullable=False)
    logo_url = Column(String)
    primary_color = Column(String, default="#1E40AF")
    contact_email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))
    tracking_number = Column(String, unique=True, nullable=False)
    container_number = Column(String)
    vessel_name = Column(String)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    current_status = Column(String, default="BOOKED")
    transport_mode = Column(String, default="SEA") # SEA, AIR, RAIL, TRUCK
    weight_kg = Column(Numeric(10, 2), default=0.0)
    eta = Column(DateTime(timezone=True))
    ata = Column(DateTime(timezone=True))
    # Fallback to simple float coordinates since PostGIS is not available in environment
    latitude = Column(Numeric(10, 6))
    longitude = Column(Numeric(10, 6))
    
    # e-POD Fields
    pod_signature = Column(Text) # Base64 Data URL
    pod_photos = Column(JSONB)   # List of strings (URLs or Base64)
    pod_location = Column(JSONB) # {"lat": ..., "lng": ...}
    pod_timestamp = Column(DateTime(timezone=True))
    
    # Green Supply Chain
    carbon_emission = Column(Float, default=0.0) # kg CO2
    is_green_certified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PaymentEscrow(Base):
    __tablename__ = "payment_escrows"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="CASCADE"))
    escrow_contract_address = Column(String)
    buyer_wallet_address = Column(String, nullable=False)
    seller_wallet_address = Column(String, nullable=False)
    amount_usdc = Column(Numeric(20, 6), nullable=False)
    status = Column(String, default="created")  # created|funded|released|disputed|refunded
    chain_id = Column(Integer, default=11155111)  # Sepolia
    is_locked = Column(Boolean, default=True)
    tx_hash_deposit = Column(String)
    tx_hash_release = Column(String)
    tx_hash_dispute = Column(String)
    tx_hash_refund = Column(String)
    delivery_deadline = Column(DateTime(timezone=True))
    funded_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String, nullable=False)
    old_value = Column(JSONB)
    new_value = Column(JSONB)
    performed_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="member") # admin, member, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class RateSubscription(Base):
    __tablename__ = "rate_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    target_price = Column(Numeric(10, 2))
    alert_frequency = Column(String, default="daily") # daily, instant
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
