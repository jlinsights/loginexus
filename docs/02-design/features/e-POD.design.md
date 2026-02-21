# e-POD (Electronic Proof of Delivery) Design Document

> **Summary**: Technical design for e-POD feature hardening: file-based photo storage, POD retrieval/verification APIs, admin dashboard, frontend refactor with i18n and image compression
>
> **Project**: LogiNexus
> **Version**: 0.1.0
> **Author**: Development Team
> **Date**: 2026-02-21
> **Status**: Draft
> **Planning Doc**: [e-POD.plan.md](../../01-plan/features/e-POD.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. Migrate photo storage from base64-in-DB to file system URLs (eliminate DB bloat)
2. Add POD retrieval and verification API endpoints with status lifecycle
3. Create admin POD dashboard for viewing and managing POD submissions
4. Refactor frontend to use `lib/api.ts` Axios client, add i18n and image compression
5. Maintain backward compatibility with existing base64 POD data
6. Preserve existing oracle settlement integration

### 1.2 Design Principles

- **Backward Compatibility**: Existing base64 POD data remains readable; new uploads use file storage
- **Separation of Concerns**: POD business logic extracted to dedicated service layer
- **Mobile-First**: Driver-facing POD form optimized for touch devices and 4G networks
- **Immutability**: Verified POD data cannot be modified (data integrity)
- **Progressive Enhancement**: Admin features layered on top of existing driver flow

---

## 2. Architecture

### 2.1 Component Diagram

```
                  Driver (Mobile)                    Admin (Desktop)
                       |                                  |
                       v                                  v
              ┌─────────────────┐              ┌─────────────────┐
              │  ElectronicPOD  │              │  POD Dashboard   │
              │  (Refactored)   │              │  List + Detail   │
              └────────┬────────┘              └────────┬────────┘
                       |                                |
                       v                                v
              ┌──────────────────────────────────────────┐
              │           lib/api.ts (Axios)              │
              │  uploadPOD / fetchPOD / verifyPOD / ...  │
              └──────────────────┬───────────────────────┘
                                 |
                                 v
              ┌──────────────────────────────────────────┐
              │     FastAPI  /api/v1/shipments/...       │
              │  upload_pod / get_pod / verify_pod       │
              └──────────────────┬───────────────────────┘
                                 |
                        ┌────────┴────────┐
                        v                 v
              ┌─────────────────┐  ┌──────────────┐
              │  pod_service.py │  │  storage.py   │
              │  Business Logic │  │  File Storage │
              └────────┬────────┘  └──────┬───────┘
                       |                  |
                       v                  v
              ┌──────────────┐    ┌───────────────┐
              │  PostgreSQL  │    │  /uploads/pod/ │
              │  (metadata)  │    │  (photo files) │
              └──────────────┘    └───────────────┘
                       |
                       v
              ┌──────────────────┐
              │  Oracle Service  │
              │  (Settlement)    │
              └──────────────────┘
```

### 2.2 Data Flow

#### POD Upload Flow
```
Driver opens POD link → Captures photos → Signs signature pad → Submits
  → Client compresses images (Canvas API, max 800px, < 500KB)
  → Client sends FormData via Axios to POST /shipments/{tracking}/pod
  → pod_service validates input (file size, photo count, tracking exists)
  → storage.save_files() writes photos to disk, returns URL list
  → pod_service updates Shipment (pod_* fields, status=DELIVERED, pod_status=submitted)
  → Audit log created
  → Oracle settlement triggered (background task)
  → Response with POD summary returned
```

#### POD Verification Flow
```
Admin views POD list → Selects a POD → Reviews details (photos, signature, GPS, receiver)
  → Admin clicks "Verify" or "Dispute"
  → POST /shipments/{tracking}/pod/verify with {action: "verify"|"dispute", notes}
  → pod_service checks pod_status is "submitted" (not already verified/disputed)
  → Updates pod_status → "verified" or "disputed"
  → Audit log created
  → Response confirms status change
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| ElectronicPOD.tsx | lib/api.ts | HTTP calls to backend |
| ElectronicPOD.tsx | react-signature-canvas | Signature capture |
| PODDetail.tsx | lib/api.ts | Fetch POD data, verify/dispute actions |
| PODList.tsx | lib/api.ts | Fetch POD list with filters |
| pod_service.py | storage.py | File storage operations |
| pod_service.py | models.py | Database operations |
| pod_service.py | oracle_service.py | Blockchain settlement trigger |
| storage.py | core/config.py | Storage path configuration |
| shipments.py endpoints | pod_service.py | Business logic delegation |

---

## 3. Data Model

### 3.1 Shipment Model Changes (EXTEND)

```python
# backend/app/models.py - Shipment class additions

class Shipment(Base):
    # ... existing fields ...

    # e-POD Fields (existing)
    pod_signature = Column(Text)                        # Base64 Data URL (keep as-is)
    pod_photos = Column(JSONB)                          # CHANGE: List of file URL strings (not base64)
    pod_location = Column(JSONB)                        # {"lat": float, "lng": float, "accuracy": float}
    pod_timestamp = Column(DateTime(timezone=True))

    # e-POD Fields (NEW)
    pod_status = Column(String, default=None)           # None | submitted | verified | disputed
    pod_receiver_name = Column(String, nullable=True)   # Receiver's name
    pod_receiver_contact = Column(String, nullable=True) # Receiver's phone/email (optional)
    pod_notes = Column(Text, nullable=True)             # Admin notes (verification/dispute reason)
    pod_verified_at = Column(DateTime(timezone=True), nullable=True)  # When verified/disputed
    pod_verified_by = Column(String, nullable=True)     # Who verified (admin user ID or name)
```

### 3.2 POD Status Enum

```python
# backend/app/schemas.py

class PODStatus(str, Enum):
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    DISPUTED = "disputed"
```

### 3.3 Entity Relationships

```
[Tenant] 1 ──── N [Shipment]
                      │
                      ├── pod_signature (Text, base64 PNG)
                      ├── pod_photos (JSONB, list of URL strings)
                      ├── pod_location (JSONB)
                      ├── pod_status (String enum)
                      ├── pod_receiver_name (String)
                      └── pod_timestamp (DateTime)
                      │
                      └── 0..1 [PaymentEscrow] (oracle settlement)
```

### 3.4 No New Tables

POD data remains on the Shipment model (1:1 relationship). No separate POD table needed for v1.

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/v1/shipments/{tracking_number}/pod | Upload POD (REFACTOR) | Tracking number (public) |
| GET | /api/v1/shipments/{tracking_number}/pod | Retrieve POD details (NEW) | Tracking number (public) |
| POST | /api/v1/shipments/{tracking_number}/pod/verify | Verify/Dispute POD (NEW) | Admin required |
| GET | /api/v1/shipments/pods | List all POD submissions (NEW) | Admin required |
| GET | /api/v1/shipments/{tracking_number}/pod/receipt | Public POD receipt (NEW) | Public (read-only) |

### 4.2 Detailed Specification

#### `POST /api/v1/shipments/{tracking_number}/pod` (REFACTOR)

Refactored to use file storage and accept receiver info.

**Request** (multipart/form-data):
```
signature: string (required) - Base64 PNG data URL
latitude: string (required) - GPS latitude
longitude: string (required) - GPS longitude
accuracy: string (optional) - GPS accuracy in meters
receiver_name: string (required) - Receiver's full name
receiver_contact: string (optional) - Receiver's phone or email
photos: File[] (optional, max 5) - Delivery photo files (JPEG/PNG, max 5MB each)
```

**Response (200 OK):**
```json
{
  "message": "POD uploaded successfully",
  "status": "DELIVERED",
  "pod_status": "submitted",
  "tracking_number": "LNX-2026-0001",
  "pod_timestamp": "2026-02-21T10:30:00Z",
  "photo_count": 3
}
```

**Error Responses:**
- `404 Not Found`: Shipment with tracking number not found
- `400 Bad Request`: Missing signature, invalid GPS, file too large (>5MB), too many photos (>5)
- `409 Conflict`: POD already submitted for this shipment
- `413 Payload Too Large`: Total upload exceeds limit
- `429 Too Many Requests`: Rate limit exceeded

**Changes from current:**
- Accepts `receiver_name` and `receiver_contact` Form fields
- Accepts `accuracy` Form field for GPS accuracy
- Stores photos as file URLs instead of base64
- Sets `pod_status = "submitted"`
- Returns structured response (not just message string)
- Rejects if POD already submitted (409)

---

#### `GET /api/v1/shipments/{tracking_number}/pod` (NEW)

Retrieve full POD details for a shipment.

**Response (200 OK):**
```json
{
  "tracking_number": "LNX-2026-0001",
  "pod_status": "submitted",
  "pod_signature": "data:image/png;base64,...",
  "pod_photos": [
    "/uploads/pod/LNX-2026-0001_1708512600_0.jpg",
    "/uploads/pod/LNX-2026-0001_1708512600_1.jpg"
  ],
  "pod_location": {
    "lat": 37.5665,
    "lng": 126.9780,
    "accuracy": 15.0
  },
  "pod_timestamp": "2026-02-21T10:30:00Z",
  "pod_receiver_name": "Kim Cheolsu",
  "pod_receiver_contact": "010-1234-5678",
  "pod_notes": null,
  "pod_verified_at": null,
  "pod_verified_by": null,
  "shipment_origin": "Shanghai",
  "shipment_destination": "Busan",
  "current_status": "Delivered"
}
```

**Error Responses:**
- `404 Not Found`: Shipment not found or no POD submitted

**Notes:**
- For backward compatibility, if `pod_photos` contains base64 strings (legacy data), return them as-is
- Public endpoint (no auth required) - accessible via tracking number URL

---

#### `POST /api/v1/shipments/{tracking_number}/pod/verify` (NEW)

Admin action to verify or dispute a POD submission.

**Request:**
```json
{
  "action": "verify",
  "notes": "All photos match delivery location"
}
```

**Response (200 OK):**
```json
{
  "tracking_number": "LNX-2026-0001",
  "pod_status": "verified",
  "pod_verified_at": "2026-02-21T14:00:00Z",
  "pod_verified_by": "admin@loginexus.com",
  "pod_notes": "All photos match delivery location"
}
```

**Error Responses:**
- `404 Not Found`: Shipment not found or no POD
- `400 Bad Request`: Invalid action (must be "verify" or "dispute")
- `409 Conflict`: POD already verified/disputed (immutable after verification)
- `403 Forbidden`: Non-admin user (when auth is enforced)

**Validation Rules:**
- `action` must be "verify" or "dispute"
- POD must exist (`pod_status` is "submitted")
- Cannot re-verify or re-dispute (immutable after first action)

---

#### `GET /api/v1/shipments/pods` (NEW)

List all shipments that have POD data, with filtering.

**Query Parameters:**
```
status: string (optional) - Filter by pod_status: submitted|verified|disputed
page: int (optional, default: 1) - Page number
limit: int (optional, default: 20) - Items per page
sort: string (optional, default: "-pod_timestamp") - Sort field with direction prefix
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "tracking_number": "LNX-2026-0001",
      "origin": "Shanghai",
      "destination": "Busan",
      "pod_status": "submitted",
      "pod_timestamp": "2026-02-21T10:30:00Z",
      "pod_receiver_name": "Kim Cheolsu",
      "photo_count": 3,
      "current_status": "Delivered"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

#### `GET /api/v1/shipments/{tracking_number}/pod/receipt` (NEW)

Public read-only POD receipt page data (shareable link).

**Response (200 OK):**
```json
{
  "tracking_number": "LNX-2026-0001",
  "pod_status": "verified",
  "pod_timestamp": "2026-02-21T10:30:00Z",
  "pod_receiver_name": "Kim Cheolsu",
  "pod_location": {"lat": 37.5665, "lng": 126.9780},
  "photo_count": 3,
  "origin": "Shanghai",
  "destination": "Busan",
  "verified": true,
  "verified_at": "2026-02-21T14:00:00Z"
}
```

**Notes:**
- No signature data returned (privacy)
- No full photo URLs (only count)
- Designed for shareable verification links

---

## 5. UI/UX Design

### 5.1 Driver POD Form (REFACTOR ElectronicPOD.tsx)

```
┌────────────────────────────────┐
│  [MapPin] e-POD Entry   [TRK] │  <- Header with tracking number
├────────────────────────────────┤
│                                │
│  Receiver Name *               │  <- NEW: Text input
│  ┌──────────────────────────┐  │
│  │ Kim Cheolsu              │  │
│  └──────────────────────────┘  │
│                                │
│  Receiver Contact (optional)   │  <- NEW: Text input
│  ┌──────────────────────────┐  │
│  │ 010-1234-5678            │  │
│  └──────────────────────────┘  │
│                                │
│  [Camera] Cargo Photos (0/5)   │  <- CHANGE: Max 5 (was 3)
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ +  │ │    │ │    │ │    │  │  <- Grid with previews
│  └────┘ └────┘ └────┘ └────┘  │
│                                │
│  [GPS] Location                │  <- NEW: Accuracy indicator
│  [====------] 15m accuracy     │
│  [Retry] [Enter Manually]     │  <- NEW: Retry + fallback
│                                │
│  Receiver Signature            │
│  ┌──────────────────────────┐  │
│  │                          │  │  <- Signature canvas (touch)
│  │        ✍️                 │  │
│  │                          │  │
│  └──────────────────────────┘  │
│  [Clear]                       │
│                                │
│  [❌ Error message area]       │  <- Error display
│                                │
│  ┌──────────────────────────┐  │
│  │   Confirm Delivery       │  │  <- Submit button
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

### 5.2 Admin POD Dashboard (/dashboard/pod)

```
┌──────────────────────────────────────────────────────┐
│  Sidebar │  POD Management                            │
│          │                                            │
│  ...     │  ┌─────────────────────────────────────┐   │
│          │  │ Filter: [All ▼] [Search...] [Date]  │   │
│  POD ◄── │  └─────────────────────────────────────┘   │
│          │                                            │
│          │  ┌──────────────────────────────────────┐  │
│          │  │ TRK#         │ Route    │ Status │ TS │  │
│          │  ├──────────────┼──────────┼────────┼────│  │
│          │  │ LNX-2026-001 │ SH→BS   │ ✅ sub │ 2h │  │
│          │  │ LNX-2026-002 │ SZ→ICN  │ ✓ ver  │ 1d │  │
│          │  │ LNX-2026-003 │ TK→NY   │ ⚠ dis  │ 3d │  │
│          │  └──────────────────────────────────────┘  │
│          │                                            │
│          │  ← 1 2 3 ... →                             │
└──────────┴────────────────────────────────────────────┘
```

### 5.3 POD Detail View (Modal or Page)

```
┌────────────────────────────────────────────┐
│  POD Details - LNX-2026-0001               │
│  Status: [submitted]  2026-02-21 10:30     │
├────────────────────────────────────────────┤
│                                            │
│  Route: Shanghai → Busan                   │
│  Receiver: Kim Cheolsu (010-1234-5678)     │
│                                            │
│  Photos:                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐               │
│  │  📷  │ │  📷  │ │  📷  │               │
│  └──────┘ └──────┘ └──────┘               │
│                                            │
│  Signature:                                │
│  ┌────────────────────────────┐            │
│  │  ✍️ [signature image]      │            │
│  └────────────────────────────┘            │
│                                            │
│  GPS Location:                             │
│  [Mini map with pin] 37.57, 126.98         │
│                                            │
│  Admin Notes:                              │
│  ┌────────────────────────────┐            │
│  │ (enter verification notes) │            │
│  └────────────────────────────┘            │
│                                            │
│  ┌──────────┐  ┌──────────┐               │
│  │ ✅ Verify │  │ ⚠ Dispute│               │
│  └──────────┘  └──────────┘               │
│                                            │
└────────────────────────────────────────────┘
```

### 5.4 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| ElectronicPOD.tsx | frontend/app/components/ | REFACTOR: Driver POD form with compression, i18n, api.ts |
| PODList.tsx | frontend/app/components/ | NEW: Admin POD list with status filters |
| PODDetail.tsx | frontend/app/components/ | NEW: POD detail view with verify/dispute actions |
| PODReceipt.tsx | frontend/app/components/ | NEW: Read-only POD receipt (shareable) |
| pod/page.tsx | frontend/app/[locale]/dashboard/pod/ | NEW: Admin POD dashboard page |
| pod/[trackingId]/page.tsx | frontend/app/[locale]/pod/ | EXTEND: Driver POD entry page |

### 5.5 User Flow

```
Driver Flow:
  Receives SMS link → Opens /pod/{trackingId}
    → Enters receiver name → Takes photos → Signs
    → Submits → Success confirmation page

Admin Flow:
  Dashboard → Sidebar "POD" → /dashboard/pod
    → Views POD list (filterable by status)
    → Clicks a POD → Detail view
    → Reviews photos, signature, GPS, receiver info
    → Verifies or Disputes with notes
```

---

## 6. Backend Services

### 6.1 Storage Abstraction (NEW: `backend/app/core/storage.py`)

```python
import os
import uuid
from datetime import datetime
from ..core.config import settings

class StorageBackend:
    """File storage abstraction. Local filesystem for v1, S3-ready interface."""

    def __init__(self):
        self.storage_path = getattr(settings, 'POD_STORAGE_PATH', './uploads/pod')
        os.makedirs(self.storage_path, exist_ok=True)

    def save_file(self, content: bytes, tracking_number: str, index: int,
                  content_type: str = "image/jpeg") -> str:
        """Save file and return relative URL path."""
        timestamp = int(datetime.utcnow().timestamp())
        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        filename = f"{tracking_number}_{timestamp}_{index}.{ext}"
        filepath = os.path.join(self.storage_path, filename)

        with open(filepath, 'wb') as f:
            f.write(content)

        return f"/uploads/pod/{filename}"

    def delete_files(self, urls: list[str]):
        """Delete files by URL paths."""
        for url in urls:
            filepath = os.path.join('.', url.lstrip('/'))
            if os.path.exists(filepath):
                os.remove(filepath)

    def get_file_path(self, url: str) -> str:
        """Convert URL to local file path."""
        return os.path.join('.', url.lstrip('/'))

storage = StorageBackend()
```

### 6.2 POD Service (NEW: `backend/app/services/pod_service.py`)

```python
class PODService:
    """Business logic for POD operations."""

    MAX_PHOTOS = 5
    MAX_FILE_SIZE_MB = 5

    @staticmethod
    def upload_pod(db, tracking_number, signature, latitude, longitude,
                   accuracy, receiver_name, receiver_contact, photos) -> dict:
        """Process POD upload: validate, store files, update shipment."""
        # 1. Find shipment
        # 2. Check not already submitted (409 if pod_status is not None)
        # 3. Validate photos (count <= MAX_PHOTOS, size <= MAX_FILE_SIZE_MB)
        # 4. Save photos via storage.save_file()
        # 5. Update shipment fields (pod_*, current_status, pod_status)
        # 6. Create audit log
        # 7. Return summary dict

    @staticmethod
    def get_pod(db, tracking_number) -> dict:
        """Retrieve POD details for a shipment."""
        # 1. Find shipment
        # 2. Check pod_status is not None
        # 3. Return POD data dict

    @staticmethod
    def verify_pod(db, tracking_number, action, notes, verified_by) -> dict:
        """Verify or dispute a POD submission."""
        # 1. Find shipment
        # 2. Check pod_status is "submitted"
        # 3. Update pod_status, pod_notes, pod_verified_at, pod_verified_by
        # 4. Create audit log
        # 5. Return updated POD dict

    @staticmethod
    def list_pods(db, status_filter, page, limit, sort) -> dict:
        """List shipments with POD data, with filtering and pagination."""
        # 1. Query shipments where pod_status IS NOT NULL
        # 2. Apply status filter if provided
        # 3. Apply sorting and pagination
        # 4. Return paginated result with photo_count computed
```

### 6.3 Config Additions (EXTEND: `backend/app/core/config.py`)

```python
class Settings(BaseSettings):
    # ... existing fields ...

    # --- POD Storage ---
    POD_STORAGE_PATH: str = "./uploads/pod"
    POD_STORAGE_BACKEND: str = "local"  # local | s3
    POD_MAX_PHOTOS: int = 5
    POD_MAX_FILE_SIZE_MB: int = 5
```

---

## 7. Pydantic Schemas (EXTEND)

### 7.1 New POD Schemas

```python
# backend/app/schemas.py additions

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
    action: str  # "verify" or "dispute"
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
```

### 7.2 ShipmentBase Schema Update

```python
class ShipmentBase(BaseModel):
    # ... existing fields ...

    # e-POD (add new fields)
    pod_status: Optional[str] = None
    pod_receiver_name: Optional[str] = None
    pod_receiver_contact: Optional[str] = None
    pod_notes: Optional[str] = None
    pod_verified_at: Optional[datetime] = None
    pod_verified_by: Optional[str] = None
```

---

## 8. Frontend API Functions (EXTEND `lib/api.ts`)

### 8.1 New TypeScript Interfaces

```typescript
// POD Interfaces
export interface PODUploadResponse {
    message: string;
    status: string;
    pod_status: string;
    tracking_number: string;
    pod_timestamp: string;
    photo_count: number;
}

export interface PODDetail {
    tracking_number: string;
    pod_status: string | null;
    pod_signature: string | null;
    pod_photos: string[] | null;
    pod_location: { lat: number; lng: number; accuracy?: number } | null;
    pod_timestamp: string | null;
    pod_receiver_name: string | null;
    pod_receiver_contact: string | null;
    pod_notes: string | null;
    pod_verified_at: string | null;
    pod_verified_by: string | null;
    shipment_origin: string;
    shipment_destination: string;
    current_status: string;
}

export interface PODListItem {
    tracking_number: string;
    origin: string;
    destination: string;
    pod_status: string | null;
    pod_timestamp: string | null;
    pod_receiver_name: string | null;
    photo_count: number;
    current_status: string;
}

export interface PODVerifyRequest {
    action: 'verify' | 'dispute';
    notes?: string;
}
```

### 8.2 New API Functions

```typescript
// --- POD API ---

export const uploadPOD = async (
    trackingNumber: string,
    formData: FormData
): Promise<PODUploadResponse> => {
    const response = await api.post<PODUploadResponse>(
        `/v1/shipments/${trackingNumber}/pod`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const fetchPOD = async (trackingNumber: string): Promise<PODDetail> => {
    const response = await api.get<PODDetail>(
        `/v1/shipments/${trackingNumber}/pod`
    );
    return response.data;
};

export const verifyPOD = async (
    trackingNumber: string,
    data: PODVerifyRequest
): Promise<{ tracking_number: string; pod_status: string }> => {
    const response = await api.post(
        `/v1/shipments/${trackingNumber}/pod/verify`,
        data
    );
    return response.data;
};

export const fetchPODList = async (
    params?: { status?: string; page?: number; limit?: number }
): Promise<{ items: PODListItem[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/v1/shipments/pods', { params });
    return response.data;
};

export const fetchPODReceipt = async (
    trackingNumber: string
): Promise<PODDetail> => {
    const response = await api.get(
        `/v1/shipments/${trackingNumber}/pod/receipt`
    );
    return response.data;
};
```

---

## 9. Image Compression (Client-Side)

### 9.1 Compression Utility

```typescript
// Inline in ElectronicPOD.tsx (no separate file needed)

async function compressImage(file: File, maxDimension = 800, quality = 0.7): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Scale down if exceeds max dimension
            if (width > maxDimension || height > maxDimension) {
                const ratio = Math.min(maxDimension / width, maxDimension / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                } else {
                    resolve(file); // Fallback to original
                }
            }, 'image/jpeg', quality);
        };
        img.src = URL.createObjectURL(file);
    });
}
```

### 9.2 Compression Rules

- Max dimension: 800px (width or height)
- Output format: JPEG
- Quality: 0.7 (70%)
- Target: < 500KB per photo
- Applied before upload, after file selection

---

## 10. Error Handling

### 10.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid input | Missing required fields, bad GPS data, unsupported file type | Show field-specific errors on form |
| 404 | Shipment not found | Invalid tracking number | Show "Invalid tracking number" message |
| 409 | POD already submitted | Duplicate POD upload attempt | Show "POD already submitted" with link to receipt |
| 413 | File too large | Photo exceeds 5MB after compression | Show per-file size error, suggest retaking photo |
| 429 | Rate limit exceeded | Too many requests | Show "Please wait" with retry timer |
| 500 | Internal server error | Storage write failure, DB error | Show generic error with retry option |

### 10.2 Error Response Format

```json
{
  "detail": "POD already submitted for this shipment",
  "error_code": "POD_ALREADY_SUBMITTED"
}
```

### 10.3 Geolocation Error Handling

```
1. Request GPS → Success → Show accuracy indicator
2. Request GPS → Denied → Show "Location required" + manual entry option
3. Request GPS → Timeout → Auto-retry (3 attempts with 2s intervals)
4. Request GPS → Unavailable → Show "GPS not available" + manual entry fallback
5. Accuracy > 100m → Show warning "Low accuracy" + allow proceed
```

---

## 11. Security Considerations

- [x] File upload validation: MIME type check (image/jpeg, image/png only)
- [x] File size limit: 5MB per photo enforced server-side
- [x] Photo count limit: Max 5 photos enforced server-side
- [x] Tracking number as implicit auth for driver POD page (no JWT needed)
- [x] Admin POD endpoints require admin role (when auth is enforced, DEMO_MODE bypass)
- [x] POD data immutable after verification (cannot re-verify or modify)
- [x] No directory traversal: sanitized filenames using tracking_number + timestamp
- [x] Rate limiting: 100/minute on upload endpoint (existing)
- [x] Uploaded files served from `/uploads/` static path (not executable)
- [x] Signature data kept as base64 (no file storage needed, small payload)

---

## 12. i18n Support

### 12.1 Translation Keys

```json
{
  "pod": {
    "title": "e-POD Entry",
    "receiverName": "Receiver Name",
    "receiverContact": "Receiver Contact (optional)",
    "photos": "Cargo Photos",
    "photosMax": "Max {{max}}",
    "signature": "Receiver Signature",
    "signHint": "Sign above using your finger",
    "clear": "Clear",
    "submit": "Confirm Delivery",
    "submitting": "Uploading Proof...",
    "success": "Delivery Confirmed!",
    "successMessage": "Proof of Delivery has been successfully uploaded.",
    "tracking": "Tracking",
    "location": "Location",
    "accuracy": "{{meters}}m accuracy",
    "retry": "Retry",
    "manualEntry": "Enter Manually",
    "errors": {
      "signatureRequired": "Please sign the digital pad.",
      "receiverNameRequired": "Please enter the receiver's name.",
      "geoNotSupported": "Geolocation is not supported by your browser.",
      "geoFailed": "Unable to retrieve location. Please enable location services.",
      "uploadFailed": "Failed to submit Proof of Delivery. Please try again.",
      "alreadySubmitted": "POD has already been submitted for this shipment.",
      "fileTooLarge": "Photo is too large. Maximum size is 5MB."
    }
  }
}
```

### 12.2 Locale Files

- `frontend/messages/en.json` - English (extend existing)
- `frontend/messages/ko.json` - Korean (extend existing)

---

## 13. Static File Serving

### 13.1 FastAPI Static Mount

```python
# backend/app/main.py addition
from fastapi.staticfiles import StaticFiles

# Mount uploads directory for serving POD photos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

### 13.2 Directory Structure

```
backend/
├── uploads/
│   └── pod/
│       ├── LNX-2026-0001_1708512600_0.jpg
│       ├── LNX-2026-0001_1708512600_1.jpg
│       └── ...
```

---

## 14. Test Plan

### 14.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Manual API Test | POD endpoints | Swagger UI / curl |
| TypeScript Check | Frontend compilation | `npx tsc --noEmit` |
| Lint Check | Frontend code quality | `npx eslint .` |
| Manual UI Test | POD form on mobile | Chrome DevTools mobile mode |

### 14.2 Test Cases (Key)

- [x] Happy path: Upload POD with photos, signature, GPS, receiver name
- [x] Happy path: Retrieve POD by tracking number
- [x] Happy path: Admin verifies POD
- [x] Error: Upload POD for non-existent tracking number (404)
- [x] Error: Upload duplicate POD (409)
- [x] Error: Upload with file too large (400)
- [x] Error: Upload with too many photos > 5 (400)
- [x] Error: Verify POD that is already verified (409)
- [x] Error: Verify POD with invalid action (400)
- [x] Edge case: Legacy base64 photos returned correctly in GET
- [x] Edge case: GPS accuracy > 100m shows warning
- [x] Edge case: No photos uploaded (signature-only POD)
- [x] i18n: POD form renders correctly in Korean and English
- [x] Mobile: Signature pad works on touch devices
- [x] Mobile: Photo upload from camera works

---

## 15. Clean Architecture

### 15.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | API endpoints, request/response handling | `backend/app/api/endpoints/shipments.py` |
| **Presentation** | React components, pages | `frontend/app/components/`, `frontend/app/[locale]/` |
| **Application** | POD business logic, orchestration | `backend/app/services/pod_service.py` |
| **Domain** | Data models, schemas, enums | `backend/app/models.py`, `backend/app/schemas.py` |
| **Infrastructure** | File storage, database, oracle service | `backend/app/core/storage.py`, `backend/app/database.py` |
| **Infrastructure** | API client | `frontend/lib/api.ts` |

### 15.2 Dependency Rules

```
Endpoints (Presentation) → PODService (Application) → Models/Storage (Infrastructure)
                                                    → OracleService (Infrastructure)

React Components (Presentation) → api.ts (Infrastructure) → FastAPI (Backend)
```

### 15.3 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| ElectronicPOD.tsx | Presentation | `frontend/app/components/` |
| PODList.tsx | Presentation | `frontend/app/components/` |
| PODDetail.tsx | Presentation | `frontend/app/components/` |
| PODReceipt.tsx | Presentation | `frontend/app/components/` |
| pod dashboard page | Presentation | `frontend/app/[locale]/dashboard/pod/` |
| shipments.py endpoints | Presentation | `backend/app/api/endpoints/` |
| pod_service.py | Application | `backend/app/services/` |
| POD schemas | Domain | `backend/app/schemas.py` |
| Shipment model | Domain | `backend/app/models.py` |
| storage.py | Infrastructure | `backend/app/core/` |
| api.ts POD functions | Infrastructure | `frontend/lib/api.ts` |

---

## 16. Coding Convention Reference

### 16.1 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase: `ElectronicPOD`, `PODList`, `PODDetail` |
| Backend service | snake_case class: `PODService`, file: `pod_service.py` |
| API paths | kebab-style nouns: `/shipments/{tracking}/pod/verify` |
| Schema naming | PascalCase with suffix: `PODDetailResponse`, `PODVerifyRequest` |
| Enum values | lowercase: `submitted`, `verified`, `disputed` |
| File naming (photos) | `{tracking}_{timestamp}_{index}.{ext}` |
| i18n keys | dot-notation nested: `pod.submit`, `pod.errors.signatureRequired` |
| Env vars | UPPER_SNAKE: `POD_STORAGE_PATH`, `POD_MAX_PHOTOS` |

---

## 17. Implementation Guide

### 17.1 File Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py           # EXTEND: POD config vars
│   │   └── storage.py          # NEW: File storage abstraction
│   ├── services/
│   │   └── pod_service.py      # NEW: POD business logic
│   ├── api/endpoints/
│   │   └── shipments.py        # EXTEND: POD endpoints
│   ├── models.py               # EXTEND: POD fields
│   └── schemas.py              # EXTEND: POD schemas
├── uploads/
│   └── pod/                    # NEW: Photo storage directory

frontend/
├── app/
│   ├── components/
│   │   ├── ElectronicPOD.tsx   # REFACTOR: api.ts, compression, i18n
│   │   ├── PODList.tsx         # NEW: Admin POD list
│   │   ├── PODDetail.tsx       # NEW: Admin POD detail
│   │   └── PODReceipt.tsx      # NEW: Public POD receipt
│   └── [locale]/
│       ├── pod/[trackingId]/
│       │   └── page.tsx        # EXTEND: Improved POD page
│       └── dashboard/pod/
│           ├── page.tsx        # NEW: Admin POD dashboard
│           └── layout.tsx      # NEW: Layout for dashboard/pod
├── lib/
│   └── api.ts                  # EXTEND: POD API functions
└── messages/
    ├── en.json                 # EXTEND: POD i18n keys
    └── ko.json                 # EXTEND: POD i18n keys
```

### 17.2 Implementation Order

#### Phase 1: Backend Hardening
1. [x] Add POD fields to Shipment model (`models.py`)
2. [x] Add POD schemas (`schemas.py`)
3. [x] Add POD config vars (`core/config.py`)
4. [x] Create storage abstraction (`core/storage.py`)
5. [x] Create POD service (`services/pod_service.py`)
6. [x] Refactor `upload_pod` endpoint to use service + file storage
7. [x] Add `get_pod` endpoint
8. [x] Add `verify_pod` endpoint
9. [x] Add `list_pods` endpoint
10. [x] Add `pod_receipt` endpoint
11. [x] Mount static files for `/uploads/`

#### Phase 2: Frontend Refactor
12. [x] Add POD interfaces and API functions to `lib/api.ts`
13. [x] Add image compression utility to `ElectronicPOD.tsx`
14. [x] Refactor `ElectronicPOD.tsx` to use `lib/api.ts` (replace raw fetch)
15. [x] Add receiver name/contact fields
16. [x] Add geolocation accuracy indicator + retry + manual fallback
17. [x] Change max photos from 3 to 5
18. [x] Add i18n support (en.json, ko.json)

#### Phase 3: Admin Dashboard
19. [x] Create `PODList.tsx` component
20. [x] Create `PODDetail.tsx` component
21. [x] Create `/dashboard/pod/page.tsx` admin page
22. [x] Add verify/dispute actions in PODDetail

#### Phase 4: Polish
23. [x] Create `PODReceipt.tsx` (public read-only)
24. [x] Update Sidebar navigation (add POD link)
25. [x] TypeScript check (`npx tsc --noEmit`)
26. [x] ESLint check (`npx eslint .`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-21 | Initial draft | Development Team |
