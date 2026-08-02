import time
import threading
from logger import logger
from network import NetworkMonitor
from activity_monitor import ActivityMonitor
from process_monitor import get_running_processes

class HeartbeatThread(threading.Thread):
    def __init__(self, api_client, device_id, interval):
        super().__init__()
        self.api_client = api_client
        self.device_id = device_id
        self.interval = interval
        self.daemon = True
        self.running = True
        self.command_callback = None
        
        self.network = NetworkMonitor()
        self.activity = ActivityMonitor()
        
    def set_command_callback(self, cb):
        self.command_callback = cb

    def run(self):
        logger.info(f"Starting heartbeat thread (interval: {self.interval}s)")
        while self.running:
            try:
                # 1. Send Heartbeat and get commands
                commands = self.api_client.send_heartbeat(self.device_id)
                if commands and self.command_callback:
                    for cmd in commands:
                        self.command_callback(cmd)
                        
                # 2. Collect routine telemetry
                net_stats = self.network.get_stats()
                idle_time = self.activity.get_idle_time()
                procs = get_running_processes()
                
                payload = {
                    "device_id": self.device_id,
                    "event_type": "ROUTINE_TELEMETRY",
                    "data": {
                        "network": net_stats,
                        "idle_time_seconds": idle_time,
                        "process_count": len(procs)
                    }
                }
                
                self.api_client.send_telemetry(payload)
                
            except Exception as e:
                logger.error(f"Error in heartbeat thread: {e}")
                
            time.sleep(self.interval)
            
    def stop(self):
        self.running = False
