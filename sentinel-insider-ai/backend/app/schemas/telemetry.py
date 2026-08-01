from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime

class Heartbeat(BaseModel):
    agent_id: str
    hostname: str
    status: str
    timestamp: datetime = datetime.utcnow()

class TelemetryEvent(BaseModel):
    agent_id: str
    event_type: str
    payload: Dict[str, Any]
    timestamp: datetime = datetime.utcnow()

class TelemetryBatch(BaseModel):
    agent_id: str
    events: List[TelemetryEvent]
