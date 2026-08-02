import psutil
import time

class NetworkMonitor:
    def __init__(self):
        self.last_io = psutil.net_io_counters()
        self.last_time = time.time()
        
    def get_stats(self):
        current_io = psutil.net_io_counters()
        current_time = time.time()
        
        dt = current_time - self.last_time
        
        upload_bytes = current_io.bytes_sent - self.last_io.bytes_sent
        download_bytes = current_io.bytes_recv - self.last_io.bytes_recv
        
        self.last_io = current_io
        self.last_time = current_time
        
        return {
            "upload_volume": upload_bytes,
            "download_volume": download_bytes,
            "duration": dt
        }
