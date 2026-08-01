import os

files = {
    "sentinel-insider-ai/agent/requirements.txt": """requests
psutil
""",
    "sentinel-insider-ai/agent/build.bat": """@echo off
pip install pyinstaller
pyinstaller --onefile --noconsole --name SentinelAgent src/main.py
echo Build complete!
""",
    "sentinel-insider-ai/agent/src/config.py": """import os
import socket

# Agent Configuration
AGENT_ID = os.getenv("AGENT_ID", "AGT-003") # For MVP, default to Rahul's agent
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000/api/v1")
HOSTNAME = socket.gethostname()
HEARTBEAT_INTERVAL = 10  # seconds
TELEMETRY_INTERVAL = 30  # seconds
""",
    "sentinel-insider-ai/agent/src/communication/api_client.py": """import requests
import time
from config import BACKEND_URL, AGENT_ID, HOSTNAME

def send_heartbeat():
    payload = {
        "agent_id": AGENT_ID,
        "hostname": HOSTNAME,
        "status": "online"
    }
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/heartbeat", json=payload, timeout=5)
        if response.status_code == 200:
            print("[+] Heartbeat sent successfully.")
        else:
            print(f"[-] Heartbeat failed: {response.text}")
    except Exception as e:
        print(f"[-] Connection error during heartbeat: {e}")

def send_telemetry(events):
    if not events:
        return
    payload = {
        "agent_id": AGENT_ID,
        "events": events
    }
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/events", json=payload, timeout=5)
        if response.status_code == 200:
            print(f"[+] Sent {len(events)} telemetry events.")
        else:
            print(f"[-] Telemetry failed: {response.text}")
    except Exception as e:
        print(f"[-] Connection error during telemetry: {e}")

def poll_commands():
    # In a real scenario, this would use WebSockets or long-polling.
    # For MVP, we simulate an empty command queue.
    return []
""",
    "sentinel-insider-ai/agent/src/collectors/system.py": """import psutil
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
""",
    "sentinel-insider-ai/agent/src/collectors/simulation.py": """import random
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
""",
    "sentinel-insider-ai/agent/src/commands/executor.py": """import os
import sys

def execute_command(cmd_name, cmd_args):
    print(f"[*] Executing remote command: {cmd_name}")
    if cmd_name == "lock_workstation":
        # Windows specific lock command
        os.system("rundll32.exe user32.dll,LockWorkStation")
    elif cmd_name == "kill_process":
        pid = cmd_args.get("pid")
        if pid:
            try:
                os.kill(int(pid), 9)
                print(f"[+] Killed process {pid}")
            except Exception as e:
                print(f"[-] Failed to kill process {pid}: {e}")
    elif cmd_name == "restart_agent":
        print("[*] Restarting agent...")
        os.execv(sys.executable, ['python'] + sys.argv)
    else:
        print(f"[-] Unknown command: {cmd_name}")
""",
    "sentinel-insider-ai/agent/src/main.py": """import time
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
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Phase 4 Scaffolding completed.")
