# Smart Contract Escrow Design Document

> **Summary**: Technical design for on-chain USDC escrow using Solidity (EscrowFactory + ShipmentEscrow), wagmi/viem frontend hooks, and FastAPI backend event sync.
>
> **Project**: LogiNexus
> **Version**: 0.1.0
> **Author**: jaehong
> **Date**: 2026-02-15
> **Status**: Draft
> **Planning Doc**: [smart-contract-escrow.plan.md](../../01-plan/features/smart-contract-escrow.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A |
| Phase 2 | Coding Conventions | N/A |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | N/A |

---

## 1. Overview

### 1.1 Design Goals

1. Deploy a per-shipment escrow contract via factory pattern on Sepolia
2. Enable USDC fund/release/dispute/refund lifecycle entirely on-chain
3. Sync on-chain state to existing `PaymentEscrow` DB model in real-time
4. Provide type-safe frontend hooks generated from contract ABI
5. Maintain backward compatibility with existing shipment CRUD flow

### 1.2 Design Principles

- **Separation of Concerns**: Smart contracts handle fund custody; backend handles business logic; frontend handles UX
- **Minimal On-Chain State**: Store only what's needed for fund safety (addresses, amounts, status)
- **Fail-Safe Defaults**: Escrow funds are locked by default; explicit action required to release
- **Event-Driven Sync**: Backend reacts to on-chain events rather than polling contract state

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend       │     │   Backend        │     │   Blockchain     │
│   (Next.js)      │     │   (FastAPI)      │     │   (Sepolia)      │
│                  │     │                  │     │                  │
│  wagmi hooks ────┼──┐  │  escrow_sync.py  │     │  EscrowFactory   │
│  EscrowPanel     │  │  │  ┌──────────┐   │     │    │             │
│  FundEscrowModal │  │  │  │ Event    │◄──┼─────┤    ▼             │
│                  │  │  │  │ Listener │   │     │  ShipmentEscrow  │
│  api.ts ─────────┼──┼──┼──▶          │   │     │  (per shipment)  │
│                  │  │  │  └────┬─────┘   │     │                  │
└──────────────────┘  │  │       │         │     │  USDC (ERC-20)   │
                      │  │       ▼         │     └──────────────────┘
                      │  │  ┌──────────┐   │
                      │  │  │ Postgres │   │
                      │  │  │ payment_ │   │
                      │  │  │ escrows  │   │
                      │  │  └──────────┘   │
                      │  └──────────────────┘
                      │
                      └── Direct RPC calls (fund, release, dispute via wallet)
```

### 2.2 Data Flow

**Fund Escrow Flow:**
```
User clicks "Fund" → FundEscrowModal opens → approve USDC → deposit tx
  → on-chain Funded event → backend listener catches event
  → update PaymentEscrow row (status, tx_hash_deposit)
  → frontend polls /api/escrows/{id} → UI updates
```

**Release Flow:**
```
Shipment delivered → User/Admin clicks "Release" → release tx
  → on-chain Released event → backend updates PaymentEscrow
  → seller receives USDC → UI shows "Funds Released"
```

**Dispute Flow:**
```
Buyer clicks "Dispute" → dispute tx → on-chain Disputed event
  → backend updates PaymentEscrow → Admin reviews
  → Admin calls resolve(refund=true/false) → Released or Refunded
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| ShipmentEscrow.sol | OpenZeppelin (IERC20, ReentrancyGuard, Ownable) | Safe token handling, reentrancy protection |
| EscrowFactory.sol | ShipmentEscrow.sol | Create per-shipment escrow instances |
| frontend/lib/contracts/hooks.ts | wagmi, viem, contract ABI | Type-safe contract interactions |
| frontend/lib/contracts/addresses.ts | Deployment output | Deployed contract addresses per chain |
| backend/app/services/escrow_sync.py | web3.py or ethers equivalent | Listen to blockchain events |
| EscrowPanel.tsx | hooks.ts, api.ts | Display escrow status and actions |
| FundEscrowModal.tsx | hooks.ts, wagmi useAccount | USDC approve + deposit flow |

---

## 3. Data Model

### 3.1 Smart Contract State (On-Chain)

```solidity
// ShipmentEscrow.sol - per-shipment escrow instance
enum EscrowStatus { Created, Funded, Released, Disputed, Refunded }

struct EscrowState {
    address buyer;
    address seller;
    address usdcToken;
    uint256 amount;
    EscrowStatus status;
    uint256 createdAt;
    uint256 fundedAt;
    uint256 resolvedAt;
}
```

### 3.2 Updated Backend Model

Existing `PaymentEscrow` model with new fields:

```python
# backend/app/models.py - additions to PaymentEscrow
class PaymentEscrow(Base):
    __tablename__ = "payment_escrows"

    # Existing fields (unchanged)
    id = Column(UUID, primary_key=True, server_default=text("uuid_generate_v4()"))
    shipment_id = Column(UUID, ForeignKey("shipments.id", ondelete="CASCADE"))
    escrow_contract_address = Column(String)       # Now populated with real address
    buyer_wallet_address = Column(String, nullable=False)
    seller_wallet_address = Column(String, nullable=False)
    amount_usdc = Column(Numeric(20, 6), nullable=False)
    is_locked = Column(Boolean, default=True)
    tx_hash_deposit = Column(String)
    tx_hash_release = Column(String)
    updated_at = Column(DateTime(timezone=True))

    # New fields
    status = Column(String, default="CREATED")      # CREATED|FUNDED|RELEASED|DISPUTED|REFUNDED
    chain_id = Column(Integer, default=11155111)     # Sepolia chain ID
    tx_hash_dispute = Column(String)                 # Dispute transaction hash
    tx_hash_refund = Column(String)                  # Refund transaction hash
    funded_at = Column(DateTime(timezone=True))       # When funds were deposited
    resolved_at = Column(DateTime(timezone=True))     # When escrow was resolved
```

### 3.3 Frontend TypeScript Types

```typescript
// frontend/lib/contracts/types.ts
export enum EscrowStatus {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export interface EscrowResponse {
  id: string;
  shipment_id: string;
  escrow_contract_address: string;
  buyer_wallet_address: string;
  seller_wallet_address: string;
  amount_usdc: number;
  status: EscrowStatus;
  chain_id: number;
  tx_hash_deposit: string | null;
  tx_hash_release: string | null;
  tx_hash_dispute: string | null;
  funded_at: string | null;
  resolved_at: string | null;
}
```

### 3.4 Entity Relationships

```
[Tenant] 1 ──── N [Shipment] 1 ──── 1 [PaymentEscrow]
                                          │
                                          │ escrow_contract_address
                                          ▼
                                    [ShipmentEscrow] (on-chain)
                                          │
                                          │ IERC20
                                          ▼
                                    [USDC Token] (on-chain)
```

### 3.5 Database Migration

```sql
-- Add new columns to payment_escrows
ALTER TABLE payment_escrows
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'CREATED',
  ADD COLUMN IF NOT EXISTS chain_id INTEGER DEFAULT 11155111,
  ADD COLUMN IF NOT EXISTS tx_hash_dispute VARCHAR,
  ADD COLUMN IF NOT EXISTS tx_hash_refund VARCHAR,
  ADD COLUMN IF NOT EXISTS funded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
```

---

## 4. Smart Contract Specification

### 4.1 EscrowFactory.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ShipmentEscrow.sol";

contract EscrowFactory {
    event EscrowCreated(
        address indexed escrow,
        bytes32 indexed shipmentId,
        address buyer,
        address seller,
        uint256 amount
    );

    mapping(bytes32 => address) public escrows;  // shipmentId => escrow address

    function createEscrow(
        bytes32 shipmentId,
        address buyer,
        address seller,
        address usdcToken,
        uint256 amount
    ) external returns (address);

    function getEscrow(bytes32 shipmentId) external view returns (address);
}
```

### 4.2 ShipmentEscrow.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ShipmentEscrow is ReentrancyGuard {
    enum Status { Created, Funded, Released, Disputed, Refunded }

    address public immutable buyer;
    address public immutable seller;
    IERC20  public immutable usdcToken;
    uint256 public immutable amount;
    address public immutable factory;
    Status  public status;

    event Funded(address indexed buyer, uint256 amount);
    event Released(address indexed seller, uint256 amount);
    event Disputed(address indexed buyer);
    event Refunded(address indexed buyer, uint256 amount);

    modifier onlyBuyer();
    modifier onlyFactory();
    modifier inStatus(Status expected);

    // Buyer deposits USDC (must approve first)
    function fund() external onlyBuyer inStatus(Status.Created) nonReentrant;

    // Factory/admin releases funds to seller
    function release() external onlyFactory inStatus(Status.Funded) nonReentrant;

    // Buyer raises dispute
    function dispute() external onlyBuyer inStatus(Status.Funded) nonReentrant;

    // Factory/admin resolves dispute
    function resolve(bool refundBuyer) external onlyFactory inStatus(Status.Disputed) nonReentrant;
}
```

### 4.3 State Transition Diagram

```
  Created ──fund()──▶ Funded ──release()──▶ Released
                         │
                    dispute()
                         │
                         ▼
                     Disputed ──resolve(false)──▶ Released
                         │
                    resolve(true)
                         │
                         ▼
                      Refunded
```

---

## 5. API Specification

### 5.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/escrows/ | Create escrow record + deploy contract | None (MVP) |
| GET | /api/escrows/{escrow_id} | Get escrow details | None (MVP) |
| GET | /api/escrows/shipment/{shipment_id} | Get escrow by shipment | None (MVP) |
| POST | /api/escrows/{escrow_id}/sync | Force sync on-chain state | None (MVP) |

### 5.2 Detailed Specification

#### `POST /api/escrows/`

Creates a PaymentEscrow DB record and calls EscrowFactory.createEscrow() to deploy a new ShipmentEscrow contract.

**Request:**
```json
{
  "shipment_id": "uuid",
  "buyer_wallet_address": "0x...",
  "seller_wallet_address": "0x...",
  "amount_usdc": 5000.00
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "shipment_id": "uuid",
  "escrow_contract_address": "0x...",
  "buyer_wallet_address": "0x...",
  "seller_wallet_address": "0x...",
  "amount_usdc": 5000.00,
  "status": "CREATED",
  "chain_id": 11155111,
  "tx_hash_deposit": null,
  "funded_at": null
}
```

**Error Responses:**
- `400`: Invalid wallet address or amount
- `404`: Shipment not found
- `409`: Escrow already exists for this shipment

#### `GET /api/escrows/shipment/{shipment_id}`

**Response (200):**
```json
{
  "id": "uuid",
  "shipment_id": "uuid",
  "escrow_contract_address": "0x1234...",
  "status": "FUNDED",
  "amount_usdc": 5000.00,
  "tx_hash_deposit": "0xabc...",
  "funded_at": "2026-02-15T10:30:00Z"
}
```

### 5.3 Pydantic Schemas

```python
# backend/app/schemas.py - new escrow schemas

class EscrowCreate(BaseModel):
    shipment_id: UUID
    buyer_wallet_address: str
    seller_wallet_address: str
    amount_usdc: float

class EscrowResponse(BaseModel):
    id: UUID
    shipment_id: UUID
    escrow_contract_address: str | None
    buyer_wallet_address: str
    seller_wallet_address: str
    amount_usdc: float
    status: str
    chain_id: int
    tx_hash_deposit: str | None
    tx_hash_release: str | None
    tx_hash_dispute: str | None
    funded_at: datetime | None
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
```

---

## 6. UI/UX Design

### 6.1 EscrowPanel Component (embedded in ShipmentCard)

```
┌──────────────────────────────────────────────┐
│  Smart Contract Escrow                       │
│  ┌────────────────────────────────────────┐  │
│  │ Status: [FUNDED]     Amount: 5,000 USDC│  │
│  │ Buyer:  0x1234...5678                  │  │
│  │ Seller: 0x9abc...def0                  │  │
│  │ Contract: 0xfeed...cafe  [View ↗]      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──────────────┐  ┌───────────────────┐     │
│  │ Release Funds│  │ Dispute           │     │
│  └──────────────┘  └───────────────────┘     │
│                                              │
│  Deposit tx: 0xabc...def [View ↗]            │
└──────────────────────────────────────────────┘
```

### 6.2 FundEscrowModal

```
┌──────────────────────────────────────────────┐
│  Fund Escrow                           [X]   │
│  ────────────────────────────────────────── │
│                                              │
│  Shipment: SH-2026-001                       │
│  Amount:   5,000 USDC                        │
│  To:       0xfeed...cafe (escrow contract)   │
│                                              │
│  Step 1: Approve USDC spending               │
│  [Approve USDC]  ✅ Approved                 │
│                                              │
│  Step 2: Deposit into escrow                 │
│  [Deposit USDC]  🔄 Confirming...            │
│                                              │
│  ────────────────────────────────────────── │
│  Connected: 0x1234...5678 (Sepolia)          │
└──────────────────────────────────────────────┘
```

### 6.3 User Flows

**Fund Flow:**
```
Dashboard → Click shipment → ShipmentCard shows "Fund Escrow" button
  → FundEscrowModal opens → Step 1: Approve USDC → Step 2: Deposit
  → Modal shows "Funded!" → Close → EscrowPanel updates to "FUNDED"
```

**Release Flow:**
```
Dashboard → Shipment marked Delivered → EscrowPanel shows "Release Funds"
  → Click Release → Wallet popup → Confirm tx → "RELEASED" status
```

### 6.4 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| EscrowPanel | `frontend/app/components/EscrowPanel.tsx` | Display escrow status, action buttons, tx links |
| FundEscrowModal | `frontend/app/components/FundEscrowModal.tsx` | 2-step approve+deposit flow with wallet interaction |
| EscrowStatusBadge | `frontend/app/components/EscrowStatusBadge.tsx` | Colored badge for escrow status |

---

## 7. Frontend Contract Integration

### 7.1 wagmi Hooks

```typescript
// frontend/lib/contracts/hooks.ts
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { escrowFactoryAbi, shipmentEscrowAbi } from './abi'
import { ADDRESSES } from './addresses'

// Read escrow address from factory
export function useEscrowAddress(shipmentId: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.escrowFactory,
    abi: escrowFactoryAbi,
    functionName: 'getEscrow',
    args: [shipmentId],
  })
}

// Read escrow status
export function useEscrowStatus(escrowAddress: `0x${string}`) {
  return useReadContract({
    address: escrowAddress,
    abi: shipmentEscrowAbi,
    functionName: 'status',
  })
}

// Approve USDC spending
export function useApproveUsdc() {
  return useWriteContract()  // caller passes USDC.approve(escrowAddress, amount)
}

// Fund escrow
export function useFundEscrow() {
  return useWriteContract()  // caller passes escrow.fund()
}

// Release funds (admin/factory)
export function useReleaseEscrow() {
  return useWriteContract()  // caller passes escrow.release()
}

// Dispute (buyer)
export function useDisputeEscrow() {
  return useWriteContract()  // caller passes escrow.dispute()
}
```

### 7.2 Contract Addresses Config

```typescript
// frontend/lib/contracts/addresses.ts
export const ADDRESSES = {
  escrowFactory: process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS as `0x${string}`,
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
} as const

export const CHAIN_CONFIG = {
  blockExplorer: 'https://sepolia.etherscan.io',
  chainId: 11155111,
} as const
```

---

## 8. Backend Event Sync

### 8.1 Event Listener Service

```python
# backend/app/services/escrow_sync.py
"""
Polls blockchain for escrow events and updates PaymentEscrow DB records.
Runs as a background task (asyncio) or separate process.
"""

EVENTS_TO_TRACK = [
    "Funded(address indexed buyer, uint256 amount)",
    "Released(address indexed seller, uint256 amount)",
    "Disputed(address indexed buyer)",
    "Refunded(address indexed buyer, uint256 amount)",
]

class EscrowEventSync:
    def __init__(self, rpc_url: str, factory_address: str, db_session_factory):
        ...

    async def sync_events(self, from_block: int, to_block: int):
        """Fetch events from chain and update DB records."""
        ...

    async def handle_funded(self, event):
        """Update PaymentEscrow: status=FUNDED, tx_hash_deposit, funded_at"""
        ...

    async def handle_released(self, event):
        """Update PaymentEscrow: status=RELEASED, is_locked=False, tx_hash_release"""
        ...

    async def handle_disputed(self, event):
        """Update PaymentEscrow: status=DISPUTED, tx_hash_dispute"""
        ...

    async def handle_refunded(self, event):
        """Update PaymentEscrow: status=REFUNDED, is_locked=False, tx_hash_refund"""
        ...

    async def run_polling_loop(self, interval_seconds: int = 15):
        """Poll every N seconds for new events."""
        ...
```

### 8.2 Integration with FastAPI

```python
# In backend/app/main.py - add background task on startup
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start event sync in background
    sync_task = asyncio.create_task(escrow_sync.run_polling_loop())
    yield
    sync_task.cancel()

app = FastAPI(title="LogiNexus API", lifespan=lifespan)
```

---

## 9. Error Handling

### 9.1 Smart Contract Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `InsufficientAllowance` | USDC not approved | Show "Approve USDC first" in FundEscrowModal |
| `InsufficientBalance` | Buyer lacks USDC | Show balance and amount mismatch |
| `InvalidStatus` | Wrong escrow state for action | Disable button, show current status |
| `OnlyBuyer` | Non-buyer tries to fund/dispute | Hide action buttons for non-buyer |
| `OnlyFactory` | Non-factory tries to release | Backend-only release via factory |
| Tx reverted (generic) | Various on-chain failures | Show "Transaction failed" with retry option |

### 9.2 Frontend Error Handling

```typescript
// Pattern for all contract write operations
const { writeContract, error, isPending } = useWriteContract()
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

// Display states:
// isPending → "Confirm in wallet..."
// isConfirming → "Waiting for confirmation..."
// isSuccess → "Transaction confirmed!"
// error → parse error message and display user-friendly version
```

### 9.3 Backend Error Handling

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid wallet address | Malformed 0x address | Validate with regex |
| 404 | Shipment not found | Invalid shipment_id | Return 404 |
| 409 | Escrow exists | Duplicate creation | Return existing escrow |
| 502 | Chain unavailable | RPC connection failure | Retry with backoff |

---

## 10. Security Considerations

- [x] ReentrancyGuard on all fund-moving functions (OpenZeppelin)
- [ ] Slither static analysis with 0 high/critical findings
- [ ] Access control: only buyer can fund/dispute, only factory can release/resolve
- [ ] USDC amount validation (> 0, matches expected)
- [ ] Frontend wallet address validation before sending tx
- [ ] Backend validates on-chain state matches DB state during sync
- [ ] No private keys stored in frontend or backend (wallet signs directly)
- [ ] Block explorer links use verified contract addresses only

---

## 11. Test Plan

### 11.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Smart Contract Unit | All state transitions, access control | Hardhat + chai |
| Smart Contract Integration | Factory + Escrow + mock USDC | Hardhat fork |
| Backend Unit | Escrow CRUD, schema validation | pytest |
| Backend Integration | Event sync with mock events | pytest + mocked RPC |
| Frontend Unit | Hook behavior, component rendering | Vitest + React Testing Library |
| E2E | Full fund-release cycle on Sepolia | Manual + Playwright (future) |

### 11.2 Smart Contract Test Cases

- [ ] Happy: Create escrow via factory → fund → release → seller receives USDC
- [ ] Happy: Create → fund → dispute → resolve(refund=true) → buyer receives USDC
- [ ] Happy: Create → fund → dispute → resolve(refund=false) → seller receives USDC
- [ ] Error: Non-buyer attempts fund() → revert
- [ ] Error: Fund without USDC approval → revert
- [ ] Error: Release when not funded → revert
- [ ] Error: Double-fund → revert
- [ ] Error: Dispute when already released → revert
- [ ] Edge: Fund with exact USDC balance (0 remaining after)
- [ ] Edge: Create escrow for same shipmentId twice → revert

### 11.3 Frontend Test Cases

- [ ] EscrowPanel renders correct status badge for each EscrowStatus
- [ ] FundEscrowModal shows 2-step flow (approve then deposit)
- [ ] Action buttons disabled when wallet not connected
- [ ] Block explorer links generate correct URLs
- [ ] Error messages shown on tx failure

---

## 12. Clean Architecture

### 12.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | UI components, modals, badges | `frontend/app/components/Escrow*.tsx` |
| **Application** | Contract interaction hooks, API calls | `frontend/lib/contracts/hooks.ts`, `frontend/lib/api.ts` |
| **Domain** | Types, enums, interfaces | `frontend/lib/contracts/types.ts` |
| **Infrastructure** | ABI files, addresses config, wagmi config | `frontend/lib/contracts/abi/`, `frontend/lib/contracts/addresses.ts` |

### 12.2 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| EscrowPanel | Presentation | `frontend/app/components/EscrowPanel.tsx` |
| FundEscrowModal | Presentation | `frontend/app/components/FundEscrowModal.tsx` |
| EscrowStatusBadge | Presentation | `frontend/app/components/EscrowStatusBadge.tsx` |
| useEscrowAddress, useFundEscrow, etc. | Application | `frontend/lib/contracts/hooks.ts` |
| EscrowStatus enum, EscrowResponse | Domain | `frontend/lib/contracts/types.ts` |
| ABI JSON files | Infrastructure | `frontend/lib/contracts/abi/` |
| Contract addresses | Infrastructure | `frontend/lib/contracts/addresses.ts` |
| Escrow API endpoints | Backend API | `backend/app/api/endpoints/escrows.py` |
| Escrow schemas | Backend Domain | `backend/app/schemas.py` |
| Event sync service | Backend Service | `backend/app/services/escrow_sync.py` |

---

## 13. Coding Convention Reference

### 13.1 Solidity Conventions

| Target | Rule | Example |
|--------|------|---------|
| Contracts | PascalCase | `ShipmentEscrow`, `EscrowFactory` |
| Functions | camelCase | `createEscrow()`, `fund()` |
| Events | PascalCase | `Funded`, `Released` |
| Constants | UPPER_SNAKE_CASE | `MAX_DISPUTE_WINDOW` |
| State vars | camelCase | `escrowStatus`, `buyerAddress` |
| Modifiers | camelCase | `onlyBuyer`, `inStatus` |

### 13.2 Frontend Conventions (existing patterns)

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase (`EscrowPanel.tsx`) |
| File organization | Flat in `app/components/`, hooks in `lib/contracts/` |
| State management | React Query for server state, wagmi hooks for chain state |
| Error handling | wagmi error objects + user-friendly messages |

### 13.3 Backend Conventions (existing patterns)

| Item | Convention Applied |
|------|-------------------|
| Endpoint files | snake_case (`escrows.py`) |
| Schema naming | PascalCase (`EscrowCreate`, `EscrowResponse`) |
| Model fields | snake_case (`tx_hash_deposit`) |
| Service files | snake_case (`escrow_sync.py`) |

---

## 14. Implementation Order

1. [ ] **Smart contracts** - ShipmentEscrow.sol + EscrowFactory.sol + tests
2. [ ] **Contract deployment** - Hardhat deploy script for Sepolia + save ABI/addresses
3. [ ] **Backend model update** - Add new columns to PaymentEscrow, migration
4. [ ] **Backend API** - `/api/escrows/` endpoints + Pydantic schemas
5. [ ] **Backend event sync** - `escrow_sync.py` polling service
6. [ ] **Frontend types + hooks** - `types.ts`, `abi/`, `addresses.ts`, `hooks.ts`
7. [ ] **Frontend components** - EscrowPanel, FundEscrowModal, EscrowStatusBadge
8. [ ] **Integration** - Wire EscrowPanel into ShipmentCard, FundEscrowModal into dashboard
9. [ ] **Testing** - Contract tests, backend tests, frontend component tests
10. [ ] **Security audit** - Slither analysis, manual review

---

## 15. New Dependencies

### Smart Contracts (new `contracts/package.json`)
- `hardhat` - Development framework
- `@openzeppelin/contracts` ^5.0 - Audited contract libraries
- `@nomicfoundation/hardhat-toolbox` - Testing + deployment tools

### Backend (add to `requirements.txt`)
- `web3` ^7.0 - Ethereum interaction library for event listening

### Frontend (already installed)
- `wagmi` ^3.4.3 - Already present
- `viem` ^2.45.3 - Already present

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-15 | Initial draft | jaehong |
