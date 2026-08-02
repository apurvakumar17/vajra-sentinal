import asyncio
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws/{path:path}")
async def websocket_endpoint(websocket: WebSocket, path: str):
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(10)
            await websocket.send_json({
                "type": "telemetry",
                "device_id": "DEV-103",
                "event": "Process monitoring active",
                "timestamp": datetime.utcnow().isoformat()
            })
    except WebSocketDisconnect:
        pass
