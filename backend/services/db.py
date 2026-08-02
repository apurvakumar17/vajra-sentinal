from datetime import datetime, timedelta
import time
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = {
    "users": [
        {"id": "USR-001", "username": "admin", "email": "admin@sentinel.ai", "password_hash": "$2b$12$Le4gQvhjl8q4XFsuT1xhMuKW5I9vfYGtG3Da2rtdT0ZvXnCAITNBm", "role": "admin"},
        {"id": "USR-002", "username": "employee", "email": "employee@sentinel.ai", "password_hash": "$2b$12$SFvDjLzuqWyB2oI3Z89GrOUVPmPoNCQzLbmvdHyvIhvsArj/o6MS2", "role": "employee"}
    ],
    "employees": [
        {"id": "EMP-001", "full_name": "Sarah Chen", "department": "Engineering", "role": "Senior Developer", "risk_score": 15, "status": "active"},
        {"id": "EMP-002", "full_name": "Michael Ross", "department": "Finance", "role": "Financial Analyst", "risk_score": 42, "status": "active"},
        {"id": "EMP-003", "full_name": "Rahul Sharma", "department": "Engineering", "role": "DevOps Engineer", "risk_score": 85, "status": "active"},
        {"id": "EMP-004", "full_name": "David Kim", "department": "Marketing", "role": "Content Strategist", "risk_score": 10, "status": "active"}
    ],
    "devices": [
        {"id": "DEV-101", "employee_id": "EMP-001", "hostname": "DESKTOP-SC-01", "os": "Windows 11 Pro", "ip": "10.4.12.45", "mac": "00:1A:2B:3C:4D:5E", "status": "online", "last_heartbeat": datetime.utcnow().isoformat()},
        {"id": "DEV-102", "employee_id": "EMP-002", "hostname": "MAC-MR-02", "os": "macOS Sonoma", "ip": "10.4.12.88", "mac": "F4:0F:24:1A:B2:C3", "status": "offline", "last_heartbeat": (datetime.utcnow() - timedelta(hours=2)).isoformat()},
        {"id": "DEV-103", "employee_id": "EMP-003", "hostname": "DESKTOP-RS-03", "os": "Windows 11 Pro", "ip": "10.4.12.102", "mac": "00:1B:3C:4D:5E:6F", "status": "online", "last_heartbeat": datetime.utcnow().isoformat()}
    ],
    "alerts": [
        {"id": "ALT-001", "employee_id": "EMP-003", "severity": "Critical", "reason": "Mass file copy to external USB drive", "confidence": "98%", "status": "open", "created_at": datetime.utcnow().isoformat()},
        {"id": "ALT-002", "employee_id": "EMP-002", "severity": "Medium", "reason": "Login from unusual geographic location (VPN IP)", "confidence": "75%", "status": "investigating", "created_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()}
    ],
    "incidents": [
        {"id": "INC-001", "alert_id": "ALT-001", "employee_id": "EMP-003", "title": "Data Exfiltration Attempt", "status": "open", "priority": "High", "created_at": datetime.utcnow().isoformat()}
    ],
    "policies": [
        {"id": "POL-001", "name": "Block USB Mass Storage", "description": "Prevents unauthorized USB drives.", "status": "enabled", "updated_at": datetime.utcnow().isoformat()}
    ],
    "reports": [
        {"id": "RPT-001", "title": "Weekly Insider Threat Summary", "generated_by": "System", "created_at": datetime.utcnow().isoformat()}
    ],
    "notifications": [
        {
            "id": "NOTIF-001",
            "title": "Mass File Copy Detected",
            "message": "Unauthorized USB drive activity detected for employee Rahul Sharma (EMP-003).",
            "type": "Alert",
            "severity": "Critical",
            "timestamp": datetime.utcnow().isoformat(),
            "read": False,
            "employee_id": "EMP-003",
            "related_employee": "Rahul Sharma",
            "device_id": "DEV-101",
            "related_endpoint": "DESKTOP-SC-01",
            "incident_id": None,
            "related_incident": None,
            "link": "/alerts"
        },
        {
            "id": "NOTIF-002",
            "title": "High Risk Score Escalation",
            "message": "Employee Rahul Sharma (EMP-003) risk score reached 85 (Critical threshold).",
            "type": "Employee",
            "severity": "High",
            "timestamp": (datetime.utcnow() - timedelta(minutes=25)).isoformat(),
            "read": False,
            "employee_id": "EMP-003",
            "related_employee": "Rahul Sharma",
            "device_id": None,
            "related_endpoint": None,
            "incident_id": None,
            "related_incident": None,
            "link": "/employees"
        },
        {
            "id": "NOTIF-003",
            "title": "Agent Missed Heartbeat",
            "message": "Endpoint MAC-MR-02 (10.4.12.88) missed heartbeat check-in for over 2 hours.",
            "type": "Endpoint",
            "severity": "Medium",
            "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            "read": False,
            "employee_id": "EMP-002",
            "related_employee": "Michael Ross",
            "device_id": "DEV-102",
            "related_endpoint": "MAC-MR-02",
            "incident_id": None,
            "related_incident": None,
            "link": "/endpoints"
        },
        {
            "id": "NOTIF-004",
            "title": "USB Mass Storage Policy Enforced",
            "message": "Policy 'Block USB Mass Storage' active across 2 registered endpoints.",
            "type": "Policy",
            "severity": "Info",
            "timestamp": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
            "read": True,
            "employee_id": None,
            "related_employee": None,
            "device_id": None,
            "related_endpoint": None,
            "incident_id": None,
            "related_incident": None,
            "link": "/policies"
        },
        {
            "id": "NOTIF-005",
            "title": "Data Exfiltration Incident Opened",
            "message": "Incident INC-001 opened following critical USB exfiltration alert.",
            "type": "Incident",
            "severity": "Critical",
            "timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
            "read": False,
            "employee_id": "EMP-003",
            "related_employee": "Rahul Sharma",
            "device_id": None,
            "related_endpoint": None,
            "incident_id": "INC-001",
            "related_incident": "Data Exfiltration Attempt",
            "link": "/alerts"
        }
    ],
    "telemetry": [],
    "tasks": [],
    "task_results": [],
    "risk_history": [],
    "audit_logs": []
}

def log_audit(user_id, action, target_id=None, employee_id=None, device_id=None, result=None, admin=None):
    admin_name = admin or user_id or "admin"
    entry = {
        "id": f"AUD-{int(time.time()*1000)}",
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": admin_name,
        "admin": admin_name,
        "employee_id": employee_id,
        "device_id": device_id,
        "action": action,
        "target_id": target_id or device_id or employee_id,
        "result": result or "Pending"
    }
    if "audit_logs" not in db:
        db["audit_logs"] = []
    db["audit_logs"].insert(0, entry)
    return entry

async def create_notification(
    title: str,
    message: str,
    type: str,
    severity: str,
    employee_id: str = None,
    related_employee: str = None,
    device_id: str = None,
    related_endpoint: str = None,
    incident_id: str = None,
    related_incident: str = None,
    link: str = None
):
    notif = {
        "id": f"NOTIF-{int(time.time()*1000)}",
        "title": title,
        "message": message,
        "type": type,
        "severity": severity,
        "timestamp": datetime.utcnow().isoformat(),
        "read": False,
        "employee_id": employee_id,
        "related_employee": related_employee,
        "device_id": device_id,
        "related_endpoint": related_endpoint,
        "incident_id": incident_id,
        "related_incident": related_incident,
        "link": link or "/alerts"
    }
    if "notifications" not in db:
        db["notifications"] = []
    db["notifications"].insert(0, notif)
    
    try:
        from websocket.socket import manager
        await manager.broadcast({"type": "notification", "data": notif})
    except Exception as e:
        print(f"Error broadcasting notification: {e}")
        
    return notif

