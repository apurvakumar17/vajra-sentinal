from fastapi import APIRouter, Depends, HTTPException
from app.schemas.telemetry import Heartbeat, TelemetryBatch
from app.services import telemetry_service
import asyncio

router = APIRouter()

@router.post("/heartbeat")
async def receive_heartbeat(heartbeat: Heartbeat):
    await telemetry_service.process_heartbeat(heartbeat)
    return {"status": "received"}

@router.post("/events")
async def receive_events(batch: TelemetryBatch):
    await telemetry_service.process_telemetry_batch(batch)
    return {"status": "received", "count": len(batch.events)}
