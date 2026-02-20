# SURFF.kr Benchmarking Report

## 1. Overview

SURFF.kr is a South Korean digital seafreight marketplace and data platform. It focuses on transparency in ocean freight rates and providing data-driven insights to shippers and forwarders.

### 1.1 Core Value Proposition

- **"One Search for Complex Rates"**: Simplifies the process of finding and comparing ocean freight rates.
- **"Data-Driven Decisions"**: Provides premium data to read the movement of the shipping market.

---

## 2. Feature Comparison (SURFF vs. LogiNexus)

| Feature              | SURFF.kr                                                     | LogiNexus (Current)                     | Difference/Gap                                                 |
| :------------------- | :----------------------------------------------------------- | :-------------------------------------- | :------------------------------------------------------------- |
| **Marketplace**      | Real-time seafreight comparison & booking                    | Quick Quote widget (Internal data)      | SURFF has direct carrier/forwarder matching & booking.         |
| **Data Center**      | Comprehensive indices (SCFI, KCCI, KCCI), cargo volume stats | Intelligence dashboard (In development) | SURFF provides global market indicators and historical trends. |
| **Social Proof**     | Real-time booking matching feed                              | None                                    | SURFF uses FOMO/social proof to drive trust.                   |
| **Hot Deals**        | Time-limited inventory liquidation                           | None                                    | SURFF has a specific section for last-min inventory.           |
| **Vessel Schedules** | Detailed vessel names, transit times, direct/TS info         | Basic estimated dates                   | SURFF provides deeper operational visibility during quoting.   |
| **Tracking**         | Real-time AIS/B/L tracking                                   | Map-based shipment tracking             | Both have tracking, SURFF is more carrier-integrated.          |

---

## 3. UI/UX Analysis

### 3.1 Key Design Strengths of SURFF

- **Data Visualization**: Expertly uses charts and infographics for market indices.
- **Micro-Interactions**: Real-time matching popups increase platform "energy".
- **Embedded Insights**: Placing data banners (e.g., "Lowest rate in 3 months") _inside_ search results adds immediate value.
- **Premium Aesthetic**: Clean "Logistics Blue" (#535FF0) with a modern card-based system.

---

## 4. Opportunities for LogiNexus

### ✨ Priority 1: Market Intelligence (Data Center)

LogiNexus should formalize its "Intelligence" section by integrating global indices (SCFI, FBX) and historical price trends similar to SURFF's Data Center.

> [!TIP]
> Use the existing backend to fetch and cache global freight indices for a "Market Ticker" on the landing page.

### 🚀 Priority 2: Social Proof & Urgency

Implement a "Recent Matching" or "Live Quote Feed" notification system to demonstrate platform activity.

> [!NOTE]
> This can be simulated initially or tied to actual quote requests in the DB.

### 🎨 Priority 3: Embedded Insights in Quotes

When a user searches for a quote in LogiNexus, display a banner or note comparing the current quote to the 3-month average or showing regional demand.

---

## 5. Visual References

![SURFF Landing Page](file:///Users/jaehong/.gemini/antigravity/brain/a80adcc3-19c3-4dda-949f-4de7d1d208c8/surff_landing_page_full_1771572963120.png)
_Figure 1: SURFF Main Landing Page showing high-density data and clear CTAs._

![SURFF Data Center](file:///Users/jaehong/.gemini/antigravity/brain/a80adcc3-19c3-4dda-949f-4de7d1d208c8/surff_data_center_1771574243202.png)
_Figure 2: SURFF Data Center with market indicators (SCFI, KCCI)._
