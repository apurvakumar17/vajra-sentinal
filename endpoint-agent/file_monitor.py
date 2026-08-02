import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from logger import logger
import os

class SensitiveFileHandler(FileSystemEventHandler):
    def __init__(self, callback):
        self.callback = callback

    def on_created(self, event):
        self._log_event("FILE_CREATED", event)

    def on_modified(self, event):
        self._log_event("FILE_MODIFIED", event)
        
    def on_deleted(self, event):
        self._log_event("FILE_DELETED", event)

    def _log_event(self, type_name, event):
        if event.is_directory:
            return
            
        self.callback({
            "event_type": type_name,
            "file_path": event.src_path
        })

class FileMonitor:
    def __init__(self, callback):
        self.observer = Observer()
        self.handler = SensitiveFileHandler(callback)
        self.paths_to_monitor = [
            os.path.expanduser("~\\Documents"),
            os.path.expanduser("~\\Desktop")
        ]
        
    def start(self):
        for path in self.paths_to_monitor:
            if os.path.exists(path):
                self.observer.schedule(self.handler, path, recursive=True)
                logger.info(f"Started monitoring {path}")
        self.observer.start()
        
    def stop(self):
        self.observer.stop()
        self.observer.join()
