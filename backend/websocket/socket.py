import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.agent_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, device_id: Optional[str] = None):
        await websocket.accept()
        if device_id:
            self.agent_connections[device_id] = websocket
            # Update device online status in db
            from services.db import db
            dev = next((d for d in db["devices"] if d["id"] == device_id), None)
            if dev:
                dev["status"] = "online"
                dev["last_heartbeat"] = datetime.utcnow().isoformat()
        else:
            self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, device_id: Optional[str] = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if device_id and device_id in self.agent_connections:
            if self.agent_connections[device_id] == websocket:
                del self.agent_connections[device_id]

    async def send_task_to_agent(self, device_id: str, task: dict) -> bool:
        ws = self.agent_connections.get(device_id)
        if ws:
            try:
                await ws.send_json({
                    "type": "task",
                    "task_id": task["id"],
                    "command": task["command"],
                    "action": task.get("action"),
                    "parameters": task.get("parameters", {})
                })
                return True
            except Exception as e:
                print(f"Failed to push task to agent WS: {e}")
                self.disconnect(ws, device_id)
        return False

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws/agent")
async def agent_websocket_endpoint(websocket: WebSocket):
    # Query parameters e.g., ?device_id=DEV-101
    device_id = websocket.query_params.get("device_id")
    await manager.connect(websocket, device_id=device_id)
    try:
        from services.db import db
        # Check if there are pending tasks for this device
        if device_id:
            pending_tasks = [t for t in db["tasks"] if t["device_id"] == device_id and t["status"] == "Pending"]
            for task in pending_tasks:
                sent = await manager.send_task_to_agent(device_id, task)
                if sent:
                    task["status"] = "Sent"
                    await manager.broadcast({
                        "type": "task_update",
                        "data": task
                    })

        while True:
            data_str = await websocket.receive_text()
            try:
                msg = json.loads(data_str)
                msg_type = msg.get("type")
                if msg_type == "register":
                    registered_id = msg.get("device_id")
                    if registered_id:
                        device_id = registered_id
                        manager.agent_connections[device_id] = websocket
                        dev = next((d for d in db["devices"] if d["id"] == device_id), None)
                        if dev:
                            dev["status"] = "online"
                            dev["last_heartbeat"] = datetime.utcnow().isoformat()
                        # Check pending tasks
                        pending_tasks = [t for t in db["tasks"] if t["device_id"] == device_id and t["status"] == "Pending"]
                        for task in pending_tasks:
                            sent = await manager.send_task_to_agent(device_id, task)
                            if sent:
                                task["status"] = "Sent"
                                await manager.broadcast({"type": "task_update", "data": task})

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

                elif msg_type == "task_result":
                    # Task completed payload from agent
                    task_id = msg.get("task_id")
                    task = next((t for t in db["tasks"] if t["id"] == task_id), None)
                    if task:
                        task["status"] = msg.get("status", "Completed")
                        task["completed_at"] = datetime.utcnow().isoformat()
                        task["result"] = msg.get("result")
                        
                        dev = next((d for d in db["devices"] if d["id"] == task["device_id"]), None)
                        if dev:
                            dev["last_command"] = task["command"]
                            dev["last_execution_time"] = task["completed_at"]
                        emp = next((e for e in db["employees"] if e["id"] == task.get("employee_id")), None)
                        if emp:
                            emp["last_command"] = task["command"]
                            emp["last_execution_time"] = task["completed_at"]

                        from services.db import log_audit, create_notification
                        log_audit(
                            user_id=task.get("admin_id", "admin"),
                            action=f"Task Executed: {task.get('command')}",
                            target_id=task.get("device_id"),
                            employee_id=task.get("employee_id"),
                            device_id=task.get("device_id"),
                            result=task["status"]
                        )

                        await create_notification(
                            title=f"Task {task['status']}: {task.get('command')}",
                            message=f"Action '{task.get('command')}' on {dev['hostname'] if dev else task['device_id']} returned {task['status']}.",
                            type="Endpoint",
                            severity="Info" if task["status"] == "Completed" else "High",
                            device_id=task["device_id"],
                            employee_id=task.get("employee_id"),
                            link="/employees"
                        )

                        await manager.broadcast({
                            "type": "task_update",
                            "data": task
                        })

            except json.JSONDecodeError:
                if data_str == "ping":
                    await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, device_id=device_id)

@router.websocket("/ws/{path:path}")
async def generic_websocket_endpoint(websocket: WebSocket, path: str):
    if path == "agent":
        await agent_websocket_endpoint(websocket)
        return
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
