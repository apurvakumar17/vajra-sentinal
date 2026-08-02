import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from api.auth import router as auth_router
from api.routes import router as main_router
from websocket.socket import router as ws_router
from ai.copilot import router as ai_router

app = FastAPI(title="Sentinel Insider AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(ai_router, prefix="/api/v1", tags=["ai"])
app.include_router(ws_router, prefix="/api/v1", tags=["ws"])
app.include_router(main_router, prefix="/api/v1", tags=["main"])

frontend_dist = os.path.join(os.getcwd(), "..", "frontend", "dist")
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.join(os.getcwd(), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404)
