"""
Background service that polls on-chain escrow events and updates the DB.
Uses web3.py to read ShipmentEscrow contract events (Funded, Released, Disputed, Refunded).
"""
import asyncio
import logging
import os
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from web3 import Web3

from ..database import SessionLocal
from ..models import PaymentEscrow

logger = logging.getLogger(__name__)

# ShipmentEscrow event ABIs (minimal for decoding)
ESCROW_EVENTS_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "buyer", "type": "address"},
            {"indexed": False, "name": "amount", "type": "uint256"},
        ],
        "name": "Funded",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "seller", "type": "address"},
            {"indexed": False, "name": "amount", "type": "uint256"},
        ],
        "name": "Released",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "buyer", "type": "address"},
        ],
        "name": "Disputed",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "buyer", "type": "address"},
            {"indexed": False, "name": "amount", "type": "uint256"},
        ],
        "name": "Refunded",
        "type": "event",
    },
]


class EscrowEventSync:
    def __init__(self):
        rpc_url = os.getenv("SEPOLIA_RPC_URL", "")
        if not rpc_url:
            logger.warning("SEPOLIA_RPC_URL not set; escrow sync disabled")
            self.w3 = None
            return
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.poll_interval = int(os.getenv("ESCROW_SYNC_INTERVAL", "30"))
        self._last_block: dict[str, int] = {}

    async def start(self):
        """Main polling loop."""
        if not self.w3:
            logger.info("Escrow sync skipped (no RPC URL)")
            return
        logger.info("Escrow event sync started (interval=%ds)", self.poll_interval)
        while True:
            try:
                self._sync_all()
            except Exception:
                logger.exception("Escrow sync error")
            await asyncio.sleep(self.poll_interval)

    def _sync_all(self):
        db: Session = SessionLocal()
        try:
            escrows = (
                db.query(PaymentEscrow)
                .filter(
                    PaymentEscrow.escrow_contract_address.isnot(None),
                    PaymentEscrow.status.in_(["created", "funded", "disputed"]),
                )
                .all()
            )
            for escrow in escrows:
                try:
                    self._sync_single(db, escrow)
                except Exception:
                    logger.exception("Error syncing escrow %s", escrow.id)
        finally:
            db.close()

    def _sync_single(self, db: Session, escrow: PaymentEscrow):
        addr = escrow.escrow_contract_address
        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(addr),
            abi=ESCROW_EVENTS_ABI,
        )
        from_block = self._last_block.get(addr, max(0, self.w3.eth.block_number - 1000))

        for event_name, handler in [
            ("Funded", self._handle_funded),
            ("Released", self._handle_released),
            ("Disputed", self._handle_disputed),
            ("Refunded", self._handle_refunded),
        ]:
            try:
                event_filter = getattr(contract.events, event_name)
                logs = event_filter.get_logs(fromBlock=from_block)
                for log in logs:
                    handler(db, escrow, log)
            except Exception:
                logger.exception("Error processing %s for %s", event_name, addr)

        self._last_block[addr] = self.w3.eth.block_number

    def _handle_funded(self, db: Session, escrow: PaymentEscrow, log):
        if escrow.status != "created":
            return
        escrow.status = "funded"
        escrow.is_locked = True
        escrow.tx_hash_deposit = log.transactionHash.hex()
        escrow.funded_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Escrow %s funded (tx=%s)", escrow.id, escrow.tx_hash_deposit)

    def _handle_released(self, db: Session, escrow: PaymentEscrow, log):
        if escrow.status not in ("funded", "disputed"):
            return
        escrow.status = "released"
        escrow.is_locked = False
        escrow.tx_hash_release = log.transactionHash.hex()
        escrow.resolved_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Escrow %s released (tx=%s)", escrow.id, escrow.tx_hash_release)

    def _handle_disputed(self, db: Session, escrow: PaymentEscrow, log):
        if escrow.status != "funded":
            return
        escrow.status = "disputed"
        escrow.tx_hash_dispute = log.transactionHash.hex()
        db.commit()
        logger.info("Escrow %s disputed (tx=%s)", escrow.id, escrow.tx_hash_dispute)

    def _handle_refunded(self, db: Session, escrow: PaymentEscrow, log):
        if escrow.status != "disputed":
            return
        escrow.status = "refunded"
        escrow.is_locked = False
        escrow.tx_hash_refund = log.transactionHash.hex()
        escrow.resolved_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Escrow %s refunded (tx=%s)", escrow.id, escrow.tx_hash_refund)
