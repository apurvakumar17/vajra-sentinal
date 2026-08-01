from fastapi import APIRouter
from app.api.v1.endpoints import auth, telemetry, employees, alerts, agent

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(agent.router, prefix="/agents", tags=["agents"])
