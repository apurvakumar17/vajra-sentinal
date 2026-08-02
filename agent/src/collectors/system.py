import psutil
import platform
from datetime import datetime

def collect_system_info():
    return {
        "event_type": "system_info",
        "payload": {
            "os": platform.system(),
            "os_release": platform.release(),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "ram_percent": psutil.virtual_memory().percent,
        },
        "timestamp": datetime.utcnow().isoformat()
    }
