from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AlertBase(BaseModel):
    employee_id: str
    severity: str
    reason: str
    status: str = "open"

class AlertResponse(AlertBase):
    id: str
    timestamp: datetime
    evidence: Optional[str] = None
    mitre_t_code: Optional[str] = None
    confidence: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
