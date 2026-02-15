# Smart Contract Escrow Planning Document

> **Summary**: Implement on-chain USDC payment escrow for logistics shipments using Solidity smart contracts and wagmi/viem frontend integration.
>
> **Project**: LogiNexus
> **Version**: 0.1.0
> **Author**: jaehong
> **Date**: 2026-02-15
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Replace the current DB-only PaymentEscrow model with actual on-chain smart contract escrow. Buyers lock USDC into an escrow contract when a shipment is created; funds are released to the seller upon confirmed delivery, or refunded/disputed if issues arise.

### 1.2 Background

The current `PaymentEscrow` model in `backend/app/models.py` tracks escrow state (PENDING, FUNDED, RELEASED, DISPUTED, REFUNDED) and wallet addresses, but has no actual blockchain integration. The frontend already has wagmi v3 + viem configured with Ethereum mainnet/sepolia support and wallet connection via the injected connector. This feature bridges the gap between the existing DB model and real on-chain escrow logic.

### 1.3 Related Documents

- Existing model: `backend/app/models.py` (PaymentEscrow class)
- Wagmi config: `frontend/lib/wagmi.ts`
- Wallet UI: `frontend/app/components/Header.tsx` (connect/disconnect)
- Shipment card: `frontend/app/components/ShipmentCard.tsx` (shows blockchain_status)

---

## 2. Scope

### 2.1 In Scope

- [ ] Solidity escrow smart contract (ERC-20 USDC compatible)
- [ ] Contract deployment scripts (Hardhat/Foundry) for Sepolia testnet
- [ ] Frontend contract interaction via wagmi/viem (fund, release, dispute, refund)
- [ ] Backend sync: update PaymentEscrow DB record when on-chain events occur
- [ ] Escrow status UI in ShipmentCard and ShipmentDetailModal
- [ ] Event listening for escrow state transitions

### 2.2 Out of Scope

- Mainnet deployment (testnet only for this phase)
- Multi-token support (USDC only)
- Arbitration/dispute resolution DAO
- Gas fee optimization / meta-transactions
- Cross-chain escrow

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Deploy EscrowFactory contract that creates per-shipment escrow instances | High | Pending |
| FR-02 | Buyer can fund escrow with USDC (approve + deposit) | High | Pending |
| FR-03 | Seller receives USDC when shipment is marked delivered and escrow is released | High | Pending |
| FR-04 | Buyer can initiate dispute within escrow window | Medium | Pending |
| FR-05 | Admin/arbitrator can resolve disputes (release or refund) | Medium | Pending |
| FR-06 | Backend listens to contract events and syncs PaymentEscrow DB state | High | Pending |
| FR-07 | Frontend shows real-time escrow status with tx links to block explorer | High | Pending |
| FR-08 | Escrow creation linked to shipment creation flow | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | Smart contract passes Slither/Aderyn static analysis with 0 high/critical | Automated scan |
| Security | Reentrancy protection on all fund-moving functions | Manual audit + tests |
| Performance | Contract interactions complete within 2 block confirmations | On-chain monitoring |
| Reliability | Backend event sync catches up within 30s of on-chain event | Log monitoring |
| UX | Loading states shown during tx confirmation (pending/confirmed) | Manual QA |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Smart contract deployed to Sepolia with verified source
- [ ] Full fund-release cycle works E2E (create shipment -> fund -> deliver -> release)
- [ ] Dispute-refund cycle works E2E
- [ ] Backend PaymentEscrow records match on-chain state
- [ ] Frontend displays live escrow status with explorer links
- [ ] Contract tests cover all state transitions

### 4.2 Quality Criteria

- [ ] 100% smart contract test coverage (all state transitions)
- [ ] Zero high/critical findings from static analysis
- [ ] TypeScript types generated from contract ABI
- [ ] Build succeeds with no new lint errors

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Smart contract vulnerability (reentrancy, access control) | High | Medium | Use OpenZeppelin libraries, static analysis, thorough testing |
| USDC approval UX confusion (2-step approve+deposit) | Medium | High | Clear UI guidance, combine into single flow with permit2 if possible |
| Event sync failures (missed blockchain events) | High | Medium | Implement retry logic, periodic reconciliation job |
| Gas costs on Ethereum mainnet | Medium | High | Start on Sepolia; consider L2 (Base, Arbitrum) for production |
| Wallet connection issues across browsers | Medium | Medium | wagmi handles this; test with MetaMask, Coinbase Wallet |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend, SaaS MVPs | X |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Smart Contract Framework | Hardhat / Foundry | Hardhat | Wider ecosystem, better wagmi integration, TypeChain types |
| Contract Pattern | Monolithic / Factory | Factory (EscrowFactory) | Each shipment gets isolated escrow, cleaner state |
| USDC Integration | Direct transfer / Permit2 | Direct (approve+deposit) | Simpler initial implementation, Permit2 as future enhancement |
| Event Sync | Polling / WebSocket / Webhook | Polling with ethers.js provider | Simpler for MVP, upgrade to WebSocket later |
| ABI Type Generation | TypeChain / wagmi CLI | wagmi CLI (wagmi generate) | Native wagmi integration, type-safe hooks |
| Network | Mainnet / Sepolia / L2 | Sepolia (testnet) | Safe for development, free test USDC available |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

New Files/Folders:
┌─────────────────────────────────────────────────────┐
│ contracts/                                           │
│   ├── src/EscrowFactory.sol                         │
│   ├── src/ShipmentEscrow.sol                        │
│   ├── test/ShipmentEscrow.t.sol                     │
│   ├── script/Deploy.s.sol                           │
│   └── hardhat.config.ts                             │
├─────────────────────────────────────────────────────┤
│ frontend/                                            │
│   ├── lib/contracts/                                 │
│   │   ├── abi/                (generated ABIs)      │
│   │   ├── addresses.ts       (deployed addresses)   │
│   │   └── hooks.ts           (useEscrow, useFund)   │
│   ├── app/components/                                │
│   │   ├── EscrowPanel.tsx    (escrow status + actions)│
│   │   └── FundEscrowModal.tsx (approve + deposit UI) │
├─────────────────────────────────────────────────────┤
│ backend/                                             │
│   ├── app/services/          (new)                   │
│   │   └── escrow_sync.py     (event listener/sync)  │
│   ├── app/api/endpoints/                             │
│   │   └── escrows.py         (escrow API endpoints)  │
└─────────────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists (Phase 2 output)
- [ ] `CONVENTIONS.md` exists at project root
- [x] ESLint configuration (`frontend/eslint.config.mjs`)
- [ ] Prettier configuration
- [x] TypeScript configuration (`frontend/tsconfig.json`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | snake_case (Python), camelCase (TS) | Solidity: mixedCase functions, PascalCase contracts | High |
| **Folder structure** | exists | Add `contracts/` and `frontend/lib/contracts/` | High |
| **Import order** | missing | Solidity: OpenZeppelin first, then local | Medium |
| **Environment variables** | exists | Add contract addresses, RPC URLs | High |
| **Error handling** | basic | Define revert message patterns for contracts | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_API_URL` | API endpoint | Client | Exists |
| `DATABASE_URL` | DB connection | Server | Exists |
| `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS` | Deployed factory contract | Client | X |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC token address (Sepolia) | Client | X |
| `NEXT_PUBLIC_CHAIN_ID` | Target chain ID | Client | X |
| `DEPLOYER_PRIVATE_KEY` | Contract deployment key | CI/Deploy only | X |
| `SEPOLIA_RPC_URL` | Sepolia JSON-RPC endpoint | Server + Deploy | X |

---

## 8. Next Steps

1. [ ] Write design document (`smart-contract-escrow.design.md`)
2. [ ] Team review and approval of this plan
3. [ ] Set up Hardhat project in `contracts/`
4. [ ] Start implementation with smart contract development

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-15 | Initial draft | jaehong |
