import requests
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
    try:
        response = requests.get(f"{BACKEND_URL}/agents/{AGENT_ID}/commands", timeout=5)
        if response.status_code == 200:
            commands = response.json()
            if commands:
                print(f"[+] Received {len(commands)} commands.")
            return commands
        else:
            print(f"[-] Command poll failed: {response.text}")
    except Exception as e:
        print(f"[-] Connection error during command polling: {e}")
    return []
