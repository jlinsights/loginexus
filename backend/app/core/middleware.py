from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow health checks to bypass 
        if request.url.path == "/health":
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
        
        # (Optional) Log for debugging
        # print(f"Request to {host} mapped to tenant: {tenant_id}")

        response = await call_next(request)
        return response
