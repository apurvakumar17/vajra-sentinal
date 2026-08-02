from api import APIClient
from device_info import get_device_info
from heartbeat import HeartbeatThread
from ws_client import AgentWSThread
from usb_monitor import USBMonitor
from file_monitor import FileMonitor
from commands import execute_command
from logger import logger
from config import get_config
import time

class SentinelAgent:
    def __init__(self):
        self.config = get_config()
        self.api = APIClient()
        self.device_info = get_device_info()
        
        self.heartbeat = None
        self.ws_thread = None
        self.usb_monitor = None
        self.file_monitor = None
        
    def start(self):
        logger.info("Initializing Sentinel Endpoint Agent...")
        
        # 1. Register device
        reg_response = self.api.register_device(self.device_info)
        if not reg_response:
            logger.warning("Initial registration failed. Will retry...")
            
        # 2. Start WebSocket Thread
        try:
            self.ws_thread = AgentWSThread(
                self.config["api_url"],
                self.device_info["device_id"],
                self.handle_command
            )
            self.ws_thread.start()
        except Exception as e:
            logger.error(f"Failed to start Agent WS thread: {e}")

        # 3. Start Heartbeat Thread (Fallback & Telemetry)
        self.heartbeat = HeartbeatThread(
            self.api, 
            self.device_info["device_id"], 
            self.config["heartbeat_interval"]
        )
        self.heartbeat.set_command_callback(self.handle_command)
        self.heartbeat.start()
        
        # 4. Start USB Monitor (Windows only)
        try:
            self.usb_monitor = USBMonitor(self.handle_alert)
            self.usb_monitor.start()
        except Exception as e:
            logger.error(f"Failed to start USB monitor: {e}")
            
        # 5. Start File Monitor
        self.file_monitor = FileMonitor(self.handle_alert)
        self.file_monitor.start()
        
        logger.info("Agent started successfully. Running in background.")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
            
    def handle_command(self, cmd):
        logger.info(f"Processing command: {cmd.get('command') or cmd.get('action')}")
        result = execute_command(cmd)
        
        task_id = cmd.get("task_id") or cmd.get("id")
        if task_id:
            payload = {
                "task_id": task_id,
                "device_id": self.device_info["device_id"],
                "status": result.get("status", "Completed"),
                "result": result
            }
            self.api.send_task_result(payload)
        
    def handle_alert(self, event):
        payload = {
            "device_id": self.device_info["device_id"],
            "event_type": event.get("event_type", "UNKNOWN"),
            "data": event
        }
        self.api.send_telemetry(payload)
        
    def stop(self):
        logger.info("Stopping agent...")
        if self.ws_thread:
            self.ws_thread.stop()
        if self.heartbeat:
            self.heartbeat.stop()
        if self.usb_monitor:
            self.usb_monitor.stop()
        if self.file_monitor:
            self.file_monitor.stop()
