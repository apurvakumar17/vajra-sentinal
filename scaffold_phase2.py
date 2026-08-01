import os

files = {
    "sentinel-insider-ai/backend/requirements.txt": """fastapi[all]
motor
pymongo
redis
pyjwt
passlib[bcrypt]
pydantic
pydantic-settings
uvicorn
""",
    "sentinel-insider-ai/backend/app/core/config.py": """from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel Insider AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "SUPER_SECRET_KEY_FOR_HACKATHON"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "sentinel_db"
    REDIS_URI: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"

settings = Settings()
""",
    "sentinel-insider-ai/backend/app/core/security.py": """from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
""",
    "sentinel-insider-ai/backend/app/core/database.py": """from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    redis: redis.Redis = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        # trigger a connection test
        await db.client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")

async def connect_to_redis():
    try:
        db.redis = redis.from_url(settings.REDIS_URI)
        await db.redis.ping()
        print("Connected to Redis")
    except Exception as e:
        print(f"Redis connection failed: {e}")

async def close_redis_connection():
    if db.redis:
        await db.redis.close()
        print("Closed Redis connection")

def get_db():
    return db.client[settings.DATABASE_NAME] if db.client else None

def get_redis():
    return db.redis
""",
    "sentinel-insider-ai/backend/app/schemas/user.py": """from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
""",
    "sentinel-insider-ai/backend/app/schemas/telemetry.py": """from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime

class Heartbeat(BaseModel):
    agent_id: str
    hostname: str
    status: str
    timestamp: datetime = datetime.utcnow()

class TelemetryEvent(BaseModel):
    agent_id: str
    event_type: str
    payload: Dict[str, Any]
    timestamp: datetime = datetime.utcnow()

class TelemetryBatch(BaseModel):
    agent_id: str
    events: List[TelemetryEvent]
""",
    "sentinel-insider-ai/backend/app/services/telemetry_service.py": """from app.core.database import get_db, get_redis
from app.schemas.telemetry import TelemetryBatch, Heartbeat

async def process_heartbeat(heartbeat: Heartbeat):
    db = get_db()
    if db is not None:
        # Update endpoint status in DB
        await db.endpoints.update_one(
            {"agent_id": heartbeat.agent_id},
            {"$set": {"hostname": heartbeat.hostname, "status": heartbeat.status, "last_heartbeat": heartbeat.timestamp}},
            upsert=True
        )
    redis = get_redis()
    if redis is not None:
        # Cache online status in Redis for quick access
        await redis.setex(f"agent:{heartbeat.agent_id}:status", 300, "online")

async def process_telemetry_batch(batch: TelemetryBatch):
    db = get_db()
    if db is not None:
        events_docs = [event.dict() for event in batch.events]
        if events_docs:
            await db.telemetry_events.insert_many(events_docs)
    
    # Normally here we would push events to a message queue or trigger the Event Processing Engine
""",
    "sentinel-insider-ai/backend/app/api/v1/endpoints/auth.py": """from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token
from app.schemas.user import Token
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

# Mock user for MVP Phase 2
MOCK_USER = {
    "email": "admin@sentinel.ai",
    "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQjO" # password: admin
}

@router.post("/login", response_model=Token)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # In Phase 3 we will integrate this with MongoDB
    if form_data.username != MOCK_USER["email"] or not verify_password(form_data.password, MOCK_USER["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
""",
    "sentinel-insider-ai/backend/app/api/v1/endpoints/telemetry.py": """from fastapi import APIRouter, Depends, HTTPException
from app.schemas.telemetry import Heartbeat, TelemetryBatch
from app.services import telemetry_service
import asyncio

router = APIRouter()

@router.post("/heartbeat")
async def receive_heartbeat(heartbeat: Heartbeat):
    await telemetry_service.process_heartbeat(heartbeat)
    return {"status": "received"}

@router.post("/events")
async def receive_events(batch: TelemetryBatch):
    await telemetry_service.process_telemetry_batch(batch)
    return {"status": "received", "count": len(batch.events)}
""",
    "sentinel-insider-ai/backend/app/api/websockets/manager.py": """from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()
""",
    "sentinel-insider-ai/backend/app/api/websockets/ws.py": """from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.websockets.manager import manager
import json

router = APIRouter()

@router.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo for testing
            await manager.broadcast(f"Broadcast: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
""",
    "sentinel-insider-ai/backend/app/api/v1/api.py": """from fastapi import APIRouter
from app.api.v1.endpoints import auth, telemetry

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
""",
    "sentinel-insider-ai/backend/app/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.api.websockets import ws
from app.core.database import connect_to_mongo, close_mongo_connection, connect_to_redis, close_redis_connection

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws.router)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    await connect_to_redis()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()
    await close_redis_connection()

@app.get("/")
def root():
    return {"message": "Sentinel Insider AI API is running"}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Scaffolding completed.")
