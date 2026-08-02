from api import APIClient
from device_info import get_device_info
from heartbeat import HeartbeatThread
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
        self.usb_monitor = None
        self.file_monitor = None
        
    def start(self):
        logger.info("Initializing Sentinel Endpoint Agent...")
        
        # 1. Register device
        reg_response = self.api.register_device(self.device_info)
        if not reg_response:
            logger.warning("Initial registration failed. Will retry...")
            
        # 2. Start Monitors
        self.heartbeat = HeartbeatThread(
            self.api, 
            self.device_info["device_id"], 
            self.config["heartbeat_interval"]
        )
        self.heartbeat.set_command_callback(self.handle_command)
        self.heartbeat.start()
        
        # Start USB Monitor (Windows only)
        try:
            self.usb_monitor = USBMonitor(self.handle_alert)
            self.usb_monitor.start()
        except Exception as e:
            logger.error(f"Failed to start USB monitor: {e}")
            
        # Start File Monitor
        self.file_monitor = FileMonitor(self.handle_alert)
        self.file_monitor.start()
        
        logger.info("Agent started successfully. Running in background.")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
            
    def handle_command(self, cmd):
        execute_command(cmd)
        
    def handle_alert(self, event):
        payload = {
            "device_id": self.device_info["device_id"],
            "event_type": event.get("event_type", "UNKNOWN"),
            "data": event
        }
        self.api.send_telemetry(payload)
        
    def stop(self):
        logger.info("Stopping agent...")
        if self.heartbeat:
            self.heartbeat.stop()
        if self.usb_monitor:
            self.usb_monitor.stop()
        if self.file_monitor:
            self.file_monitor.stop()
