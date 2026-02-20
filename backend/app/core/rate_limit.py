from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from .config import settings


def _get_tenant_or_ip(request: Request) -> str:
    """Rate limit key: tenant_id if available, otherwise IP."""
    tenant_id = getattr(request.state, "tenant_id", None)
    if tenant_id and tenant_id != "default":
        return f"tenant:{tenant_id}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_tenant_or_ip)
