from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def upgrade():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6)"))
        conn.execute(text("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6)"))
        print("Migrated shipments table with lat/lon columns")

if __name__ == "__main__":
    upgrade()
