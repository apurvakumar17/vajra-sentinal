import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def clear_demo_data():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]

    print("Clearing demo data from collections...")

    # Delete employees, endpoints, alerts, and telemetry events
    # We DO NOT delete the users collection so the admin user can still log in
    await db.employees.delete_many({})
    await db.endpoints.delete_many({})
    await db.telemetry_events.delete_many({})
    await db.alerts.delete_many({})

    print("Demo data cleared successfully! Admin user remains intact.")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_demo_data())
