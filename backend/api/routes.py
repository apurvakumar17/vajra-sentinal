import os
import time
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import FileResponse, JSONResponse
from models.schemas import CommandRequest, IncidentStatusUpdate
from services.db import db, log_audit
from api.auth import get_current_user

router = APIRouter()

@router.get("/dashboard/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    online = len([d for d in db["devices"] if d.get("status") == "online"])
    active = len(db["employees"])
    critical = len([a for a in db["alerts"] if a["severity"] == "Critical" and a["status"] != "resolved"])
    high_risk = len([e for e in db["employees"] if e["risk_score"] >= 70])
    avg_risk = sum(e["risk_score"] for e in db["employees"]) / max(1, len(db["employees"]))
    
    riskTrend = [
        {"time": "08:00", "risk": 20},
        {"time": "10:00", "risk": 22},
        {"time": "12:00", "risk": 35},
        {"time": "14:00", "risk": 40},
        {"time": "16:00", "risk": round(avg_risk)}
    ]
    loginTrend = [
        {"time": "08:00", "logins": 10},
        {"time": "10:00", "logins": 45},
        {"time": "12:00", "logins": 12},
        {"time": "14:00", "logins": 8},
        {"time": "16:00", "logins": 2}
    ]
    
    return {
        "onlineEndpoints": online,
        "activeEmployees": active,
        "criticalAlerts": critical,
        "highRiskEmployees": high_risk,
        "avgRisk": round(avg_risk),
        "riskTrend": riskTrend,
        "loginTrend": loginTrend
    }

@router.get("/employees")
async def get_employees(current_user: dict = Depends(get_current_user)):
    results = []
    for emp in db["employees"]:
        dev = next((d for d in db["devices"] if d["employee_id"] == emp["id"]), None)
        emp_copy = emp.copy()
        emp_copy["current_status"] = dev["status"] if dev else "offline"
        emp_copy["device_id"] = dev["hostname"] if dev else None
        results.append(emp_copy)
    return results

@router.get("/employees/{emp_id}")
async def get_employee(emp_id: str, current_user: dict = Depends(get_current_user)):
    emp = next((e for e in db["employees"] if e["id"] == emp_id), None)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    dev = next((d for d in db["devices"] if d["employee_id"] == emp_id), None)
    return {**emp, "device": dev, "baseline_profile": None, "risk_history": []}

@router.get("/endpoints")
async def get_endpoints(current_user: dict = Depends(get_current_user)):
    results = []
    for d in db["devices"]:
        emp = next((e for e in db["employees"] if e["id"] == d["employee_id"]), None)
        d_copy = d.copy()
        d_copy["employee_name"] = emp["full_name"] if emp else None
        results.append(d_copy)
    return results

@router.post("/endpoints/{device_id}/command")
async def send_command(device_id: str, req: CommandRequest, current_user: dict = Depends(get_current_user)):
    log_audit(current_user["id"], f"Executed {req.command} on endpoint", device_id)
    return {"status": "queued", "command": req.command, "message": f"Command {req.command} sent to device {device_id}"}

@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    return db["alerts"]

@router.get("/incidents")
async def get_incidents(current_user: dict = Depends(get_current_user)):
    results = []
    for inc in db["incidents"]:
        alert = next((a for a in db["alerts"] if a["id"] == inc["alert_id"]), None)
        emp = next((e for e in db["employees"] if e["id"] == inc["employee_id"]), None)
        results.append({**inc, "alert": alert, "employee": emp})
    return results

@router.put("/incidents/{incident_id}/status")
async def update_incident_status(incident_id: str, req: IncidentStatusUpdate, current_user: dict = Depends(get_current_user)):
    inc = next((i for i in db["incidents"] if i["id"] == incident_id), None)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc["status"] = req.status
    log_audit(current_user["id"], f"Updated incident status to {req.status}", inc["id"])
    return inc

@router.get("/policies")
async def get_policies(current_user: dict = Depends(get_current_user)):
    return db["policies"]

@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    return db["reports"]

@router.get("/employee/agent/download")
async def download_agent():
    file_path = os.path.join(os.getcwd(), "..", "frontend", "public", "downloads", "SentinelEndpointAgent.exe")
    if not os.path.exists(file_path):
        file_path = os.path.join(os.getcwd(), "frontend", "public", "downloads", "SentinelEndpointAgent.exe")
    if os.path.exists(file_path):
        return FileResponse(file_path, filename="SentinelEndpointAgent.exe")
    return JSONResponse(status_code=404, content={"detail": "Agent executable not found. Please run build.bat in the endpoint-agent directory first."})

async def verify_agent(authorization: str = Header(None)):
    if not authorization or authorization.split(' ')[1] != "secret_key_here":
        raise HTTPException(status_code=401, detail="Invalid agent secret")
    return True

@router.post("/agent/register")
async def agent_register(data: dict, verified: bool = Depends(verify_agent)):
    mac = data.get("mac_address")
    device = next((d for d in db["devices"] if d["mac"] == mac), None)
    if not device:
        device = {
            "id": f"DEV-{int(time.time()*1000)}",
            "employee_id": "EMP-003",
            "hostname": data.get("hostname"),
            "os": data.get("os_version"),
            "ip": data.get("ip_address"),
            "mac": mac,
            "ram": data.get("ram"),
            "cpu": data.get("cpu"),
            "antivirus_status": data.get("antivirus_status"),
            "firewall_status": data.get("firewall_status"),
            "agent_version": data.get("agent_version"),
            "status": "online",
            "last_heartbeat": datetime.utcnow().isoformat()
        }
        db["devices"].append(device)
    else:
        device["status"] = "online"
        device["last_heartbeat"] = datetime.utcnow().isoformat()
    return device

@router.post("/agent/heartbeat")
async def agent_heartbeat(data: dict, verified: bool = Depends(verify_agent)):
    device_id = data.get("device_id")
    device = next((d for d in db["devices"] if d["id"] == device_id or d["hostname"] == device_id), None)
    if device:
        device["status"] = "online"
        device["last_heartbeat"] = datetime.utcnow().isoformat()
    return {"commands": []}

@router.post("/agent/telemetry")
async def agent_telemetry(data: dict, verified: bool = Depends(verify_agent)):
    payload = data
    event_type = payload.get("event_type")
    
    db["telemetry"].insert(0, {
        "id": f"TEL-{int(time.time()*1000)}",
        "device_id": payload.get("device_id"),
        "event_type": event_type,
        "description": json.dumps(payload.get("data")),
        "timestamp": datetime.utcnow().isoformat()
    })
    
    if event_type == "USB_INSERTED":
        vol = payload.get("data", {}).get("volume_name", "Unknown")
        db["alerts"].insert(0, {
            "id": f"ALT-{int(time.time()*1000)}",
            "employee_id": "EMP-003",
            "severity": "Critical",
            "reason": "Unauthorized USB device inserted.",
            "confidence": "99%",
            "status": "open",
            "created_at": datetime.utcnow().isoformat(),
            "ai_reasoning": {"Reason": "USB Mass Storage insertion blocked by policy.", "Evidence": vol, "MITRE": "T1052.001 - Exfiltration Over USB", "Confidence": "99%"}
        })
    return {"success": True}
