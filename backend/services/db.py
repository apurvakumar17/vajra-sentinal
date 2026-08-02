from datetime import datetime, timedelta
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
        {"id": "EMP-003", "full_name": "Rahul Sharma", "department": "Engineering", "role": "DevOps Engineer", "risk_score": 85, "status": "active"}
    ],
    "devices": [
        {"id": "DEV-101", "employee_id": "EMP-001", "hostname": "DESKTOP-SC-01", "os": "Windows 11 Pro", "ip": "10.4.12.45", "mac": "00:1A:2B:3C:4D:5E", "status": "online", "last_heartbeat": datetime.utcnow().isoformat()},
        {"id": "DEV-102", "employee_id": "EMP-002", "hostname": "MAC-MR-02", "os": "macOS Sonoma", "ip": "10.4.12.88", "mac": "F4:0F:24:1A:B2:C3", "status": "offline", "last_heartbeat": (datetime.utcnow() - timedelta(hours=2)).isoformat()},
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
    "telemetry": [],
    "audit_logs": []
}

def log_audit(user_id, action, target_id):
    db["audit_logs"].append({
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "action": action,
        "target_id": target_id
    })
