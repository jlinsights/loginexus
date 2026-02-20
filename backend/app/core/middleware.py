import time
import uuid

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow health checks to bypass
        if request.url.path in ("/health", "/api/health", "/api/health/ready"):
            return await call_next(request)

        # Get Host header
        host = request.headers.get("host", "")

        # Default tenant
        tenant_id = "default"

        # Subdomain extraction logic
        if "." in host:
            parts = host.split(".")
            # Localhost handling: tenant.localhost:8000
            if len(parts) >= 2:
                candidate = parts[0]
                # Filter out common non-tenant subdomains
                if candidate not in ["www", "api", "localhost", "127"]:
                    tenant_id = candidate

        # Force tenant via Header (useful for testing/API clients)
        if "x-tenant-id" in request.headers:
            tenant_id = request.headers.get("x-tenant-id")

        # Set tenant_id in request state
        request.state.tenant_id = tenant_id

        response = await call_next(request)
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        logger = structlog.get_logger()
        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        tenant_id = getattr(request.state, "tenant_id", "unknown")

        logger.info(
            "request_completed",
            status_code=response.status_code,
            duration_ms=duration_ms,
            tenant_id=tenant_id,
        )

        response.headers["X-Request-ID"] = request_id
        return response
