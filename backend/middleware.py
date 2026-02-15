from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/" or request.url.path == "/health":
            return await call_next(request)

        # 1. Extract Host Header
        host = request.headers.get("host", "")
        
        # 2. Parse Subdomain (e.g., maersk.loginexus.com -> maersk)
        # Handle localhost:3000 cases or naked domains
        tenant_id = "default"
        if "." in host:
            parts = host.split(".")
            # Assuming format: {subdomain}.domain.com
            # If localhost handling is needed: {subdomain}.localhost
            if len(parts) >= 2: # simple check
                 # Logic for localhost vs production domain
                 # Production: sub.domain.com (3 parts) -> parts[0]
                 # Localhost: sub.localhost (2 parts) -> parts[0]
                 candidate = parts[0]
                 if candidate not in ["www", "api", "localhost", "127"]:
                     tenant_id = candidate

        # 3. Store in request state for API usage
        request.state.tenant_id = tenant_id
        
        # Optional: Reject if tenant not found in DB (Simulated here)
        # valid_tenants = ["maersk", "msc", "default"]
        # if tenant_id not in valid_tenants:
        #    return Response("Tenant not found", status_code=404)

        response = await call_next(request)
        return response
