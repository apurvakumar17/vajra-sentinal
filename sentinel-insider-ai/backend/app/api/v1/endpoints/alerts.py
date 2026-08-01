from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.alert import AlertResponse
from bson import ObjectId

router = APIRouter()

def serialize_mongo_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    alerts = await db.alerts.find().sort("timestamp", -1).to_list(length=100)
    return [serialize_mongo_doc(alert) for alert in alerts]

@router.put("/{alert_id}/status")
async def update_alert_status(alert_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    try:
        obj_id = ObjectId(alert_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
        
    result = await db.alerts.update_one({"_id": obj_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found or status already set")
        
    return {"message": "Status updated successfully"}
