from sqlalchemy import Column, String, Boolean, Numeric, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func, text
from database import Base

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
    eta = Column(DateTime(timezone=True))
    ata = Column(DateTime(timezone=True))
    # Fallback to simple float coordinates since PostGIS is not available in environment
    latitude = Column(Numeric(10, 6))
    longitude = Column(Numeric(10, 6))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PaymentEscrow(Base):
    __tablename__ = "payment_escrows"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="CASCADE"))
    escrow_contract_address = Column(String)
    buyer_wallet_address = Column(String, nullable=False)
    seller_wallet_address = Column(String, nullable=False)
    amount_usdc = Column(Numeric(20, 6), nullable=False)
    is_locked = Column(Boolean, default=True)
    tx_hash_deposit = Column(String)
    tx_hash_release = Column(String)
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
