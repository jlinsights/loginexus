import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from .. import models
from ..core.config import settings
from ..core.storage import storage

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


class PODService:
    """Business logic for POD operations."""

    @staticmethod
    def upload_pod(
        db: Session,
        tracking_number: str,
        signature: str,
        latitude: float,
        longitude: float,
        accuracy: Optional[float],
        receiver_name: str,
        receiver_contact: Optional[str],
        photo_contents: list[tuple[bytes, str]],  # [(content, content_type), ...]
    ) -> dict:
        """Process POD upload: validate, store files, update shipment."""
        # 1. Find shipment
        shipment = db.query(models.Shipment).filter(
            models.Shipment.tracking_number == tracking_number
        ).first()
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")

        # 2. Check not already submitted
        if shipment.pod_status is not None:
            raise HTTPException(
                status_code=409,
                detail="POD already submitted for this shipment"
            )

        # 3. Validate photo count
        max_photos = settings.POD_MAX_PHOTOS
        if len(photo_contents) > max_photos:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {max_photos} photos allowed"
            )

        # 4. Validate MIME types
        for i, (_, content_type) in enumerate(photo_contents):
            if content_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Photo {i+1} has invalid type '{content_type}'. Allowed: JPEG, PNG, WebP"
                )

        # 5. Validate file sizes
        max_size = settings.POD_MAX_FILE_SIZE_MB * 1024 * 1024
        for i, (content, _) in enumerate(photo_contents):
            if len(content) > max_size:
                raise HTTPException(
                    status_code=413,
                    detail=f"Photo {i+1} exceeds {settings.POD_MAX_FILE_SIZE_MB}MB limit"
                )

        # 5. Save photos via storage
        photo_urls = []
        for i, (content, content_type) in enumerate(photo_contents):
            url = storage.save_file(content, tracking_number, i, content_type)
            photo_urls.append(url)

        # 6. Update shipment
        now = datetime.utcnow()
        shipment.pod_signature = signature
        shipment.pod_photos = photo_urls
        shipment.pod_location = {
            "lat": latitude,
            "lng": longitude,
            "accuracy": accuracy,
        }
        shipment.pod_timestamp = now
        shipment.pod_status = "submitted"
        shipment.pod_receiver_name = receiver_name
        shipment.pod_receiver_contact = receiver_contact
        shipment.current_status = "Delivered"

        db.commit()
        db.refresh(shipment)

        # 7. Audit log
        try:
            log = models.AuditLog(
                entity_type="SHIPMENT",
                entity_id=shipment.id,
                action="POD_UPLOAD",
                new_value={
                    "tracking": tracking_number,
                    "status": "Delivered",
                    "pod_status": "submitted",
                    "receiver": receiver_name,
                    "photo_count": len(photo_urls),
                },
                performed_by="DRIVER_APP",
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to audit POD upload: {e}")

        return {
            "message": "POD uploaded successfully",
            "status": "Delivered",
            "pod_status": "submitted",
            "tracking_number": tracking_number,
            "pod_timestamp": now,
            "photo_count": len(photo_urls),
        }

    @staticmethod
    def get_pod(db: Session, tracking_number: str) -> dict:
        """Retrieve POD details for a shipment."""
        shipment = db.query(models.Shipment).filter(
            models.Shipment.tracking_number == tracking_number
        ).first()
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        if shipment.pod_status is None:
            raise HTTPException(status_code=404, detail="No POD submitted for this shipment")

        return {
            "tracking_number": shipment.tracking_number,
            "pod_status": shipment.pod_status,
            "pod_signature": shipment.pod_signature,
            "pod_photos": shipment.pod_photos or [],
            "pod_location": shipment.pod_location,
            "pod_timestamp": shipment.pod_timestamp,
            "pod_receiver_name": shipment.pod_receiver_name,
            "pod_receiver_contact": shipment.pod_receiver_contact,
            "pod_notes": shipment.pod_notes,
            "pod_verified_at": shipment.pod_verified_at,
            "pod_verified_by": shipment.pod_verified_by,
            "shipment_origin": shipment.origin,
            "shipment_destination": shipment.destination,
            "current_status": shipment.current_status,
        }

    @staticmethod
    def verify_pod(
        db: Session,
        tracking_number: str,
        action: str,
        notes: Optional[str],
        verified_by: str = "admin",
    ) -> dict:
        """Verify or dispute a POD submission."""
        if action not in ("verify", "dispute"):
            raise HTTPException(status_code=400, detail="Action must be 'verify' or 'dispute'")

        shipment = db.query(models.Shipment).filter(
            models.Shipment.tracking_number == tracking_number
        ).first()
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        if shipment.pod_status is None:
            raise HTTPException(status_code=404, detail="No POD submitted for this shipment")
        if shipment.pod_status != "submitted":
            raise HTTPException(
                status_code=409,
                detail=f"POD already {shipment.pod_status}. Cannot modify after verification."
            )

        now = datetime.utcnow()
        new_status = "verified" if action == "verify" else "disputed"
        shipment.pod_status = new_status
        shipment.pod_notes = notes
        shipment.pod_verified_at = now
        shipment.pod_verified_by = verified_by

        db.commit()
        db.refresh(shipment)

        # Audit log
        try:
            log = models.AuditLog(
                entity_type="SHIPMENT",
                entity_id=shipment.id,
                action=f"POD_{action.upper()}",
                new_value={
                    "tracking": tracking_number,
                    "pod_status": new_status,
                    "notes": notes,
                    "verified_by": verified_by,
                },
                performed_by=verified_by,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to audit POD verification: {e}")

        return {
            "tracking_number": tracking_number,
            "pod_status": new_status,
            "pod_verified_at": now,
            "pod_verified_by": verified_by,
            "pod_notes": notes,
        }

    @staticmethod
    def list_pods(
        db: Session,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> dict:
        """List shipments with POD data, with filtering and pagination."""
        query = db.query(models.Shipment).filter(
            models.Shipment.pod_status.isnot(None)
        )

        if status_filter:
            query = query.filter(models.Shipment.pod_status == status_filter)

        total = query.count()
        offset = (page - 1) * limit
        shipments = query.order_by(
            models.Shipment.pod_timestamp.desc()
        ).offset(offset).limit(limit).all()

        items = []
        for s in shipments:
            photo_count = len(s.pod_photos) if s.pod_photos else 0
            items.append({
                "tracking_number": s.tracking_number,
                "origin": s.origin,
                "destination": s.destination,
                "pod_status": s.pod_status,
                "pod_timestamp": s.pod_timestamp,
                "pod_receiver_name": s.pod_receiver_name,
                "photo_count": photo_count,
                "current_status": s.current_status,
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
        }

    @staticmethod
    def get_pod_receipt(db: Session, tracking_number: str) -> dict:
        """Public read-only POD receipt data."""
        shipment = db.query(models.Shipment).filter(
            models.Shipment.tracking_number == tracking_number
        ).first()
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        if shipment.pod_status is None:
            raise HTTPException(status_code=404, detail="No POD submitted for this shipment")

        photo_count = len(shipment.pod_photos) if shipment.pod_photos else 0
        return {
            "tracking_number": shipment.tracking_number,
            "pod_status": shipment.pod_status,
            "pod_timestamp": shipment.pod_timestamp,
            "pod_receiver_name": shipment.pod_receiver_name,
            "pod_location": shipment.pod_location,
            "photo_count": photo_count,
            "origin": shipment.origin,
            "destination": shipment.destination,
            "verified": shipment.pod_status == "verified",
            "verified_at": shipment.pod_verified_at,
        }
