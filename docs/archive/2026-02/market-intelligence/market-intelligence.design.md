# Market Intelligence Design Document

> **Summary**: 물류 시장 데이터(운임 지수, 항로별 운임, AI 인사이트)를 실시간으로 수집/분석/표시하는 Market Intelligence 시스템의 상세 설계
>
> **Project**: LogiNexus
> **Version**: 0.1
> **Author**: Jaehong
> **Date**: 2026-02-22
> **Status**: Draft
> **Planning Doc**: [market-intelligence.plan.md](../../01-plan/features/market-intelligence.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Backend Market Data API를 기존 FastAPI 패턴(analytics.py)과 동일하게 구현
- MarketIntelligence 컴포넌트를 하드코딩에서 API 연동으로 전환
- Rate Explorer 페이지를 시뮬레이션에서 실제 DB 데이터 기반으로 완성
- Market Dashboard 전용 페이지 신규 구축 (차트 + 테이블 + 필터)
- 6개월 히스토리 시드 데이터로 Demo 모드 즉시 동작

### 1.2 Design Principles

- **기존 패턴 준수**: analytics.py, rates.py의 라우터/CRUD/스키마 패턴 재사용
- **확장 가능성**: 외부 API 연동(Phase 2) 시 CRUD 레이어만 교체하면 되는 구조
- **Tenant 격리**: 운임 구독(RateSubscription)은 tenant_id로 격리, 지수/운임 데이터는 공용
- **프론트엔드 일관성**: TanStack Query + Axios 패턴, Recharts, Tailwind CSS

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ MarketIntelligence│  │  RateExplorer    │  │ MarketDashboard│ │
│  │  (Landing Widget) │  │  (Search Page)   │  │ (Full Page)    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                      │                     │         │
│  ┌────────▼──────────────────────▼─────────────────────▼───────┐ │
│  │                    lib/api.ts (Market API Functions)          │ │
│  └──────────────────────────────┬───────────────────────────────┘ │
└─────────────────────────────────┼────────────────────────────────┘
                                  │ HTTP (Axios)
┌─────────────────────────────────▼────────────────────────────────┐
│                         Backend (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              api/endpoints/market.py (Router)                 │ │
│  │  GET /indices  |  GET /indices/{code}/history                 │ │
│  │  GET /rates    |  GET /rates/compare                          │ │
│  │  GET /trends   |  GET /insight                                │ │
│  └────────────────────────────┬─────────────────────────────────┘ │
│  ┌────────────────────────────▼─────────────────────────────────┐ │
│  │              crud/market.py (Business Logic)                  │ │
│  └────────────────────────────┬─────────────────────────────────┘ │
│  ┌────────────────────────────▼─────────────────────────────────┐ │
│  │              models.py (FreightIndex, RouteRate)               │ │
│  └────────────────────────────┬─────────────────────────────────┘ │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   PostgreSQL Database   │
                    │  freight_indices       │
                    │  route_rates           │
                    │  rate_subscriptions    │
                    └───────────────────────┘
```

### 2.2 Data Flow

```
[시드 스크립트] → freight_indices / route_rates 테이블에 6개월 데이터 삽입
                          ↓
[Frontend 요청] → api.ts → /api/v1/market/* → market.py (router)
                          ↓
                  crud/market.py → SQLAlchemy 쿼리 → PostgreSQL
                          ↓
                  Pydantic 응답 스키마 → JSON → Frontend
                          ↓
                  TanStack Query 캐시 → React 컴포넌트 렌더링
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `market.py` (router) | `crud/market.py`, `schemas.py` | HTTP 엔드포인트 |
| `crud/market.py` | `models.py`, `database.py` | DB 쿼리 로직 |
| `MarketIntelligence.tsx` | `lib/api.ts` | 지수 위젯 표시 |
| `RateExplorer page` | `lib/api.ts`, `lib/constants.ts` | 운임 검색 |
| `MarketDashboard page` | `lib/api.ts`, `RateChart`, `RateTable` | 종합 대시보드 |
| `seed_market_data.py` | `models.py`, `database.py` | 시드 데이터 |

---

## 3. Data Model

### 3.1 FreightIndex (신규)

```python
# backend/app/models.py

class FreightIndex(Base):
    __tablename__ = "freight_indices"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    index_code = Column(String, nullable=False, index=True)    # SCFI, FBX, KCCI, WCI
    index_name = Column(String, nullable=False)                 # Full name (영문)
    value = Column(Numeric(12, 2), nullable=False)              # 지수 값
    change_pct = Column(Numeric(6, 2), default=0.0)             # 전일 대비 변동률 (%)
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)  # 기록 날짜
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**인덱스**: `(index_code, recorded_at)` 복합 인덱스 — 지수별 시계열 조회 최적화

### 3.2 RouteRate (신규)

```python
# backend/app/models.py

class RouteRate(Base):
    __tablename__ = "route_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    origin = Column(String, nullable=False, index=True)         # Port code (KRPUS, CNSHA, ...)
    destination = Column(String, nullable=False, index=True)
    transport_mode = Column(String, nullable=False)              # ocean_fcl, ocean_lcl, air, trucking
    container_type = Column(String, nullable=True)               # 20GP, 40GP, 40HC (해상만)
    rate_usd = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="USD")
    valid_from = Column(DateTime(timezone=True), nullable=False, index=True)
    valid_to = Column(DateTime(timezone=True), nullable=True)
    carrier = Column(String, nullable=True)                      # 선사/항공사 (optional)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**인덱스**: `(origin, destination, transport_mode, valid_from)` 복합 인덱스 — 항로 검색 최적화

### 3.3 RateSubscription 확장 (기존 모델)

```python
# backend/app/models.py — 기존 RateSubscription에 컬럼 추가

class RateSubscription(Base):
    __tablename__ = "rate_subscriptions"
    # ... 기존 필드 유지 ...
    transport_mode = Column(String, nullable=True)               # 추가: 운송 모드 필터
    last_alerted_at = Column(DateTime(timezone=True), nullable=True)  # 추가: 마지막 알림 시점
    current_rate = Column(Numeric(10, 2), nullable=True)         # 추가: 현재 조회된 운임
```

### 3.4 Entity Relationships

```
[FreightIndex] ── (독립, 공용 데이터)
    index_code → 시계열 데이터 (1 code : N records)

[RouteRate] ── (독립, 공용 데이터)
    origin + destination → 항로별 운임 (1 route : N rates)

[RateSubscription] ── FK → [Tenant]
    tenant_id → tenant 소속 알림 구독 (1 tenant : N subscriptions)
```

### 3.5 Database Migration

```sql
-- Alembic/수동 마이그레이션

CREATE TABLE freight_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    index_code VARCHAR NOT NULL,
    index_name VARCHAR NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    change_pct NUMERIC(6,2) DEFAULT 0.0,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_freight_indices_code_date ON freight_indices (index_code, recorded_at DESC);

CREATE TABLE route_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin VARCHAR NOT NULL,
    destination VARCHAR NOT NULL,
    transport_mode VARCHAR NOT NULL,
    container_type VARCHAR,
    rate_usd NUMERIC(10,2) NOT NULL,
    currency VARCHAR DEFAULT 'USD',
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    carrier VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_route_rates_search ON route_rates (origin, destination, transport_mode, valid_from DESC);

-- RateSubscription 확장
ALTER TABLE rate_subscriptions ADD COLUMN transport_mode VARCHAR;
ALTER TABLE rate_subscriptions ADD COLUMN last_alerted_at TIMESTAMPTZ;
ALTER TABLE rate_subscriptions ADD COLUMN current_rate NUMERIC(10,2);
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/market/indices` | 최신 글로벌 운임 지수 목록 | Optional |
| GET | `/api/v1/market/indices/{code}/history` | 특정 지수 히스토리 | Optional |
| GET | `/api/v1/market/rates` | 항로별 운임 검색 | Optional |
| GET | `/api/v1/market/rates/compare` | 복수 항로 운임 비교 | Optional |
| GET | `/api/v1/market/trends` | 운임 트렌드 (7/30/90일) | Optional |
| GET | `/api/v1/market/insight` | AI Trade Insight | Optional |

> **Auth**: Market 데이터는 공용이므로 인증 선택적. RateSubscription CRUD는 기존 rates 엔드포인트 유지 (tenant 인증 필요).

### 4.2 Detailed Specification

#### `GET /api/v1/market/indices`

최신 날짜의 4개 지수 데이터 반환.

**Query Parameters:**
- `date` (optional, string, YYYY-MM-DD): 특정 날짜 조회. 기본값 = 최신 recorded_at

**Response (200 OK):**
```json
{
  "indices": [
    {
      "index_code": "SCFI",
      "index_name": "Shanghai Containerized Freight Index",
      "value": 2147.86,
      "change_pct": 3.2,
      "trend": "up",
      "recorded_at": "2026-02-22T00:00:00Z",
      "sparkline": [2045.3, 2078.1, 2095.4, 2110.2, 2130.5, 2147.86]
    }
  ],
  "as_of": "2026-02-22T00:00:00Z"
}
```

**`sparkline`**: 최근 7일 value 배열 (서버에서 계산)

---

#### `GET /api/v1/market/indices/{code}/history`

특정 지수의 시계열 데이터.

**Path Parameters:**
- `code` (required, string): SCFI | FBX | KCCI | WCI

**Query Parameters:**
- `period` (optional, string): `7d` | `30d` | `90d` | `180d`. 기본값 = `30d`

**Response (200 OK):**
```json
{
  "index_code": "SCFI",
  "index_name": "Shanghai Containerized Freight Index",
  "period": "30d",
  "data": [
    { "date": "2026-01-23", "value": 1985.42, "change_pct": -0.3 },
    { "date": "2026-01-24", "value": 1992.10, "change_pct": 0.34 }
  ],
  "summary": {
    "min": 1925.30,
    "max": 2147.86,
    "avg": 2043.52,
    "current": 2147.86,
    "period_change_pct": 8.3
  }
}
```

---

#### `GET /api/v1/market/rates`

항로별 운임 검색. 최신 유효 운임을 반환.

**Query Parameters:**
- `origin` (required, string): 출발 항구 코드 (KRPUS, CNSHA, ...)
- `destination` (required, string): 도착 항구 코드
- `mode` (optional, string): `ocean_fcl` | `ocean_lcl` | `air` | `trucking`. 기본값 = 전체
- `container_type` (optional, string): `20GP` | `40GP` | `40HC`

**Response (200 OK):**
```json
{
  "origin": "KRPUS",
  "destination": "USLAX",
  "rates": [
    {
      "id": "uuid",
      "transport_mode": "ocean_fcl",
      "container_type": "20GP",
      "rate_usd": 1850.00,
      "currency": "USD",
      "carrier": "HMM",
      "valid_from": "2026-02-15T00:00:00Z",
      "valid_to": "2026-03-15T00:00:00Z",
      "trend": {
        "prev_rate": 1920.00,
        "change_pct": -3.6
      }
    }
  ],
  "total": 5,
  "estimated_days": { "min": 12, "max": 18 }
}
```

**`trend.prev_rate`**: 직전 유효 기간의 동일 항로/모드/컨테이너 운임
**`estimated_days`**: Shipment 테이블의 해당 항로 평균 transit days (있을 경우)

---

#### `GET /api/v1/market/rates/compare`

복수 항로 운임 비교.

**Query Parameters:**
- `routes` (required, string): 쉼표 구분 `origin-destination` 쌍. 예: `KRPUS-USLAX,KRPUS-DEHAM`
- `mode` (optional, string): 운송 모드 필터

**Response (200 OK):**
```json
{
  "comparisons": [
    {
      "origin": "KRPUS",
      "destination": "USLAX",
      "avg_rate_usd": 1850.00,
      "min_rate_usd": 1650.00,
      "max_rate_usd": 2100.00,
      "carrier_count": 3,
      "latest_valid_from": "2026-02-15T00:00:00Z"
    },
    {
      "origin": "KRPUS",
      "destination": "DEHAM",
      "avg_rate_usd": 2200.00,
      "min_rate_usd": 1900.00,
      "max_rate_usd": 2500.00,
      "carrier_count": 4,
      "latest_valid_from": "2026-02-10T00:00:00Z"
    }
  ],
  "mode": "ocean_fcl"
}
```

---

#### `GET /api/v1/market/trends`

전체 운임 트렌드 (평균 운임 추이).

**Query Parameters:**
- `period` (optional, string): `7d` | `30d` | `90d`. 기본값 = `30d`
- `mode` (optional, string): 운송 모드 필터
- `origin` (optional, string): 출발 항구 필터

**Response (200 OK):**
```json
{
  "period": "30d",
  "mode": "ocean_fcl",
  "data": [
    { "date": "2026-01-23", "avg_rate": 2150.30, "volume": 45 },
    { "date": "2026-01-24", "avg_rate": 2165.80, "volume": 52 }
  ],
  "summary": {
    "trend_direction": "up",
    "period_change_pct": 5.2,
    "avg_rate": 2180.45,
    "total_data_points": 1247
  }
}
```

---

#### `GET /api/v1/market/insight`

내부 데이터 기반 AI Trade Insight (규칙 기반).

**Response (200 OK):**
```json
{
  "insights": [
    {
      "type": "rate_trend",
      "title": "Asia-US West Coast rates declining",
      "description": "Average ocean FCL rates on Asia-USWC routes have decreased 3.6% over the past 7 days.",
      "severity": "info",
      "data": {
        "route": "Asia → US West Coast",
        "change_pct": -3.6,
        "period": "7d"
      }
    },
    {
      "type": "best_timing",
      "title": "Optimal shipping window",
      "description": "Based on seasonal patterns, rates typically dip in early March. Consider booking within the next 2 weeks.",
      "severity": "opportunity",
      "data": {
        "recommended_window": "2026-03-01 ~ 2026-03-15"
      }
    }
  ],
  "generated_at": "2026-02-22T10:30:00Z"
}
```

> **구현 방식**: Phase 1은 규칙 기반 (트렌드 분석 + 시즌 패턴). Phase 2에서 ML 모델로 대체 가능.

### 4.3 Error Responses

| Code | Cause | Response |
|------|-------|----------|
| 400 | 잘못된 port code 또는 파라미터 | `{"detail": "Invalid origin port code: XXXXX"}` |
| 404 | 지수 코드 미존재 | `{"detail": "Index code 'XXX' not found"}` |
| 422 | Validation 실패 | FastAPI 기본 validation error |

---

## 5. UI/UX Design

### 5.1 MarketIntelligence Widget (리팩토링)

**위치**: Landing page (`/[locale]/page.tsx`)
**현재**: 하드코딩된 4개 지수 + 정적 sparkline
**변경**: TanStack Query로 `/api/v1/market/indices` 호출, 실제 데이터 렌더링

```
┌──────────────────────────────────────────────────────────────┐
│  Market Intelligence                              ▶ 더 보기  │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │  SCFI   │ │   FBX   │ │  KCCI   │ │   WCI   │            │
│ │ 2,147   │ │ $2,642  │ │ 2,492   │ │ $3,162  │            │
│ │ +3.2% ▲ │ │ -1.5% ▼ │ │ +0.8% ▲ │ │ +5.4% ▲ │            │
│ │ ▁▂▃▄▅▆▇ │ │ ▇▆▅▄▃▂▁ │ │ ▃▃▄▄▅▅▆ │ │ ▁▃▅▅▆▇▇ │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
├──────────────────────────────────────────────────────────────┤
│ 💡 AI Trade Insight (동적 로드)                              │
│ "Asia-US West Coast rates declining 3.6% over 7 days..."    │
└──────────────────────────────────────────────────────────────┘
```

**TanStack Query 패턴:**
```typescript
const { data: marketData, isLoading } = useQuery({
  queryKey: ['market', 'indices'],
  queryFn: () => fetchMarketIndices(),
  refetchInterval: 5 * 60 * 1000, // 5분 폴링
  staleTime: 3 * 60 * 1000,
})
```

### 5.2 Rate Explorer Page (완성)

**위치**: `/[locale]/tools/rate-explorer/page.tsx`
**현재**: `simulateRate()` 함수로 가상 데이터 생성
**변경**: `/api/v1/market/rates` API 호출, 실제 DB 데이터 표시

```
┌──────────────────────────────────────────────────────────────┐
│  운임 탐색기 (Rate Explorer)                                  │
├──────────────────────────────────────────────────────────────┤
│  [해상FCL] [해상LCL] [항공] [트럭]    ← 모드 탭 (기존 유지)    │
│                                                              │
│  출발항: [KRPUS ▼]  → 도착항: [USLAX ▼]  [조회]              │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 운임 범위    │  │ 소요일수     │  │ 항로 정보    │        │
│  │ $1,650~2,100 │  │ 12~18일      │  │ 부산→LA/롱비치│       │
│  │ /20ft (FCL)  │  │ 영업일 기준  │  │ [알림받기]   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├──────────────────────────────────────────────────────────────┤
│  운임 히스토리 차트 (Recharts AreaChart)    [7d|30d|90d]      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         /\    /\          ← Recharts AreaChart        │    │
│  │    /\  /  \  /  \  /\                                 │    │
│  │   /  \/    \/    \/  \                                │    │
│  │  /                     \                              │    │
│  └──────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│  선사별 상세 운임 테이블                                      │
│  ┌──────┬──────────┬──────┬──────┬──────────┐               │
│  │선사  │컨테이너  │운임  │변동  │유효기간  │               │
│  ├──────┼──────────┼──────┼──────┼──────────┤               │
│  │HMM   │20GP      │$1,850│-3.6% │~03/15    │               │
│  │MSC   │20GP      │$1,920│+1.2% │~03/20    │               │
│  │Maersk│20GP      │$2,100│+0.5% │~03/10    │               │
│  └──────┴──────────┴──────┴──────┴──────────┘               │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Market Dashboard Page (신규)

**위치**: `/[locale]/tools/market/page.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  Market Dashboard                                             │
│  물류 시장 인텔리전스                     [7d] [30d] [90d]     │
├──────────────────────────────────────────────────────────────┤
│  글로벌 지수 개요 (4개 카드, MarketIntelligence 확장)          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │  SCFI   │ │   FBX   │ │  KCCI   │ │   WCI   │            │
│  │ (클릭시 │ │ (클릭시 │ │ (클릭시 │ │ (클릭시 │            │
│  │ 차트열림)│ │ 차트열림)│ │ 차트열림)│ │ 차트열림)│            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
├─────────────────────────┬────────────────────────────────────┤
│  선택된 지수 차트        │  운임 트렌드 차트                   │
│  (Recharts LineChart)    │  (Recharts AreaChart)              │
│  SCFI 30일 추이          │  평균 운임 + 거래량                │
│                         │                                    │
├─────────────────────────┴────────────────────────────────────┤
│  AI Trade Insights                                            │
│  ┌───────────────────────────────┐ ┌──────────────────────┐  │
│  │ 📉 Asia-USWC rates declining │ │ 📊 Best timing alert │  │
│  │ ... (insight card)            │ │ ... (insight card)    │  │
│  └───────────────────────────────┘ └──────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Quick Rate Search → Rate Explorer 내장 (간소화 버전)          │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 User Flow

```
Landing Page
  └─ MarketIntelligence Widget
       ├─ [더 보기] → /tools/market (Market Dashboard)
       └─ QuickQuoteWidget
            └─ [조회] → /tools/rate-explorer?origin=...&dest=...

Market Dashboard (/tools/market)
  ├─ 지수 카드 클릭 → 차트 패널 업데이트
  ├─ 운임 트렌드 → 기간/모드 필터 변경
  └─ Quick Rate Search → Rate Explorer 링크

Rate Explorer (/tools/rate-explorer)
  ├─ 모드 선택 → 출발항/도착항 → 조회
  ├─ 결과: 운임 카드 + 차트 + 테이블
  └─ [알림 받기] → RateSubscription 생성 (기존 API)
```

### 5.5 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `MarketIntelligence.tsx` | `app/components/` | 지수 위젯 (리팩토링) |
| `RateChart.tsx` | `app/components/` | 운임 시계열 차트 (Recharts) |
| `RateTable.tsx` | `app/components/` | 선사별 운임 테이블 |
| `RateAlertForm.tsx` | `app/components/` | 알림 구독 폼 (기존 모달 분리) |
| `InsightCard.tsx` | `app/components/` | AI Insight 카드 |
| `market/page.tsx` | `app/[locale]/tools/market/` | Market Dashboard 페이지 |
| `rate-explorer/page.tsx` | `app/[locale]/tools/rate-explorer/` | Rate Explorer (리팩토링) |

---

## 6. Error Handling

### 6.1 Backend Error Strategy

| Scenario | Code | Handling |
|----------|------|----------|
| 잘못된 port code | 400 | `HTTPException(400, detail="Invalid port code")` |
| 지수 코드 미존재 | 404 | `HTTPException(404, detail="Index not found")` |
| DB 연결 실패 | 500 | 기본 FastAPI error handler, 로그 기록 |
| 데이터 없음 (빈 결과) | 200 | 빈 배열 반환 (`{"rates": [], "total": 0}`) |

### 6.2 Frontend Error Strategy

```typescript
// TanStack Query error handling 패턴
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['market', 'indices'],
  queryFn: fetchMarketIndices,
  retry: 2,
  retryDelay: 1000,
})

// isLoading → Skeleton UI
// isError → "데이터를 불러올 수 없습니다" + 재시도 버튼
// data empty → "검색 결과가 없습니다" 안내
```

### 6.3 Fallback Strategy

- API 호출 실패 시: MarketIntelligence 위젯은 하드코딩 폴백 데이터 표시 (현재 상수)
- Rate Explorer 검색 결과 없음: "해당 항로의 운임 데이터가 아직 없습니다" 메시지
- 차트 데이터 부족 (< 3 포인트): "데이터 수집 중" 안내, 차트 미표시

---

## 7. Security Considerations

- [x] Market 데이터(지수, 운임)는 공용 → 인증 불필요
- [x] RateSubscription CRUD는 기존 tenant 인증 유지
- [x] SQL Injection: SQLAlchemy ORM 사용 (파라미터 바인딩)
- [x] Input Validation: Pydantic 스키마로 port code, period, mode 검증
- [x] Rate Limiting: 기존 FastAPI middleware 적용 (추가 설정 불필요)
- [x] CORS: 기존 설정 유지 (`main.py`의 CORSMiddleware)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| API 수동 테스트 | Market 엔드포인트 6개 | Swagger UI / curl |
| 빌드 테스트 | Frontend TypeScript | `npx tsc --noEmit` |
| 린트 테스트 | Frontend ESLint | `npx eslint .` |
| 시드 검증 | 데이터 무결성 | `seed_market_data.py` + SQL 확인 |

### 8.2 Test Cases (Key)

- [ ] `GET /market/indices` → 4개 지수 + sparkline 7개 반환
- [ ] `GET /market/indices/SCFI/history?period=30d` → 30개 데이터포인트
- [ ] `GET /market/rates?origin=KRPUS&destination=USLAX&mode=ocean_fcl` → 유효 운임 반환
- [ ] `GET /market/rates?origin=INVALID&destination=USLAX` → 400 에러
- [ ] `GET /market/rates/compare?routes=KRPUS-USLAX,KRPUS-DEHAM` → 2개 비교 결과
- [ ] `GET /market/trends?period=90d` → 90일 트렌드 데이터
- [ ] `GET /market/insight` → insights 배열 (1개 이상)
- [ ] MarketIntelligence 위젯: API 연동 후 실제 값 표시
- [ ] Rate Explorer: 검색 결과 + 차트 + 테이블 렌더링
- [ ] Market Dashboard: 지수 카드 + 차트 + 인사이트 표시
- [ ] `npm run build` 성공 (TypeScript 오류 없음)

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | UI 컴포넌트, 페이지 | `frontend/app/components/`, `frontend/app/[locale]/tools/` |
| **Application** | API 호출, 상태 관리 | `frontend/lib/api.ts`, TanStack Query hooks |
| **Domain** | TypeScript 타입/인터페이스 | `frontend/lib/api.ts` (인터페이스 섹션) |
| **Infrastructure** | Axios 클라이언트, 인터셉터 | `frontend/lib/api.ts` (axios 인스턴스) |
| **Backend Router** | HTTP 엔드포인트 | `backend/app/api/endpoints/market.py` |
| **Backend CRUD** | 비즈니스 로직, DB 쿼리 | `backend/app/crud/market.py` |
| **Backend Schema** | Pydantic 요청/응답 모델 | `backend/app/schemas.py` |
| **Backend Model** | SQLAlchemy ORM 모델 | `backend/app/models.py` |

### 9.2 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `MarketIntelligence.tsx` | Presentation | `frontend/app/components/` |
| `RateChart.tsx` | Presentation | `frontend/app/components/` |
| `RateTable.tsx` | Presentation | `frontend/app/components/` |
| `RateAlertForm.tsx` | Presentation | `frontend/app/components/` |
| `InsightCard.tsx` | Presentation | `frontend/app/components/` |
| `market/page.tsx` | Presentation | `frontend/app/[locale]/tools/market/` |
| `fetchMarketIndices()` | Application | `frontend/lib/api.ts` |
| `fetchRouteRates()` | Application | `frontend/lib/api.ts` |
| `MarketIndex`, `RouteRate` | Domain | `frontend/lib/api.ts` |
| `market.py` (router) | Backend Router | `backend/app/api/endpoints/` |
| `market.py` (crud) | Backend CRUD | `backend/app/crud/` |
| Market Pydantic schemas | Backend Schema | `backend/app/schemas.py` |
| `FreightIndex`, `RouteRate` | Backend Model | `backend/app/models.py` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Backend 모델 | PascalCase | `FreightIndex`, `RouteRate` |
| Backend 테이블 | snake_case | `freight_indices`, `route_rates` |
| Backend 엔드포인트 | snake_case 함수 | `get_indices()`, `search_rates()` |
| Frontend 컴포넌트 | PascalCase | `RateChart`, `RateTable` |
| Frontend API 함수 | camelCase | `fetchMarketIndices()`, `fetchRouteRates()` |
| Frontend 타입 | PascalCase | `MarketIndex`, `RouteRateResponse` |
| 상수 | UPPER_SNAKE_CASE | `PORTS`, `MODES` |
| CSS 클래스 | Tailwind utility | `className="bg-white rounded-2xl..."` |

### 10.2 Import Order (Frontend)

```typescript
// 1. React/Next.js
import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'

// 2. External libraries
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis } from 'recharts'

// 3. Internal libs
import { fetchMarketIndices, fetchRouteRates } from '@/lib/api'
import { PORTS, MODES } from '@/lib/constants'

// 4. Components
import RateChart from './RateChart'
import RateTable from './RateTable'

// 5. Icons
import { TrendingUp, Search } from 'lucide-react'
```

### 10.3 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase.tsx (기존 패턴: `MarketIntelligence.tsx`) |
| File organization | `app/components/` 단일 폴더 (기존 패턴) |
| State management | TanStack Query v5 (서버 상태), useState (UI 상태) |
| Error handling | TanStack Query `isError` + fallback UI |
| API pattern | `api.get<T>()` → `response.data` (기존 패턴) |
| Backend pattern | Router → CRUD → Model (analytics.py 패턴) |

---

## 11. Implementation Guide

### 11.1 File Structure (변경/생성 파일)

```
backend/app/
├── models.py                          # [수정] FreightIndex, RouteRate 추가
├── schemas.py                         # [수정] Market 관련 스키마 추가
├── crud/
│   └── market.py                      # [생성] Market CRUD 로직
├── api/
│   ├── api.py                         # [수정] market router 등록
│   └── endpoints/
│       └── market.py                  # [생성] Market API 엔드포인트
└── seed_market_data.py                # [생성] 시장 데이터 시드

frontend/
├── lib/
│   └── api.ts                         # [수정] Market API 함수 + 타입 추가
├── app/
│   ├── components/
│   │   ├── MarketIntelligence.tsx      # [수정] API 연동 리팩토링
│   │   ├── RateChart.tsx              # [생성] 운임 차트 컴포넌트
│   │   ├── RateTable.tsx              # [생성] 운임 테이블 컴포넌트
│   │   ├── RateAlertForm.tsx          # [생성] 알림 구독 폼 (모달 분리)
│   │   └── InsightCard.tsx            # [생성] AI Insight 카드
│   └── [locale]/tools/
│       ├── market/
│       │   └── page.tsx               # [생성] Market Dashboard 페이지
│       └── rate-explorer/
│           └── page.tsx               # [수정] API 연동 리팩토링
```

### 11.2 Implementation Order

1. [ ] **Backend Models** — `models.py`에 FreightIndex, RouteRate 추가 + RateSubscription 컬럼 추가
2. [ ] **Backend Schemas** — `schemas.py`에 Market 관련 Pydantic 스키마 추가
3. [ ] **Backend CRUD** — `crud/market.py` 생성 (쿼리 로직)
4. [ ] **Backend Router** — `api/endpoints/market.py` 생성 + `api.py`에 등록
5. [ ] **Seed Data** — `seed_market_data.py` 생성 및 실행 (6개월 히스토리)
6. [ ] **Frontend API** — `lib/api.ts`에 Market API 함수 + TypeScript 타입 추가
7. [ ] **MarketIntelligence 리팩토링** — 하드코딩 → API 연동 전환
8. [ ] **RateChart + RateTable** — 신규 컴포넌트 생성
9. [ ] **Rate Explorer 리팩토링** — simulateRate() → API 연동 전환
10. [ ] **Market Dashboard** — `/tools/market/page.tsx` 신규 생성
11. [ ] **InsightCard + RateAlertForm** — 보조 컴포넌트 생성
12. [ ] **빌드 검증** — `npm run build` + `tsc --noEmit` + `eslint`

### 11.3 Seed Data Specification

`seed_market_data.py`:
- **FreightIndex**: 4개 지수 x 180일 = 720 레코드
  - SCFI: base 2000, 일일 변동 +-50 (random walk)
  - FBX: base 2500, 일일 변동 +-80
  - KCCI: base 2400, 일일 변동 +-40
  - WCI: base 3000, 일일 변동 +-100
- **RouteRate**: 주요 10개 항로 x 4개 모드 x 6개월(월별) = ~240 레코드
  - 항로: KRPUS-USLAX, KRPUS-DEHAM, KRPUS-CNSHA, CNSHA-USLAX, CNSHA-NLRTM, SGSIN-GBFXT, HKHKG-USLAX, VNSGN-KRPUS, JPTYO-USSEA, THBKK-DEHAM
  - carrier: HMM, MSC, Maersk, ONE, Evergreen, CMA CGM (랜덤 배정)
  - container_type: 20GP, 40GP, 40HC (해상만)
  - valid_from/to: 월별 유효 기간

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-22 | Initial draft | Jaehong |
