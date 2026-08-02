import ctypes
import os
import sys
from logger import logger

def execute_command(cmd):
    action = cmd.get("command")
    logger.info(f"Executing remote command: {action}")
    
    if action == "lock_workstation":
        ctypes.windll.user32.LockWorkStation()
        return True
        
    elif action == "restart_agent":
        # Restart the current executable
        os.execv(sys.executable, ['python'] + sys.argv)
        return True
        
    elif action == "display_warning":
        message = cmd.get("message", "Security Warning from IT")
        ctypes.windll.user32.MessageBoxW(0, message, "Sentinel Alert", 0x30 | 0x0)
        return True
        
    logger.warning(f"Unknown command: {action}")
    return False
