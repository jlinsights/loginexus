import uuid
from datetime import datetime

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


def _status_to_code(status: int) -> str:
    return {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
    }.get(status, "ERROR")


async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": getattr(request.state, "request_id", str(uuid.uuid4())[:8]),
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": _status_to_code(exc.status_code),
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": getattr(request.state, "request_id", str(uuid.uuid4())[:8]),
        },
    )
