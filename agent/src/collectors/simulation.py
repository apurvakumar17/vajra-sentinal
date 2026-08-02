import random
from datetime import datetime

def collect_simulated_events():
    events = []
    
    # Simulate random file access
    if random.random() > 0.5:
        events.append({
            "event_type": "file_access",
            "payload": {
                "file_path": f"C:/HR_Data/salaries_2026_{random.randint(1,10)}.xlsx",
                "action": "read"
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
    # Simulate network upload spike rarely
    if random.random() > 0.9:
        events.append({
            "event_type": "network_conn",
            "payload": {
                "destination_ip": "192.168.100.45",
                "upload_bytes": random.randint(1000000, 50000000)
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
    return events
