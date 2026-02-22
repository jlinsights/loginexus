"""Seed script for Market Intelligence data.

Generates 6 months of freight index and route rate data.
Usage: python seed_market_data.py
"""
import random
import sys
import os
from datetime import date, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, FreightIndex, RouteRate

# Ensure tables exist
Base.metadata.create_all(bind=engine)

# --- Configuration ---

INDEX_CONFIG = {
    "SCFI": {"name": "Shanghai Containerized Freight Index", "base": 2000, "volatility": 50},
    "FBX": {"name": "Freightos Baltic Index", "base": 2500, "volatility": 80},
    "KCCI": {"name": "Korea Container Cost Index", "base": 2400, "volatility": 40},
    "WCI": {"name": "World Container Index", "base": 3000, "volatility": 100},
}

ROUTES = [
    ("KRPUS", "USLAX"),
    ("KRPUS", "DEHAM"),
    ("KRPUS", "CNSHA"),
    ("CNSHA", "USLAX"),
    ("CNSHA", "NLRTM"),
    ("SGSIN", "GBFXT"),
    ("HKHKG", "USLAX"),
    ("VNSGN", "KRPUS"),
    ("JPTYO", "USSEA"),
    ("THBKK", "DEHAM"),
]

CARRIERS = ["HMM", "MSC", "Maersk", "ONE", "Evergreen", "CMA CGM"]
CONTAINER_TYPES = ["20GP", "40GP", "40HC"]
MODES = ["ocean_fcl", "ocean_lcl", "air", "trucking"]

# Base rates per mode (relative multipliers)
MODE_BASE_RATES = {
    "ocean_fcl": 1.0,
    "ocean_lcl": 0.6,
    "air": 4.5,
    "trucking": 0.3,
}

# Transit days by mode
TRANSIT_DAYS = {
    "ocean_fcl": (14, 35),
    "ocean_lcl": (18, 42),
    "air": (2, 7),
    "trucking": (1, 5),
}


def seed_freight_indices(db):
    """Generate 180 days of freight index data using random walk."""
    print("Seeding freight indices...")

    # Delete existing seed data
    db.query(FreightIndex).filter(FreightIndex.source == "seed").delete()
    db.commit()

    today = date.today()
    start = today - timedelta(days=179)
    count = 0

    for code, cfg in INDEX_CONFIG.items():
        value = float(cfg["base"])
        vol = cfg["volatility"]

        for day_offset in range(180):
            d = start + timedelta(days=day_offset)
            # Random walk
            change = random.uniform(-vol, vol)
            value = max(value + change, cfg["base"] * 0.5)  # Floor at 50% of base
            prev_value = value - change
            if prev_value > 0:
                change_pct = round((change / prev_value) * 100, 2)
            else:
                change_pct = 0.0

            db.add(FreightIndex(
                index_code=code,
                index_name=cfg["name"],
                value=Decimal(str(round(value, 2))),
                change_pct=Decimal(str(change_pct)),
                recorded_at=d,
                source="seed",
            ))
            count += 1

    db.commit()
    print(f"  Created {count} freight index records")


def seed_route_rates(db):
    """Generate route rate data: 10 routes x 4 modes x 6 months."""
    print("Seeding route rates...")

    # Delete existing seed data
    db.query(RouteRate).filter(RouteRate.source == "seed").delete()
    db.commit()

    today = date.today()
    count = 0

    for origin, destination in ROUTES:
        # Base rate for this route (varies by route distance)
        route_base = random.uniform(1500, 3500)

        for mode in MODES:
            base_rate = route_base * MODE_BASE_RATES[mode]
            transit_min, transit_max = TRANSIT_DAYS[mode]

            # Generate monthly data for 6 months
            for month_offset in range(6):
                month_start = today - timedelta(days=(5 - month_offset) * 30)
                month_end = month_start + timedelta(days=29)

                # Multiple carriers per route/mode
                num_carriers = random.randint(2, 4)
                selected_carriers = random.sample(CARRIERS, num_carriers)

                for carrier in selected_carriers:
                    # Rate varies by carrier
                    carrier_rate = base_rate * random.uniform(0.85, 1.15)
                    # Slight monthly trend
                    carrier_rate *= 1 + (month_offset - 3) * 0.02

                    container = random.choice(CONTAINER_TYPES) if "ocean" in mode else None

                    db.add(RouteRate(
                        origin=origin,
                        destination=destination,
                        mode=mode,
                        carrier=carrier,
                        container_type=container,
                        rate_usd=Decimal(str(round(carrier_rate, 2))),
                        transit_days_min=transit_min + random.randint(0, 3),
                        transit_days_max=transit_max + random.randint(0, 5),
                        valid_from=month_start,
                        valid_to=month_end,
                        source="seed",
                    ))
                    count += 1

    db.commit()
    print(f"  Created {count} route rate records")


def main():
    print("=" * 50)
    print("Market Intelligence Seed Data")
    print("=" * 50)

    db = SessionLocal()
    try:
        seed_freight_indices(db)
        seed_route_rates(db)
        print("\nDone! Market data seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
