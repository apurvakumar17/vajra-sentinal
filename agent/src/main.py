import time
import threading
from config import HEARTBEAT_INTERVAL, TELEMETRY_INTERVAL
from communication.api_client import send_heartbeat, send_telemetry, poll_commands
from collectors.system import collect_system_info
from collectors.simulation import collect_simulated_events
from commands.executor import execute_command

def heartbeat_loop():
    while True:
        send_heartbeat()
        time.sleep(HEARTBEAT_INTERVAL)

def telemetry_loop():
    while True:
        events = []
        events.append(collect_system_info())
        events.extend(collect_simulated_events())
        send_telemetry(events)
        time.sleep(TELEMETRY_INTERVAL)
        
def command_loop():
    while True:
        commands = poll_commands()
        for cmd in commands:
            execute_command(cmd.get("command"), cmd.get("args", {}))
        time.sleep(5)

if __name__ == "__main__":
    print("[*] Starting Sentinel Insider AI Agent...")
    
    t1 = threading.Thread(target=heartbeat_loop, daemon=True)
    t2 = threading.Thread(target=telemetry_loop, daemon=True)
    t3 = threading.Thread(target=command_loop, daemon=True)
    
    t1.start()
    t2.start()
    t3.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[*] Stopping Agent.")
