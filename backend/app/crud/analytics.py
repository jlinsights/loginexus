from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from datetime import date, datetime, timedelta
from ..models import Shipment, PaymentEscrow
import uuid


def get_summary(db: Session, tenant_id: str, start_date: date, end_date: date):
    query = db.query(Shipment).filter(
        Shipment.created_at >= datetime.combine(start_date, datetime.min.time()),
        Shipment.created_at <= datetime.combine(end_date, datetime.max.time()),
    )
    if tenant_id != "default":
        query = query.filter(Shipment.tenant_id == uuid.UUID(tenant_id))

    shipments = query.all()
    total = len(shipments)
    in_transit = sum(1 for s in shipments if s.current_status == "In Transit")
    delivered = sum(1 for s in shipments if s.current_status == "Delivered")
    booked = sum(1 for s in shipments if s.current_status == "BOOKED")

    # On-time rate: delivered shipments where ata <= eta (or no eta set)
    delivered_shipments = [s for s in shipments if s.current_status == "Delivered"]
    if delivered_shipments:
        on_time = sum(
            1 for s in delivered_shipments
            if s.eta is None or s.ata is None or s.ata <= s.eta
        )
        on_time_rate = round((on_time / len(delivered_shipments)) * 100, 1)
    else:
        on_time_rate = 0.0

    # Avg transit days: for delivered shipments with ata
    transit_days_list = []
    for s in delivered_shipments:
        if s.ata and s.created_at:
            delta = s.ata - s.created_at
            transit_days_list.append(delta.days)
    avg_transit_days = round(sum(transit_days_list) / len(transit_days_list), 1) if transit_days_list else 0.0

    return {
        "total_shipments": total,
        "in_transit": in_transit,
        "delivered": delivered,
        "booked": booked,
        "on_time_rate": on_time_rate,
        "avg_transit_days": avg_transit_days,
    }


def get_volume(db: Session, tenant_id: str, start_date: date, end_date: date, granularity: str = "daily"):
    query = db.query(Shipment).filter(
        Shipment.created_at >= datetime.combine(start_date, datetime.min.time()),
        Shipment.created_at <= datetime.combine(end_date, datetime.max.time()),
    )
    if tenant_id != "default":
        query = query.filter(Shipment.tenant_id == uuid.UUID(tenant_id))

    shipments = query.all()

    # Group by date
    buckets = {}
    for s in shipments:
        if not s.created_at:
            continue
        if granularity == "weekly":
            # ISO week start (Monday)
            d = s.created_at.date()
            key = (d - timedelta(days=d.weekday())).isoformat()
        elif granularity == "monthly":
            key = s.created_at.strftime("%Y-%m")
        else:
            key = s.created_at.strftime("%Y-%m-%d")

        if key not in buckets:
            buckets[key] = {"count": 0, "status_booked": 0, "status_in_transit": 0, "status_delivered": 0}
        buckets[key]["count"] += 1
        if s.current_status == "BOOKED":
            buckets[key]["status_booked"] += 1
        elif s.current_status == "In Transit":
            buckets[key]["status_in_transit"] += 1
        elif s.current_status == "Delivered":
            buckets[key]["status_delivered"] += 1

    result = [{"date": k, **v} for k, v in sorted(buckets.items())]
    return result


def get_status_distribution(db: Session, tenant_id: str, start_date: date, end_date: date):
    query = db.query(Shipment).filter(
        Shipment.created_at >= datetime.combine(start_date, datetime.min.time()),
        Shipment.created_at <= datetime.combine(end_date, datetime.max.time()),
    )
    if tenant_id != "default":
        query = query.filter(Shipment.tenant_id == uuid.UUID(tenant_id))

    shipments = query.all()
    total = len(shipments)
    counts = {}
    for s in shipments:
        status = s.current_status or "BOOKED"
        counts[status] = counts.get(status, 0) + 1

    result = []
    for status, count in counts.items():
        result.append({
            "status": status,
            "count": count,
            "percentage": round((count / total) * 100, 1) if total > 0 else 0.0,
        })
    return result


def get_route_performance(db: Session, tenant_id: str, start_date: date, end_date: date):
    query = db.query(Shipment).filter(
        Shipment.created_at >= datetime.combine(start_date, datetime.min.time()),
        Shipment.created_at <= datetime.combine(end_date, datetime.max.time()),
    )
    if tenant_id != "default":
        query = query.filter(Shipment.tenant_id == uuid.UUID(tenant_id))

    shipments = query.all()

    routes = {}
    for s in shipments:
        key = (s.origin, s.destination)
        if key not in routes:
            routes[key] = {"shipments": [], "on_time": 0, "delivered": 0}
        routes[key]["shipments"].append(s)
        if s.current_status == "Delivered":
            routes[key]["delivered"] += 1
            if s.eta is None or s.ata is None or s.ata <= s.eta:
                routes[key]["on_time"] += 1

    result = []
    for (origin, dest), data in routes.items():
        transit_days = []
        for s in data["shipments"]:
            if s.current_status == "Delivered" and s.ata and s.created_at:
                transit_days.append((s.ata - s.created_at).days)

        result.append({
            "origin": origin,
            "destination": dest,
            "shipment_count": len(data["shipments"]),
            "avg_transit_days": round(sum(transit_days) / len(transit_days), 1) if transit_days else 0.0,
            "on_time_rate": round((data["on_time"] / data["delivered"]) * 100, 1) if data["delivered"] > 0 else 0.0,
        })

    result.sort(key=lambda x: x["shipment_count"], reverse=True)
    return result


def get_escrow_summary(db: Session, tenant_id: str, start_date: date, end_date: date):
    # Join escrows with shipments to filter by tenant
    query = db.query(PaymentEscrow).join(
        Shipment, PaymentEscrow.shipment_id == Shipment.id
    ).filter(
        PaymentEscrow.created_at >= datetime.combine(start_date, datetime.min.time()),
        PaymentEscrow.created_at <= datetime.combine(end_date, datetime.max.time()),
    )
    if tenant_id != "default":
        query = query.filter(Shipment.tenant_id == uuid.UUID(tenant_id))

    escrows = query.all()
    total_volume = sum(float(e.amount_usdc) for e in escrows)
    escrow_count = len(escrows)

    status_map = {}
    for e in escrows:
        status = e.status or "created"
        if status not in status_map:
            status_map[status] = {"count": 0, "volume_usdc": 0.0}
        status_map[status]["count"] += 1
        status_map[status]["volume_usdc"] += float(e.amount_usdc)

    breakdown = [
        {"status": k, "count": v["count"], "volume_usdc": round(v["volume_usdc"], 2)}
        for k, v in status_map.items()
    ]

    return {
        "total_volume_usdc": round(total_volume, 2),
        "escrow_count": escrow_count,
        "status_breakdown": breakdown,
    }
