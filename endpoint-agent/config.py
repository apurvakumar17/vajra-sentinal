import json
import os
import sys

_config_cache = None

def get_config():
    global _config_cache
    if _config_cache is not None:
        return _config_cache
        
    config_path = os.path.join(os.path.dirname(sys.executable if getattr(sys, 'frozen', False) else __file__), 'config.json')
    
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            _config_cache = json.load(f)
    else:
        # Default fallback
        _config_cache = {
            "api_url": "http://localhost:3000/api/v1",
            "organization_id": "DEFAULT",
            "agent_secret": "",
            "heartbeat_interval": 30,
            "log_directory": "logs"
        }
    return _config_cache
