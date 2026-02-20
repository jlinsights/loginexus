import asyncio
import logging
import time
from sqlalchemy.orm import Session
from web3 import Web3
from .. import models, database
from ..core.config import settings

logger = logging.getLogger(__name__)

class OracleService:
    def __init__(self):
        if not settings.ORACLE_PRIVATE_KEY or not settings.ESCROW_CONTRACT_ADDRESS:
            logger.warning("Oracle Service disabled: Missing Private Key or Contract Address")
            self.w3 = None
            return

        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        self.account = self.w3.eth.account.from_key(settings.ORACLE_PRIVATE_KEY)
        self.contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(settings.ESCROW_CONTRACT_ADDRESS), 
            abi=settings.ESCROW_ABI
        )
        self.poll_interval = 60 # Check every minute

    async def start(self):
        if not self.w3:
            return
        
        logger.info(f"Oracle Service started. Oracle Address: {self.account.address}")
        
        while True:
            try:
                self.check_and_release_payments()
            except Exception as e:
                logger.error(f"Oracle Service Loop Error: {str(e)}")
            
            await asyncio.sleep(self.poll_interval)

    def check_and_release_payments(self):
        """
        Main logic to check for delivered shipments and release escrow funds.
        """
        db: Session = database.SessionLocal()
        try:
            # Find locked escrows that need validation
            # (In a real app, we might check 'AWAITING_DELIVERY' status from DB or Chain)
            # Here we query DB for locked payments
            locked_escrows = db.query(models.PaymentEscrow).join(models.Shipment).filter(
                models.PaymentEscrow.is_locked == True,
                models.PaymentEscrow.status == "funded" # Only verify funded escrows
            ).all()

            for escrow in locked_escrows:
                tracking_number = escrow.shipment.tracking_number
                
                # A. Simulation Check (Replace with real Carrier API)
                is_delivered = self.call_carrier_api_for_status(tracking_number)

                if is_delivered:
                    logger.info(f"Shipment {tracking_number} confirmed delivered. Releasing payment...")
                    self.process_release(db, escrow, tracking_number)

        finally:
            db.close()

    def process_release(self, db: Session, escrow: models.PaymentEscrow, tracking_number: str):
        try:
            # B. Build & Sign Transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            txn = self.contract.functions.confirmArrival(
                tracking_number
            ).build_transaction({
                'chainId': settings.CHAIN_ID,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })

            signed_txn = self.w3.eth.account.sign_transaction(txn, settings.ORACLE_PRIVATE_KEY)
            
            # C. Send Transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            tx_hash_hex = tx_hash.hex()
            logger.info(f"Confirmed Arrival! TX Hash: {tx_hash_hex}")

            # D. Update DB Status
            # Note: Status becomes 'arrived_at_destination' in DB or similar, 
            # Smart Contract status becomes ARRIVED. 
            # Final release requires Buyer to have the NFT.
            escrow.status = "arrived" 
            escrow.tx_hash_release = tx_hash_hex # Re-using field for the oracle tx
            db.commit()

        except Exception as e:
            logger.error(f"Failed to confirm arrival for {tracking_number}: {str(e)}")

    def call_carrier_api_for_status(self, tracking_number: str) -> bool:
        """
        Mock Carrier API. 
        Returns True if tracking number ends with '88' (simulation for demo).
        """
        # For demo purposes, let's say shipment is delivered if it ends with '88'
        if tracking_number.endswith("88"):
            return True
        return False

    def confirm_delivery(self, tracking_number: str):
        """
        Public method to be called by API when POD is uploaded.
        Triggers immediate blockchain settlement.
        """
        logger.info(f"Manual/API trigger for delivery confirmation: {tracking_number}")
        
        db: Session = database.SessionLocal()
        try:
            escrow = db.query(models.PaymentEscrow).join(models.Shipment).filter(
                models.Shipment.tracking_number == tracking_number,
                models.PaymentEscrow.is_locked == True,
                models.PaymentEscrow.status == "funded"
            ).first()

            if escrow:
                logger.info(f"Found funded escrow for {tracking_number}. Processing release...")
                self.process_release(db, escrow, tracking_number)
            else:
                logger.warning(f"No funded/locked escrow found for {tracking_number} to release.")
        except Exception as e:
            logger.error(f"Error in confirm_delivery for {tracking_number}: {e}")
        finally:
            db.close()
