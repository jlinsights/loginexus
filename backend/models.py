from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

class Tenant(BaseModel):
    id: str
    name: str # e.g. "Maersk"
    subdomain: str # e.g. "maersk"
    primary_color: str # e.g. "#00FFFF"
    logo_url: str

class ShipmentStatus(str, Enum):
    IN_TRANSIT = "In Transit"
    DELIVERED = "Delivered"
    PENDING = "Pending"
    EXCEPTION = "Exception"

class BlockchainStatus(str, Enum):
    LOCKED = "Locked"
    RELEASED = "Released"
    REFUNDED = "Refunded"

class Shipment(BaseModel):
    id: str
    tenant_id: str
    origin: str
    destination: str
    status: ShipmentStatus
    blockchain_status: BlockchainStatus
    coordinates: List[float] # [lat, lng]
    eta: str
    amount: float # Freight cost

class PaymentEscrow(BaseModel):
    shipment_id: str
    tenant_id: str
    buyer_address: str
    carrier_address: str
    amount: float
    contract_address: str
    status: BlockchainStatus

class FinancialLog(BaseModel):
    id: str
    tenant_id: str
    shipment_id: str
    action: str # "DEPOSIT", "RELEASE", "REFUND"
    amount: float
    timestamp: datetime
    tx_hash: str # Blockchain Transaction Hash
    previous_hash: Optional[str] = None # For immutability chain
