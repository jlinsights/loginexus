import os
from datetime import datetime
from ..core.config import settings


class StorageBackend:
    """File storage abstraction for POD photos. Local filesystem for v1."""

    def __init__(self):
        self.storage_path = settings.POD_STORAGE_PATH
        os.makedirs(self.storage_path, exist_ok=True)

    def save_file(self, content: bytes, tracking_number: str, index: int,
                  content_type: str = "image/jpeg") -> str:
        """Save file to disk and return relative URL path."""
        timestamp = int(datetime.utcnow().timestamp())
        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        filename = f"{tracking_number}_{timestamp}_{index}.{ext}"
        filepath = os.path.join(self.storage_path, filename)

        with open(filepath, 'wb') as f:
            f.write(content)

        return f"/uploads/pod/{filename}"

    def delete_files(self, urls: list):
        """Delete files by URL paths."""
        for url in urls:
            filepath = os.path.join('.', url.lstrip('/'))
            if os.path.exists(filepath):
                os.remove(filepath)


storage = StorageBackend()
