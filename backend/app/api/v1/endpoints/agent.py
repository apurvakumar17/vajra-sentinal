from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.deps import get_current_user
from bson import ObjectId
import datetime

router = APIRouter()

def serialize_mongo_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.get("/", response_model=List[Dict[str, Any]])
async def get_agents(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    agents = await db.devices.find().to_list(length=100)
    return [serialize_mongo_doc(agent) for agent in agents]

@router.post("/{agent_id}/command")
async def send_command(agent_id: str, command: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    cmd_doc = {
        "agent_id": agent_id,
        "command": command.get("command"),
        "params": command.get("params", {}),
        "status": "pending",
        "timestamp": datetime.datetime.utcnow()
    }
    await db.commands.insert_one(cmd_doc)
    return {"message": "Command queued successfully"}

@router.get("/{agent_id}/commands")
async def get_commands(agent_id: str):
    # This endpoint is called by the agent to fetch pending commands. 
    # In production this should be protected by an Agent token, not user token.
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    commands = await db.commands.find({"agent_id": agent_id, "status": "pending"}).to_list(length=10)
    
    # Mark them as delivered
    for cmd in commands:
        await db.commands.update_one({"_id": cmd["_id"]}, {"$set": {"status": "delivered"}})
        
    return [serialize_mongo_doc(cmd) for cmd in commands]
