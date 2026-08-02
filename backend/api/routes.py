import os
import time
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import FileResponse, JSONResponse
from models.schemas import CommandRequest, IncidentStatusUpdate
from services.db import db, log_audit
from api.auth import get_current_user
from websocket.socket import manager

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
    task = {
        "id": f"TSK-{int(time.time()*1000)}",
        "device_id": device_id,
        "command": req.command,
        "status": "Pending",
        "created_at": datetime.utcnow().isoformat(),
        "created_by": current_user["id"]
    }
    db["tasks"].append(task)
    log_audit(current_user["id"], f"Executed {req.command} on endpoint", device_id)
    return {"status": "queued", "task_id": task["id"], "command": req.command, "message": f"Command {req.command} sent to device {device_id}"}

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
    device_id = payload.get("device_id")
    
    tel = {
        "id": f"TEL-{int(time.time()*1000)}",
        "device_id": device_id,
        "event_type": event_type,
        "description": json.dumps(payload.get("data")),
        "timestamp": datetime.utcnow().isoformat()
    }
    db["telemetry"].insert(0, tel)
    await manager.broadcast({"type": "telemetry", "data": tel})
    
    device = next((d for d in db["devices"] if d["id"] == device_id), None)
    employee_id = device["employee_id"] if device else "EMP-003"
    
    def add_alert(reason, severity, mitre):
        alert = {
            "id": f"ALT-{int(time.time()*1000)}",
            "employee_id": employee_id,
            "severity": severity,
            "reason": reason,
            "confidence": "99%",
            "status": "open",
            "created_at": datetime.utcnow().isoformat(),
            "ai_reasoning": {"Reason": reason, "Evidence": "Telemetry data", "MITRE": mitre, "Confidence": "99%"}
        }
        db["alerts"].insert(0, alert)
        # Update risk score
        emp = next((e for e in db["employees"] if e["id"] == employee_id), None)
        if emp:
            emp["risk_score"] = min(100, emp.get("risk_score", 0) + (15 if severity == "Critical" else 5))
            db["risk_history"].append({
                "employee_id": employee_id,
                "score": emp["risk_score"],
                "timestamp": datetime.utcnow().isoformat()
            })
            
    if event_type == "USB_INSERTED":
        add_alert("Unauthorized USB device inserted.", "Critical", "T1052.001 - Exfiltration Over USB")
    elif event_type == "MASS_FILE_DELETION":
        add_alert("Mass file deletion detected.", "Critical", "T1485 - Data Destruction")
    elif event_type == "POWERSHELL_ABUSE":
        add_alert("Suspicious PowerShell execution.", "High", "T1059.001 - PowerShell")
    elif event_type == "SUSPICIOUS_LOGIN":
        add_alert("Login from unusual location/time.", "Medium", "T1078 - Valid Accounts")
    
    return {"success": True}

@router.post("/agent/events")
async def agent_events(data: dict, verified: bool = Depends(verify_agent)):
    events = data.get("events", [])
    for ev in events:
        tel = {
            "id": f"TEL-{int(time.time()*1000)}",
            "device_id": data.get("device_id"),
            "event_type": ev.get("type"),
            "description": json.dumps(ev.get("data")),
            "timestamp": ev.get("timestamp", datetime.utcnow().isoformat())
        }
        db["telemetry"].insert(0, tel)
        await manager.broadcast({"type": "telemetry", "data": tel})
    return {"success": True, "processed": len(events)}

@router.get("/agent/tasks")
async def get_agent_tasks(device_id: str, verified: bool = Depends(verify_agent)):
    tasks = [t for t in db["tasks"] if t["device_id"] == device_id and t["status"] == "Pending"]
    for t in tasks:
        t["status"] = "Dispatched"
    return {"tasks": tasks}

@router.post("/agent/task/result")
async def agent_task_result(data: dict, verified: bool = Depends(verify_agent)):
    task_id = data.get("task_id")
    task = next((t for t in db["tasks"] if t["id"] == task_id), None)
    if task:
        task["status"] = data.get("status", "Completed")
        db["task_results"].append({
            "task_id": task_id,
            "device_id": data.get("device_id"),
            "result": data.get("result"),
            "timestamp": datetime.utcnow().isoformat()
        })
    return {"success": True}

@router.post("/agent/screenshot")
async def agent_screenshot(data: dict, verified: bool = Depends(verify_agent)):
    # normally a file upload, but base64 for simplicity
    device_id = data.get("device_id")
    # store in db or filesystem
    return {"success": True}

@router.post("/agent/logs")
async def agent_logs(data: dict, verified: bool = Depends(verify_agent)):
    # store logs
    return {"success": True}

@router.get("/endpoint/status")
async def endpoint_status(device_id: str, current_user: dict = Depends(get_current_user)):
    device = next((d for d in db["devices"] if d["id"] == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.get("/endpoint/live")
async def endpoint_live(device_id: str, current_user: dict = Depends(get_current_user)):
    # return live telemetry
    telemetry = [t for t in db["telemetry"] if t.get("device_id") == device_id][:50]
    return {"telemetry": telemetry}

from models.schemas import AlertStatusUpdate, EmployeeCreate

@router.post("/employees")
async def create_employee(req: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    new_emp = {
        "id": f"EMP-{int(time.time()*1000)}",
        "full_name": req.full_name,
        "department": req.department,
        "role": req.role,
        "risk_score": 0,
        "status": "active"
    }
    db["employees"].append(new_emp)
    log_audit(current_user["id"], "Created new employee", new_emp["id"])
    return new_emp

@router.put("/alerts/{alert_id}/status")
async def update_alert_status(alert_id: str, req: AlertStatusUpdate, current_user: dict = Depends(get_current_user)):
    alert = next((a for a in db["alerts"] if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["status"] = req.status
    log_audit(current_user["id"], f"Updated alert status to {req.status}", alert["id"])
    return alert
