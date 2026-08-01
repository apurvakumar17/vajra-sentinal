from fastapi import APIRouter
from app.api.v1.endpoints import auth, telemetry

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
