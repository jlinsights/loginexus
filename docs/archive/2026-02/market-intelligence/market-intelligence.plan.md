# Market Intelligence Planning Document

> **Summary**: 물류 시장 데이터(운임 지수, 항로별 운임, AI 인사이트)를 실시간으로 수집/분석/표시하는 Market Intelligence 시스템 구축
>
> **Project**: LogiNexus
> **Version**: 0.1
> **Author**: Jaehong
> **Date**: 2026-02-22
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 MarketIntelligence 컴포넌트는 하드코딩된 지수 데이터(SCFI, FBX, KCCI, WCI)만 표시하며, QuickQuoteWidget은 Rate Explorer로 라우팅만 수행한다. 실시간 시장 데이터를 백엔드에서 수집/캐싱하고, 프론트엔드에서 인터랙티브하게 분석할 수 있는 Market Intelligence 시스템을 구축한다.

### 1.2 Background

- **현재 상태**: `MarketIntelligence.tsx`에 정적 데이터 4개 지수, AI Insight 하드코딩
- **RateSubscription 모델**: 기본 CRUD만 구현 (`rates.py`), 실제 운임 데이터 소스 미연결
- **Rate Explorer**: 페이지 존재하나 조회 결과 없음 (빈 UI)
- **비즈니스 니즈**: 물류 의사결정자에게 시장 동향, 운임 추세, 최적 선적 시기 등의 데이터 기반 인사이트 제공

### 1.3 Related Documents

- Architecture Design: `docs/archive/2026-02/architecture-design/`
- Analytics Reporting: `docs/archive/2026-02/analytics-reporting/`

---

## 2. Scope

### 2.1 In Scope

- [ ] **Backend**: Market Data API 엔드포인트 (지수 조회, 항로별 운임, 트렌드)
- [ ] **Backend**: 시장 데이터 모델 (FreightIndex, RouteRate, MarketAlert)
- [ ] **Backend**: 데이터 시드/모의 생성 (Demo 모드)
- [ ] **Frontend**: MarketIntelligence 컴포넌트를 API 연동으로 전환
- [ ] **Frontend**: Rate Explorer 페이지 완성 (검색/필터/차트)
- [ ] **Frontend**: 운임 알림 구독 UI (RateSubscription 활용)
- [ ] **Frontend**: Market Dashboard 전용 페이지 (`/tools/market`)
- [ ] **i18n**: 한국어/영어 번역 키 추가

### 2.2 Out of Scope

- 실제 외부 API 연동 (Freightos, Xeneta 등) — Phase 2에서 진행
- AI 기반 운임 예측 모델 학습 — 별도 feature로 분리
- 실시간 WebSocket 스트리밍 — 현재는 polling 방식으로 충분
- 유료 플랜 전용 기능 분리 — 현재 모든 tenant에 동일 제공

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 글로벌 운임 지수 (SCFI, FBX, KCCI, WCI) 일별 데이터 조회 API | High | Pending |
| FR-02 | 항로별 운임 조회 (출발지-도착지, 운송모드, 컨테이너 타입) | High | Pending |
| FR-03 | 운임 트렌드 차트 (7/30/90일) 데이터 제공 | High | Pending |
| FR-04 | 운임 알림 구독 (목표 가격 설정 시 알림) | Medium | Pending |
| FR-05 | MarketIntelligence 위젯 API 실시간 연동 | High | Pending |
| FR-06 | Rate Explorer 검색 결과 표시 및 비교 | High | Pending |
| FR-07 | Market Dashboard 전용 페이지 (차트 + 테이블 + 필터) | Medium | Pending |
| FR-08 | AI Trade Insight 동적 생성 (내부 데이터 기반) | Low | Pending |
| FR-09 | Demo 모드 시드 데이터 (6개월 히스토리) | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Market API 응답 < 300ms | FastAPI 로그 + 프론트엔드 타이밍 |
| Performance | 차트 렌더링 < 500ms (1000 데이터포인트) | Lighthouse / 브라우저 DevTools |
| Caching | 지수 데이터 5분 TTL 캐시 | 백엔드 인메모리 캐시 확인 |
| Security | Tenant 격리 (운임 구독 데이터) | API 테스트로 교차 접근 불가 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 FR 구현 완료 (FR-01 ~ FR-09)
- [ ] Backend API 엔드포인트 Swagger 문서화
- [ ] MarketIntelligence 컴포넌트가 실제 API 데이터 표시
- [ ] Rate Explorer에서 항로별 운임 검색/비교 가능
- [ ] i18n 한국어/영어 번역 완료
- [ ] 빌드 성공 (`npm run build` + TypeScript 오류 없음)

### 4.2 Quality Criteria

- [ ] TypeScript 타입 안전성 (strict mode)
- [ ] Zero lint errors (ESLint)
- [ ] 빌드 성공 (프론트엔드 + 백엔드)
- [ ] 반응형 UI (모바일/태블릿/데스크톱)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 외부 운임 API 비용이 높아 연동 지연 | Medium | High | Demo 모드 시드 데이터로 우선 구현, Phase 2에서 API 연동 |
| 차트 라이브러리 번들 크기 증가 | Low | Medium | Recharts 이미 설치됨 (기존 analytics에서 사용), 추가 의존성 불필요 |
| 대량 히스토리 데이터 쿼리 성능 저하 | Medium | Medium | 일별 집계 테이블 + 인덱스 최적화, 페이지네이션 적용 |
| 기존 RateSubscription 모델과 새 모델 충돌 | Low | Low | 기존 모델 확장 (컬럼 추가), 호환성 유지 |

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
| Framework | Next.js / React | Next.js 14 (기존) | 프로젝트 통일 |
| State Management | Context / Redux / TanStack Query | TanStack Query (기존) | 서버 상태 중심, 기존 패턴 유지 |
| API Client | fetch / axios / react-query | Axios + TanStack Query (기존) | lib/api.ts 패턴 유지 |
| Chart Library | Recharts / Chart.js / D3 | Recharts (기존) | 이미 analytics에서 사용 중 |
| Backend Cache | Redis / In-memory | In-memory (dict + TTL) | PostgreSQL 단독 환경, Redis 미설치 |
| Data Seed | Faker / Manual / Script | seed_market_data.py | seed_db.py 패턴 따름 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Backend 추가 구조:
backend/app/
├── models.py              # + FreightIndex, RouteRate, MarketAlert
├── schemas.py             # + Market 관련 Pydantic 스키마
├── crud/
│   └── market.py          # Market 데이터 CRUD + 집계 쿼리
├── api/endpoints/
│   └── market.py          # /api/market/* 엔드포인트
└── seed_market_data.py    # 시장 데이터 시드 스크립트

Frontend 추가 구조:
frontend/
├── app/[locale]/tools/
│   ├── market/page.tsx           # Market Dashboard
│   └── rate-explorer/page.tsx    # 기존 페이지 완성
├── app/components/
│   ├── MarketIntelligence.tsx    # 리팩토링 (API 연동)
│   ├── RateChart.tsx             # 운임 차트 컴포넌트
│   ├── RateTable.tsx             # 운임 테이블 컴포넌트
│   └── RateAlertForm.tsx         # 알림 구독 폼
└── lib/
    └── api.ts                    # + Market API 함수 추가
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists
- [ ] `CONVENTIONS.md` exists at project root
- [x] ESLint configuration (`eslint-config-next`)
- [ ] Prettier configuration
- [x] TypeScript configuration (`tsconfig.json`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | exists (camelCase TS, snake_case Python) | Market 도메인 네이밍 통일 | High |
| **Folder structure** | exists (app/components/, api/endpoints/) | 기존 패턴 따름 | High |
| **Import order** | exists (next → react → lib → components) | 변경 없음 | Low |
| **Environment variables** | exists (NEXT_PUBLIC_API_URL, DATABASE_URL) | 추가 불필요 | Low |
| **Error handling** | exists (HTTPException 패턴) | Market API에도 동일 적용 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_API_URL` | API endpoint | Client | (기존) |
| `DATABASE_URL` | DB connection | Server | (기존) |

추가 환경 변수 불필요 — Demo 모드 시드 데이터 사용.

---

## 8. Data Models (Preview)

### 8.1 FreightIndex (새 모델)

```python
class FreightIndex(Base):
    __tablename__ = "freight_indices"
    id          = Column(UUID, primary_key=True)
    index_code  = Column(String)       # SCFI, FBX, KCCI, WCI
    index_name  = Column(String)       # Full name
    value       = Column(Numeric(12,2))
    change_pct  = Column(Numeric(6,2)) # Daily change %
    recorded_at = Column(Date)         # 기록 날짜
    created_at  = Column(DateTime)
```

### 8.2 RouteRate (새 모델)

```python
class RouteRate(Base):
    __tablename__ = "route_rates"
    id              = Column(UUID, primary_key=True)
    origin          = Column(String)          # Port code (KRPUS, CNSHA, ...)
    destination     = Column(String)
    transport_mode  = Column(String)          # SEA, AIR, RAIL, TRUCK
    container_type  = Column(String)          # 20GP, 40GP, 40HC
    rate_usd        = Column(Numeric(10,2))
    currency        = Column(String, default="USD")
    valid_from      = Column(Date)
    valid_to        = Column(Date)
    carrier         = Column(String, nullable=True)
    created_at      = Column(DateTime)
```

### 8.3 MarketAlert (기존 RateSubscription 확장)

기존 `RateSubscription` 모델에 추가 컬럼:
- `last_alerted_at` (DateTime) — 마지막 알림 발송 시점
- `current_rate` (Numeric) — 현재 조회된 운임

---

## 9. API Endpoints (Preview)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/market/indices` | 글로벌 운임 지수 목록 (최신) |
| GET | `/api/market/indices/{code}/history` | 특정 지수 히스토리 (기간 필터) |
| GET | `/api/market/rates` | 항로별 운임 검색 (origin, dest, mode, container) |
| GET | `/api/market/rates/compare` | 운임 비교 (복수 항로) |
| GET | `/api/market/trends` | 운임 트렌드 (7/30/90일) |
| GET | `/api/market/insight` | AI Trade Insight (내부 데이터 기반) |

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`market-intelligence.design.md`)
2. [ ] 데이터 모델 확정 및 마이그레이션
3. [ ] Backend API 구현
4. [ ] Frontend 컴포넌트 리팩토링 및 신규 페이지

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-22 | Initial draft | Jaehong |
