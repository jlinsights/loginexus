import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(dotenv_path=".env.local")

# Adjusted to match the running local environment
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://jaehong@localhost/loginexus"
)

# 1. DB Engine Creation
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 2. Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base Model
Base = declarative_base()

# 4. Dependency Injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
