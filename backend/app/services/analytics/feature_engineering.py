from datetime import datetime

def extract_features(events: list):
    """
    Converts raw telemetry events into a numerical feature vector.
    For MVP, we extract:
    - Number of file reads
    - Number of USB insertions
    - Network upload bytes
    - Off-hours activity count
    """
    file_reads = 0
    usb_inserts = 0
    network_uploads = 0
    off_hours = 0
    
    for event in events:
        event_type = event.get("event_type")
        payload = event.get("payload", {})
        ts_str = event.get("timestamp")
        
        if event_type == "file_access" and payload.get("action") == "read":
            file_reads += 1
        elif event_type == "usb_insert":
            usb_inserts += 1
        elif event_type == "network_conn":
            network_uploads += payload.get("upload_bytes", 0)
            
        if ts_str:
            try:
                # Basic off-hours check (e.g., outside 8 AM - 6 PM)
                dt = datetime.fromisoformat(ts_str.replace("Z", ""))
                if dt.hour < 8 or dt.hour >= 18:
                    off_hours += 1
            except:
                pass
                
    return [file_reads, usb_inserts, network_uploads, off_hours]
