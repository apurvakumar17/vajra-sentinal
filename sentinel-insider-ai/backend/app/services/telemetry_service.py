from app.core.database import get_db, get_redis
from app.schemas.telemetry import TelemetryBatch, Heartbeat

async def process_heartbeat(heartbeat: Heartbeat):
    db = get_db()
    if db is not None:
        # Update endpoint status in DB
        await db.endpoints.update_one(
            {"agent_id": heartbeat.agent_id},
            {"$set": {"hostname": heartbeat.hostname, "status": heartbeat.status, "last_heartbeat": heartbeat.timestamp}},
            upsert=True
        )
    redis = get_redis()
    if redis is not None:
        # Cache online status in Redis for quick access
        await redis.setex(f"agent:{heartbeat.agent_id}:status", 300, "online")

async def process_telemetry_batch(batch: TelemetryBatch):
    db = get_db()
    if db is not None:
        events_docs = [event.dict() for event in batch.events]
        if events_docs:
            await db.telemetry_events.insert_many(events_docs)
    
    # Normally here we would push events to a message queue or trigger the Event Processing Engine
