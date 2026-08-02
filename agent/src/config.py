import os
import socket

# Agent Configuration
AGENT_ID = os.getenv("AGENT_ID", "AGT-003") # For MVP, default to Rahul's agent
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000/api/v1")
HOSTNAME = socket.gethostname()
HEARTBEAT_INTERVAL = 10  # seconds
TELEMETRY_INTERVAL = 30  # seconds
