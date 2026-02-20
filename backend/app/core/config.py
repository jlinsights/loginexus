
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

class Settings:
    PROJECT_NAME: str = "LogiNexus API"
    
    # Blockchain
    BLOCKCHAIN_RPC_URL: str = os.getenv("SEPOLIA_RPC_URL", "https://sepolia.infura.io/v3/YOUR_KEY")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "11155111"))
    
    # Oracle / Admin Wallet
    ORACLE_PRIVATE_KEY: str = os.getenv("ORACLE_PRIVATE_KEY", "")
    ORACLE_ADDRESS: str = os.getenv("ORACLE_ADDRESS", "")
    
    # Smart Contracts
    ESCROW_CONTRACT_ADDRESS: str = os.getenv("NEXT_PUBLIC_LOGISTICS_ESCROW_ADDRESS", "")
    
    # Minimal ABI for Oracle functions (confirmArrival, refundBuyer)
    ESCROW_ABI: list = [
        {
            "inputs": [{"internalType": "string", "name": "_trackingNumber", "type": "string"}],
            "name": "confirmArrival",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "string", "name": "_trackingNumber", "type": "string"}],
            "name": "refundBuyer",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

settings = Settings()
