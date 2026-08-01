from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    redis: aioredis.Redis = None

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
        db.redis = aioredis.from_url(settings.REDIS_URI)
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
