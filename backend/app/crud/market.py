from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, timedelta, datetime
from typing import Optional, List

from ..models import FreightIndex, RouteRate


def get_indices(db: Session) -> list:
    """Get latest value for each index with sparkline (last 7 values)."""
    # Get distinct index codes
    index_codes = db.query(FreightIndex.index_code).distinct().all()
    index_codes = [row[0] for row in index_codes]

    results = []
    for code in index_codes:
        # Latest record
        latest = (
            db.query(FreightIndex)
            .filter(FreightIndex.index_code == code)
            .order_by(desc(FreightIndex.recorded_at))
            .first()
        )
        if not latest:
            continue

        # Sparkline: last 7 values
        sparkline_rows = (
            db.query(FreightIndex.value)
            .filter(FreightIndex.index_code == code)
            .order_by(desc(FreightIndex.recorded_at))
            .limit(7)
            .all()
        )
        sparkline = [float(row[0]) for row in reversed(sparkline_rows)]

        results.append({
            "index_code": latest.index_code,
            "index_name": latest.index_name,
            "value": float(latest.value),
            "change_pct": float(latest.change_pct),
            "recorded_at": latest.recorded_at,
            "sparkline": sparkline,
        })

    return results


def get_index_history(
    db: Session, index_code: str, period: str = "30d"
) -> Optional[dict]:
    """Get historical data for a specific index."""
    days_map = {"7d": 7, "30d": 30, "90d": 90, "180d": 180}
    days = days_map.get(period, 30)
    start_date = date.today() - timedelta(days=days)

    # Verify index exists
    sample = (
        db.query(FreightIndex)
        .filter(FreightIndex.index_code == index_code)
        .first()
    )
    if not sample:
        return None

    rows = (
        db.query(FreightIndex)
        .filter(
            FreightIndex.index_code == index_code,
            FreightIndex.recorded_at >= start_date,
        )
        .order_by(FreightIndex.recorded_at)
        .all()
    )

    data = [
        {
            "date": row.recorded_at,
            "value": float(row.value),
            "change_pct": float(row.change_pct),
        }
        for row in rows
    ]

    return {
        "index_code": index_code,
        "index_name": sample.index_name,
        "period": period,
        "data": data,
    }


def search_rates(
    db: Session,
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    mode: Optional[str] = None,
) -> dict:
    """Search route rates with optional filters."""
    query = db.query(RouteRate)

    if origin:
        query = query.filter(RouteRate.origin == origin)
    if destination:
        query = query.filter(RouteRate.destination == destination)
    if mode:
        query = query.filter(RouteRate.mode == mode)

    # Only return rates that are currently valid or recently valid
    query = query.order_by(desc(RouteRate.valid_from))
    rates = query.limit(100).all()

    return {
        "rates": rates,
        "total": len(rates),
        "origin": origin,
        "destination": destination,
        "mode": mode,
    }


def compare_routes(
    db: Session,
    routes: List[str],
    mode: Optional[str] = None,
) -> list:
    """Compare rates across multiple routes.

    routes: list of "ORIGIN-DESTINATION" strings
    """
    results = []
    for route_str in routes:
        parts = route_str.split("-")
        if len(parts) != 2:
            continue
        origin, destination = parts

        query = db.query(RouteRate).filter(
            RouteRate.origin == origin,
            RouteRate.destination == destination,
        )
        if mode:
            query = query.filter(RouteRate.mode == mode)

        rates = query.all()
        if not rates:
            continue

        rate_values = [float(r.rate_usd) for r in rates]
        carriers = set(r.carrier for r in rates if r.carrier)
        latest_valid = max(r.valid_from for r in rates)

        results.append({
            "origin": origin,
            "destination": destination,
            "avg_rate_usd": round(sum(rate_values) / len(rate_values), 2),
            "min_rate_usd": min(rate_values),
            "max_rate_usd": max(rate_values),
            "carrier_count": len(carriers),
            "latest_valid_from": latest_valid,
        })

    return results


def get_trends(
    db: Session,
    period: str = "30d",
    mode: Optional[str] = None,
    origin: Optional[str] = None,
) -> dict:
    """Get rate trends over time."""
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(period, 30)
    start_date = date.today() - timedelta(days=days)

    query = db.query(RouteRate).filter(RouteRate.valid_from >= start_date)
    if mode:
        query = query.filter(RouteRate.mode == mode)
    if origin:
        query = query.filter(RouteRate.origin == origin)

    rates = query.order_by(RouteRate.valid_from).all()

    # Group by date (valid_from)
    date_groups: dict = {}
    for r in rates:
        d = r.valid_from
        if d not in date_groups:
            date_groups[d] = []
        date_groups[d].append(float(r.rate_usd))

    data = []
    for d in sorted(date_groups.keys()):
        vals = date_groups[d]
        data.append({
            "date": d,
            "avg_rate": round(sum(vals) / len(vals), 2),
            "volume": len(vals),
        })

    # Summary
    if data:
        first_avg = data[0]["avg_rate"]
        last_avg = data[-1]["avg_rate"]
        overall_avg = round(sum(dp["avg_rate"] for dp in data) / len(data), 2)
        if first_avg > 0:
            change_pct = round(((last_avg - first_avg) / first_avg) * 100, 1)
        else:
            change_pct = 0.0

        if change_pct > 1:
            direction = "up"
        elif change_pct < -1:
            direction = "down"
        else:
            direction = "stable"

        summary = {
            "trend_direction": direction,
            "period_change_pct": change_pct,
            "avg_rate": overall_avg,
            "total_data_points": sum(dp["volume"] for dp in data),
        }
    else:
        summary = {
            "trend_direction": "stable",
            "period_change_pct": 0.0,
            "avg_rate": 0.0,
            "total_data_points": 0,
        }

    return {
        "period": period,
        "mode": mode,
        "data": data,
        "summary": summary,
    }


def get_insights(db: Session) -> list:
    """Generate rule-based market insights from data."""
    insights = []
    today = date.today()

    # Insight 1: Rate trend for recent 7 days
    week_ago = today - timedelta(days=7)
    recent_rates = (
        db.query(RouteRate)
        .filter(RouteRate.valid_from >= week_ago)
        .all()
    )
    older_rates = (
        db.query(RouteRate)
        .filter(
            RouteRate.valid_from >= week_ago - timedelta(days=7),
            RouteRate.valid_from < week_ago,
        )
        .all()
    )

    if recent_rates and older_rates:
        recent_avg = sum(float(r.rate_usd) for r in recent_rates) / len(recent_rates)
        older_avg = sum(float(r.rate_usd) for r in older_rates) / len(older_rates)
        if older_avg > 0:
            change = round(((recent_avg - older_avg) / older_avg) * 100, 1)
            direction = "declining" if change < 0 else "rising"
            insights.append({
                "type": "rate_trend",
                "title": f"Global freight rates {direction}",
                "description": f"Average rates have changed {change}% over the past 7 days compared to the prior week.",
                "severity": "info",
                "data": {"change_pct": change, "period": "7d"},
            })

    # Insight 2: Best timing (seasonal pattern hint)
    month = today.month
    if month in (1, 2, 3):
        insights.append({
            "type": "best_timing",
            "title": "Optimal shipping window approaching",
            "description": "Based on seasonal patterns, rates typically dip in early March. Consider booking within the next 2-4 weeks.",
            "severity": "opportunity",
            "data": {"recommended_window": f"{today.year}-03-01 ~ {today.year}-03-15"},
        })
    elif month in (6, 7, 8):
        insights.append({
            "type": "best_timing",
            "title": "Peak season rates expected",
            "description": "Summer peak season is approaching. Lock in rates early to avoid surcharges.",
            "severity": "warning",
            "data": {"recommended_action": "Book early"},
        })

    # Insight 3: Index movement
    indices = get_indices(db)
    for idx in indices:
        if abs(idx["change_pct"]) > 3.0:
            direction = "surging" if idx["change_pct"] > 0 else "dropping"
            insights.append({
                "type": "index_alert",
                "title": f"{idx['index_code']} index {direction}",
                "description": f"{idx['index_name']} moved {idx['change_pct']}% to {idx['value']:.0f}.",
                "severity": "warning" if abs(idx["change_pct"]) > 5 else "info",
                "data": {
                    "index_code": idx["index_code"],
                    "value": idx["value"],
                    "change_pct": idx["change_pct"],
                },
            })

    # Fallback if no insights generated
    if not insights:
        insights.append({
            "type": "market_stable",
            "title": "Market conditions stable",
            "description": "No significant rate changes detected in the past week. Market remains steady.",
            "severity": "info",
            "data": {},
        })

    return insights
