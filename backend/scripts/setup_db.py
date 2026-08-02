import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from datetime import datetime, timedelta
import bcrypt

def get_password_hash(password: str) -> str:
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

async def setup_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]

    print("Creating Collections and Indexes...")

    # Users Collection (Dashboard Access)
    await db.users.create_index("email", unique=True)
    
    # Employees Collection (Monitored Users)
    await db.employees.create_index("department")
    await db.employees.create_index("current_risk_score")

    # Endpoints Collection
    await db.endpoints.create_index("agent_id", unique=True)
    await db.endpoints.create_index("employee_id")

    # Telemetry Events Collection
    await db.telemetry_events.create_index("agent_id")
    await db.telemetry_events.create_index("timestamp")
    await db.telemetry_events.create_index([("agent_id", 1), ("timestamp", -1)])

    # Alerts Collection
    await db.alerts.create_index("employee_id")
    await db.alerts.create_index("severity")
    await db.alerts.create_index("status")
    await db.alerts.create_index("created_at")

    print("Inserting Sample Data...")

    # Clear existing data for fresh seed
    await db.users.delete_many({})
    await db.employees.delete_many({})
    await db.endpoints.delete_many({})
    await db.telemetry_events.delete_many({})
    await db.alerts.delete_many({})

    # 1. Dashboard User
    admin_user = {
        "email": "admin@sentinel.ai",
        "hashed_password": get_password_hash("admin"),
        "role": "SOC Analyst",
        "department": "Security",
        "full_name": "Admin User",
        "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
    }
    user_res = await db.users.insert_one(admin_user)

    # 2. Employees
    employees = [
        {"full_name": "Alice Smith", "department": "Finance", "role": "Financial Analyst", "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice", "current_risk_score": 15, "baseline_profile": {"working_hours": "09:00-17:00", "avg_daily_downloads": 5}},
        {"full_name": "Bob Jones", "department": "HR", "role": "HR Manager", "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob", "current_risk_score": 25, "baseline_profile": {"working_hours": "08:30-16:30", "avg_daily_downloads": 2}},
        {"full_name": "Rahul Sharma", "department": "Engineering", "role": "Software Engineer", "photo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul", "current_risk_score": 85, "baseline_profile": {"working_hours": "10:00-19:00", "avg_daily_downloads": 50}},
    ]
    emp_res = await db.employees.insert_many(employees)
    emp_ids = emp_res.inserted_ids

    # 3. Endpoints
    endpoints = [
        {"agent_id": "AGT-001", "employee_id": emp_ids[0], "hostname": "WIN-FIN-01", "status": "online", "last_heartbeat": datetime.utcnow()},
        {"agent_id": "AGT-002", "employee_id": emp_ids[1], "hostname": "WIN-HR-02", "status": "offline", "last_heartbeat": datetime.utcnow() - timedelta(hours=2)},
        {"agent_id": "AGT-003", "employee_id": emp_ids[2], "hostname": "WIN-ENG-03", "status": "online", "last_heartbeat": datetime.utcnow()},
    ]
    await db.endpoints.insert_many(endpoints)

    # 4. Telemetry Events (Simulating Rahul's high risk activity)
    events = []
    for i in range(20):
        events.append({
            "agent_id": "AGT-003",
            "event_type": "file_access",
            "payload": {"file_path": f"C:/SourceCode/core_algo_{i}.py", "action": "read"},
            "timestamp": datetime.utcnow() - timedelta(minutes=i)
        })
    events.append({
        "agent_id": "AGT-003",
        "event_type": "usb_insert",
        "payload": {"device_id": "USB_KINGSTON_64GB", "action": "mass_copy"},
        "timestamp": datetime.utcnow()
    })
    await db.telemetry_events.insert_many(events)

    # 5. Alerts
    alerts = [
        {
            "employee_id": emp_ids[2],
            "severity": "High",
            "risk_score": 85,
            "reason": "Mass source code read followed by USB insertion",
            "ai_explanation": {
                "Reason": "User deviated significantly from baseline downloads and initiated a mass copy to an unauthorized USB.",
                "Evidence": "20 file reads in /SourceCode, 1 USB insertion (KINGSTON_64GB).",
                "MITRE": "T1052.001 - Exfiltration Over USB",
                "Confidence": "92%"
            },
            "status": "open",
            "created_at": datetime.utcnow()
        }
    ]
    await db.alerts.insert_many(alerts)

    print("Sample data inserted successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_database())
