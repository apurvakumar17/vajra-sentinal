import win32com.client
import pythoncom
import threading
from logger import logger

class USBMonitor(threading.Thread):
    def __init__(self, callback):
        super().__init__()
        self.daemon = True
        self.callback = callback
        self.running = True
        
    def run(self):
        pythoncom.CoInitialize()
        wmi = win32com.client.GetObject ("winmgmts:")
        
        # Monitor for USB drive insertions (Win32_Volume where DriveType=2 usually means Removable)
        watcher = wmi.ExecNotificationQuery(
            "SELECT * FROM __InstanceCreationEvent WITHIN 2 WHERE TargetInstance ISA 'Win32_LogicalDisk' AND TargetInstance.DriveType = 2"
        )
        
        while self.running:
            try:
                event = watcher.NextEvent(2000)
                drive = event.Properties_("TargetInstance").Value.DeviceID
                volume_name = event.Properties_("TargetInstance").Value.VolumeName
                
                logger.warning(f"USB Device Inserted: {drive} ({volume_name})")
                self.callback({
                    "event_type": "USB_INSERTED",
                    "drive": drive,
                    "volume_name": volume_name
                })
            except Exception:
                pass
                
    def stop(self):
        self.running = False
