import win32api
import time

class ActivityMonitor:
    def __init__(self):
        self.last_input_time = self.get_last_input_time()
        
    def get_last_input_time(self):
        try:
            return win32api.GetLastInputInfo()
        except Exception:
            return 0
            
    def get_idle_time(self):
        try:
            current = win32api.GetTickCount()
            last = self.get_last_input_time()
            return (current - last) / 1000.0
        except Exception:
            return 0
