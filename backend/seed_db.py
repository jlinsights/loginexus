from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
import uuid
import datetime

# Create Tables
models.Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # Check if data exists
    if db.query(models.Tenant).first():
        print("Data already seeded.")
        return

    # 1. Create Tenant
    tenant_id = uuid.uuid4()
    tenant = models.Tenant(
        id=tenant_id,
        name="Maersk Line",
        subdomain="maersk",
        logo_url="https://upload.wikimedia.org/wikipedia/commons/e/e6/Maersk_Group_Logo.svg",
        primary_color="bg-blue-600",
        contact_email="support@maersk.com"
    )
    db.add(tenant)
    db.commit()

    # 2. Create Shipment
    shipment_id = uuid.uuid4()
    shipment = models.Shipment(
        id=shipment_id,
        tenant_id=tenant_id,
        tracking_number="SHP-12345678",
        container_number="MSKU1234567",
        vessel_name="Maersk Mc-Kinney Moller",
        origin="Shanghai Port",
        destination="Rotterdam Port",
        current_status="In Transit",
        latitude=31.2304,
        longitude=121.4737,
        eta=datetime.datetime.now() + datetime.timedelta(days=14)
    )
    db.add(shipment)
    db.commit()

    # 3. Create Escrow
    escrow = models.PaymentEscrow(
        shipment_id=shipment_id,
        buyer_wallet_address="0x123...",
        seller_wallet_address="0x456...",
        amount_usdc=5000.00,
        is_locked=True
    )
    db.add(escrow)
    db.commit()

    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()
