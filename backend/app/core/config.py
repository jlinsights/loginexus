from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    # --- Application ---
    PROJECT_NAME: str = "LogiNexus API"
    API_VERSION: str = "v1"
    DEMO_MODE: bool = Field(default=True, description="Bypass auth for demo")
    DEBUG: bool = False

    # --- Database ---
    DATABASE_URL: str = "postgresql://jaehong@localhost/loginexus"

    # --- Auth ---
    SECRET_KEY: str = Field(default="change-me-in-production", min_length=16)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # --- CORS ---
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://loginexus.vercel.app",
        "https://loginexus.com",
    ]

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 100

    # --- Blockchain ---
    BLOCKCHAIN_RPC_URL: str = Field(
        default="https://sepolia.infura.io/v3/YOUR_KEY",
        alias="SEPOLIA_RPC_URL",
    )
    CHAIN_ID: int = 11155111
    ORACLE_PRIVATE_KEY: str = ""
    ORACLE_ADDRESS: str = ""
    ESCROW_CONTRACT_ADDRESS: str = Field(
        default="",
        alias="NEXT_PUBLIC_LOGISTICS_ESCROW_ADDRESS",
    )

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json | console

    # Minimal ABI for Oracle functions (not from env, kept as class attr)
    ESCROW_ABI: list = [
        {
            "inputs": [{"internalType": "string", "name": "_trackingNumber", "type": "string"}],
            "name": "confirmArrival",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "inputs": [{"internalType": "string", "name": "_trackingNumber", "type": "string"}],
            "name": "refundBuyer",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        },
    ]

    model_config = {
        "env_file": ".env.local",
        "env_file_encoding": "utf-8",
        "populate_by_name": True,
    }


settings = Settings()
