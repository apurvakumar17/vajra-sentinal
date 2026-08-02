import requests
import json
import time
from config import get_config
from logger import logger

class APIClient:
    def __init__(self):
        self.config = get_config()
        self.base_url = self.config["api_url"]
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.config['agent_secret']}"
        }

    def register_device(self, device_info):
        url = f"{self.base_url}/agent/register"
        try:
            res = requests.post(url, headers=self.headers, json=device_info, timeout=10)
            res.raise_for_status()
            logger.info("Device registered successfully.")
            return res.json()
        except Exception as e:
            logger.error(f"Failed to register device: {e}")
            return None

    def send_telemetry(self, payload):
        url = f"{self.base_url}/agent/telemetry"
        try:
            res = requests.post(url, headers=self.headers, json=payload, timeout=10)
            return res.status_code == 200
        except Exception as e:
            logger.error(f"Failed to send telemetry: {e}")
            return False

    def send_heartbeat(self, device_id):
        url = f"{self.base_url}/agent/heartbeat"
        try:
            res = requests.post(url, headers=self.headers, json={"device_id": device_id}, timeout=10)
            if res.status_code == 200:
                # Backend can return pending commands in heartbeat response
                return res.json().get("commands", [])
            return []
        except Exception as e:
            logger.error(f"Failed to send heartbeat: {e}")
            return []

    def send_task_result(self, payload):
        url = f"{self.base_url}/agent/task/result"
        try:
            res = requests.post(url, headers=self.headers, json=payload, timeout=10)
            return res.status_code == 200
        except Exception as e:
            logger.error(f"Failed to send task result: {e}")
            return False
