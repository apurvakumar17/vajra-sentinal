import os
import time
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import FileResponse, JSONResponse
from models.schemas import CommandRequest, IncidentStatusUpdate, AlertStatusUpdate, EmployeeCreate, NotificationReadRequest, TaskLockRequest, TaskLogoutRequest, TaskKillProcessRequest, TaskCollectForensicsRequest, TaskRestartAgentRequest, TaskResultRequest, PolicyCreate, PolicyUpdate, ReportGenerateRequest, IncidentUpdate
from services.db import db, log_audit, create_notification
from api.auth import get_current_user
from websocket.socket import manager

router = APIRouter()

@router.get("/notifications")
async def get_notifications(
    type: str = None, 
    severity: str = None, 
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    # Check for agent heartbeat timeouts dynamically
    for d in db.get("devices", []):
        if d.get("status") == "online" and d.get("last_heartbeat"):
            try:
                hb_time = datetime.fromisoformat(d["last_heartbeat"])
                if (datetime.utcnow() - hb_time).total_seconds() > 300:
                    d["status"] = "offline"
                    # Notify once if offline notification doesn't exist recently
                    notif_exists = any(
                        n.get("type") == "Endpoint" and n.get("device_id") == d["id"] and "heartbeat" in n.get("title", "").lower()
                        for n in db.get("notifications", [])[:10]
                    )
                    if not notif_exists:
                        await create_notification(
                            title="Agent Missed Heartbeat",
                            message=f"Endpoint {d.get('hostname')} ({d.get('ip')}) went offline due to missed agent heartbeat.",
                            type="Endpoint",
                            severity="Medium",
                            device_id=d.get("id"),
                            related_endpoint=d.get("hostname"),
                            link="/endpoints"
                        )
            except Exception:
                pass

    notifications = db.get("notifications", [])
    if unread_only:
        notifications = [n for n in notifications if not n.get("read", False)]
    if type and type != "All":
        notifications = [n for n in notifications if n.get("type", "").lower() == type.lower()]
    if severity and severity != "All":
        notifications = [n for n in notifications if n.get("severity", "").lower() == severity.lower()]
    
    return notifications

@router.post("/notifications/read")
async def mark_notification_read(req: NotificationReadRequest, current_user: dict = Depends(get_current_user)):
    if req.id:
        notif = next((n for n in db.get("notifications", []) if n["id"] == req.id), None)
        if notif:
            notif["read"] = True
            return {"status": "success", "id": req.id}
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "no_op"}

@router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    for n in db.get("notifications", []):
        n["read"] = True
    return {"status": "success", "message": "All notifications marked as read"}

@router.delete("/notifications/{id}")
async def delete_notification(id: str, current_user: dict = Depends(get_current_user)):
    db["notifications"] = [n for n in db.get("notifications", []) if n.get("id") != id]
    return {"status": "success", "id": id}


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
    emp_tasks = [t for t in db.get("tasks", []) if t.get("employee_id") == emp_id or (dev and t.get("device_id") == dev.get("id"))]
    emp_audits = [a for a in db.get("audit_logs", []) if a.get("employee_id") == emp_id or (dev and a.get("device_id") == dev.get("id"))]
    return {
        **emp,
        "device": dev,
        "tasks": emp_tasks,
        "audit_logs": emp_audits,
        "last_command": emp.get("last_command") or (dev.get("last_command") if dev else None),
        "last_execution_time": emp.get("last_execution_time") or (dev.get("last_execution_time") if dev else None),
        "baseline_profile": None,
        "risk_history": []
    }

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
    
    await create_notification(
        title="Admin Command Dispatched",
        message=f"Command '{req.command}' issued to endpoint {device_id}.",
        type="System",
        severity="Info",
        device_id=device_id,
        related_endpoint=device_id,
        link="/endpoints"
    )
    
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

@router.put("/incidents/{incident_id}")
async def update_incident(incident_id: str, req: IncidentUpdate, current_user: dict = Depends(get_current_user)):
    incident = next((i for i in db["incidents"] if i["id"] == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if req.status is not None:
        incident["status"] = req.status
    if req.assigned_to is not None:
        incident["assigned_to"] = req.assigned_to
    if req.notes is not None:
        incident["notes"] = req.notes
    
    incident["updated_at"] = datetime.utcnow().isoformat()
    return incident

@router.put("/incidents/{incident_id}/status")
async def update_incident_status(incident_id: str, req: IncidentStatusUpdate, current_user: dict = Depends(get_current_user)):
    inc = next((i for i in db["incidents"] if i["id"] == incident_id), None)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc["status"] = req.status
    log_audit(current_user["id"], f"Updated incident status to {req.status}", inc["id"])
    
    await create_notification(
        title="Incident Status Updated",
        message=f"Incident '{inc.get('title', incident_id)}' status changed to {req.status}.",
        type="Incident",
        severity="Info",
        incident_id=inc["id"],
        related_incident=inc.get("title"),
        link="/alerts"
    )
    return inc

@router.get("/policies")
async def get_policies(current_user: dict = Depends(get_current_user)):
    return db["policies"]

@router.post("/policies")
async def create_policy(req: PolicyCreate, current_user: dict = Depends(get_current_user)):
    new_policy = {
        "id": f"POL-{int(time.time()*1000)}",
        "name": req.name,
        "description": req.description,
        "type": req.type,
        "status": req.status,
        "severity": req.severity,
        "rules": req.rules,
        "updated_at": datetime.utcnow().isoformat()
    }
    db["policies"].append(new_policy)
    return new_policy

@router.put("/policies/{policy_id}")
async def update_policy(policy_id: str, req: PolicyUpdate, current_user: dict = Depends(get_current_user)):
    policy = next((p for p in db["policies"] if p["id"] == policy_id), None)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    if req.name is not None: policy["name"] = req.name
    if req.description is not None: policy["description"] = req.description
    if req.type is not None: policy["type"] = req.type
    if req.status is not None: policy["status"] = req.status
    if req.severity is not None: policy["severity"] = req.severity
    if req.rules is not None: policy["rules"] = req.rules
    policy["updated_at"] = datetime.utcnow().isoformat()
    return policy

@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str, current_user: dict = Depends(get_current_user)):
    policy = next((p for p in db["policies"] if p["id"] == policy_id), None)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db["policies"].remove(policy)
    return {"success": True}

@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    return db["reports"]

@router.post("/reports")
async def create_report(req: ReportGenerateRequest, current_user: dict = Depends(get_current_user)):
    new_report = {
        "id": f"RPT-{int(time.time()*1000)}",
        "title": req.title,
        "generated_by": current_user.get("username", "System"),
        "created_at": datetime.utcnow().isoformat()
    }
    db["reports"].append(new_report)
    return new_report

import tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

@router.get("/reports/{report_id}/download")
async def download_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = next((r for r in db["reports"] if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    c = canvas.Canvas(path, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, f"Report: {report['title']}")
    c.setFont("Helvetica", 12)
    c.drawString(50, 730, f"Generated By: {report['generated_by']}")
    c.drawString(50, 710, f"Date: {report['created_at']}")
    
    c.drawString(50, 670, "Summary:")
    c.drawString(50, 650, f"Total Alerts: {len(db.get('alerts', []))}")
    c.drawString(50, 630, f"Total Incidents: {len(db.get('incidents', []))}")
    c.drawString(50, 610, f"Total Endpoints: {len(db.get('devices', []))}")
    c.drawString(50, 590, f"Total Employees: {len(db.get('employees', []))}")
    
    c.save()
    
    return FileResponse(path, media_type="application/pdf", filename=f"{report_id}.pdf")

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
    is_new = False
    if not device:
        is_new = True
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

    await create_notification(
        title="Agent Installed & Endpoint Online" if is_new else "Endpoint Came Online",
        message=f"Endpoint {device.get('hostname')} ({device.get('ip')}) connected and synchronized with Sentinel.",
        type="Endpoint",
        severity="Info",
        device_id=device.get("id"),
        related_endpoint=device.get("hostname"),
        link="/endpoints"
    )
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
    
    async def add_alert(reason, severity, mitre, notif_type="Alert"):
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
        
        emp = next((e for e in db["employees"] if e["id"] == employee_id), None)
        emp_name = emp["full_name"] if emp else "Unknown Employee"
        dev_name = device["hostname"] if device else device_id

        if emp:
            emp["risk_score"] = min(100, emp.get("risk_score", 0) + (15 if severity == "Critical" else 5))
            db["risk_history"].append({
                "employee_id": employee_id,
                "score": emp["risk_score"],
                "timestamp": datetime.utcnow().isoformat()
            })
            if emp["risk_score"] >= 70:
                await create_notification(
                    title="High-Risk Employee Threshold Reached",
                    message=f"Risk score for {emp_name} ({employee_id}) escalated to {emp['risk_score']} (High Risk Threshold).",
                    type="Employee",
                    severity="Critical" if emp["risk_score"] >= 80 else "High",
                    employee_id=employee_id,
                    related_employee=emp_name,
                    link="/employees"
                )

        await create_notification(
            title=f"{notif_type}: {reason}",
            message=f"Security telemetry event on {dev_name} by {emp_name}. MITRE: {mitre}.",
            type=notif_type,
            severity=severity,
            employee_id=employee_id,
            related_employee=emp_name,
            device_id=device_id,
            related_endpoint=dev_name,
            link="/alerts"
        )
            
    if event_type == "USB_INSERTED":
        await add_alert("Unauthorized USB device inserted.", "Critical", "T1052.001 - Exfiltration Over USB", "Alert")
    elif event_type == "MASS_FILE_DELETION":
        await add_alert("Mass file deletion detected.", "Critical", "T1485 - Data Destruction", "Alert")
    elif event_type == "POWERSHELL_ABUSE":
        await add_alert("Suspicious PowerShell execution.", "High", "T1059.001 - PowerShell", "Alert")
    elif event_type == "SUSPICIOUS_LOGIN":
        await add_alert("Login from unusual location/time.", "Medium", "T1078 - Valid Accounts", "Alert")
    
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

async def dispatch_agent_task(
    command: str,
    action_label: str,
    admin_id: str,
    employee_id: str = None,
    device_id: str = None,
    parameters: dict = None
):
    target_dev = None
    if device_id:
        target_dev = next((d for d in db["devices"] if d["id"] == device_id), None)
    if not target_dev and employee_id:
        target_dev = next((d for d in db["devices"] if d["employee_id"] == employee_id), None)

    if not target_dev:
        raise HTTPException(
            status_code=400,
            detail="Endpoint Agent Not Installed"
        )

    device_id = target_dev["id"]
    emp_id = target_dev.get("employee_id") or employee_id
    emp = next((e for e in db["employees"] if e["id"] == emp_id), None)
    emp_name = emp["full_name"] if emp else "Unknown Employee"
    dev_name = target_dev["hostname"]

    is_online = target_dev.get("status") == "online"
    task_id = f"TASK-{int(time.time()*1000)}"
    
    task = {
        "id": task_id,
        "command": command,
        "action": action_label,
        "device_id": device_id,
        "employee_id": emp_id,
        "parameters": parameters or {},
        "status": "Pending",
        "created_at": datetime.utcnow().isoformat(),
        "created_by": admin_id,
        "admin_id": admin_id,
        "completed_at": None,
        "result": None
    }

    if "tasks" not in db:
        db["tasks"] = []
    db["tasks"].insert(0, task)

    pushed = False
    if is_online:
        pushed = await manager.send_task_to_agent(device_id, task)
        if pushed:
            task["status"] = "Sent"

    target_dev["last_command"] = action_label
    if emp:
        emp["last_command"] = action_label

    log_audit(
        user_id=admin_id,
        action=f"Dispatched Task: {action_label}",
        target_id=device_id,
        employee_id=emp_id,
        device_id=device_id,
        result=task["status"],
        admin=admin_id
    )

    notif_msg = f"Task '{action_label}' sent to {dev_name} ({emp_name})." if task["status"] == "Sent" else f"Task '{action_label}' queued for {dev_name} ({emp_name}). Endpoint is offline."
    await create_notification(
        title=f"Task {task['status']}: {action_label}",
        message=notif_msg,
        type="Endpoint",
        severity="Info",
        employee_id=emp_id,
        related_employee=emp_name,
        device_id=device_id,
        related_endpoint=dev_name,
        link="/employees"
    )

    await manager.broadcast({
        "type": "task_update",
        "data": task,
        "employee_id": emp_id,
        "device_id": device_id
    })

    return {
        "status": task["status"].lower(),
        "task_id": task_id,
        "command": command,
        "action": action_label,
        "message": "Task dispatched via WebSocket" if task["status"] == "Sent" else "Task queued for next agent check-in",
        "endpoint_status": target_dev.get("status", "offline"),
        "task": task
    }

@router.post("/agent/tasks/lock")
async def task_lock(req: TaskLockRequest, current_user: dict = Depends(get_current_user)):
    return await dispatch_agent_task(
        command="lock_workstation",
        action_label="Lock Workstation",
        admin_id=current_user.get("username", "admin"),
        employee_id=req.employee_id,
        device_id=req.device_id
    )

@router.post("/agent/tasks/logout")
async def task_logout(req: TaskLogoutRequest, current_user: dict = Depends(get_current_user)):
    return await dispatch_agent_task(
        command="force_logout",
        action_label="Force Logout",
        admin_id=current_user.get("username", "admin"),
        employee_id=req.employee_id,
        device_id=req.device_id
    )

@router.post("/agent/tasks/kill-process")
async def task_kill_process(req: TaskKillProcessRequest, current_user: dict = Depends(get_current_user)):
    return await dispatch_agent_task(
        command="kill_process",
        action_label="Kill Process",
        admin_id=current_user.get("username", "admin"),
        employee_id=req.employee_id,
        device_id=req.device_id,
        parameters={"process_name": req.process_name, "pid": req.pid}
    )

@router.post("/agent/tasks/collect-forensics")
async def task_collect_forensics(req: TaskCollectForensicsRequest, current_user: dict = Depends(get_current_user)):
    return await dispatch_agent_task(
        command="collect_forensics",
        action_label="Collect Forensics",
        admin_id=current_user.get("username", "admin"),
        employee_id=req.employee_id,
        device_id=req.device_id,
        parameters={"depth": req.depth}
    )

@router.post("/agent/tasks/restart-agent")
async def task_restart_agent(req: TaskRestartAgentRequest, current_user: dict = Depends(get_current_user)):
    return await dispatch_agent_task(
        command="restart_agent",
        action_label="Restart Agent",
        admin_id=current_user.get("username", "admin"),
        employee_id=req.employee_id,
        device_id=req.device_id
    )

@router.get("/tasks")
async def get_tasks(
    employee_id: str = None,
    device_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    tasks = db.get("tasks", [])
    if employee_id:
        tasks = [t for t in tasks if t.get("employee_id") == employee_id]
    if device_id:
        tasks = [t for t in tasks if t.get("device_id") == device_id]
    return tasks

@router.get("/audit-logs")
async def get_audit_logs(
    employee_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    logs = db.get("audit_logs", [])
    if employee_id:
        logs = [l for l in logs if l.get("employee_id") == employee_id or l.get("target_id") == employee_id]
    return logs

@router.get("/agent/tasks")
async def get_agent_tasks(device_id: str, verified: bool = Depends(verify_agent)):
    tasks = [t for t in db["tasks"] if t["device_id"] == device_id and t["status"] == "Pending"]
    for t in tasks:
        t["status"] = "Dispatched"
    return {"tasks": tasks}

@router.post("/agent/task/result")
async def agent_task_result(data: dict, verified: bool = Depends(verify_agent)):
    task_id = data.get("task_id")
    task = next((t for t in db.get("tasks", []) if t["id"] == task_id), None)
    if task:
        task["status"] = data.get("status", "Completed")
        task["completed_at"] = datetime.utcnow().isoformat()
        task["result"] = data.get("result")

        dev = next((d for d in db["devices"] if d["id"] == task.get("device_id")), None)
        if dev:
            dev["last_command"] = task.get("action") or task.get("command")
            dev["last_execution_time"] = task["completed_at"]
        emp = next((e for e in db["employees"] if e["id"] == task.get("employee_id")), None)
        if emp:
            emp["last_command"] = task.get("action") or task.get("command")
            emp["last_execution_time"] = task["completed_at"]

        db["task_results"].append({
            "task_id": task_id,
            "device_id": data.get("device_id"),
            "result": data.get("result"),
            "timestamp": task["completed_at"]
        })

        log_audit(
            user_id=task.get("admin_id", "admin"),
            action=f"Task Completed: {task.get('action') or task.get('command')}",
            target_id=task.get("device_id"),
            employee_id=task.get("employee_id"),
            device_id=task.get("device_id"),
            result=task["status"],
            admin=task.get("admin_id", "admin")
        )

        await create_notification(
            title=f"Task {task['status']}: {task.get('action') or task.get('command')}",
            message=f"Action '{task.get('action') or task.get('command')}' on device {data.get('device_id')} returned status: {task['status']}.",
            type="Endpoint",
            severity="Info" if task["status"] == "Completed" else "High",
            device_id=data.get("device_id"),
            employee_id=task.get("employee_id"),
            related_endpoint=dev["hostname"] if dev else data.get("device_id"),
            link="/employees"
        )

        await manager.broadcast({
            "type": "task_update",
            "data": task,
            "employee_id": task.get("employee_id"),
            "device_id": task.get("device_id")
        })

    return {"success": True}

@router.post("/agent/screenshot")
async def agent_screenshot(data: dict, verified: bool = Depends(verify_agent)):
    return {"success": True}

@router.post("/agent/logs")
async def agent_logs(data: dict, verified: bool = Depends(verify_agent)):
    return {"success": True}

@router.get("/endpoint/status")
async def endpoint_status(device_id: str, current_user: dict = Depends(get_current_user)):
    device = next((d for d in db["devices"] if d["id"] == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.get("/endpoint/live")
async def endpoint_live(device_id: str, current_user: dict = Depends(get_current_user)):
    telemetry = [t for t in db["telemetry"] if t.get("device_id") == device_id][:50]
    return {"telemetry": telemetry}

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
    
    await create_notification(
        title="New Employee Added",
        message=f"Employee {new_emp['full_name']} ({new_emp['department']} - {new_emp['role']}) added to Sentinel tracking.",
        type="Employee",
        severity="Info",
        employee_id=new_emp["id"],
        related_employee=new_emp["full_name"],
        link="/employees"
    )
    return new_emp

@router.put("/alerts/{alert_id}/status")
async def update_alert_status(alert_id: str, req: AlertStatusUpdate, current_user: dict = Depends(get_current_user)):
    alert = next((a for a in db["alerts"] if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["status"] = req.status
    log_audit(current_user["id"], f"Updated alert status to {req.status}", alert["id"])
    
    await create_notification(
        title="Alert Status Changed",
        message=f"Alert '{alert.get('reason', alert_id)}' status updated to {req.status}.",
        type="Alert",
        severity="Info",
        employee_id=alert.get("employee_id"),
        link="/alerts"
    )
    return alert

