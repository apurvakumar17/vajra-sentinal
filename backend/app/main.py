from fastapi import FastAPI
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
