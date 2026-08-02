import json
import time
import threading
import websocket
from logger import logger

class AgentWSThread(threading.Thread):
    def __init__(self, api_url, device_id, command_callback):
        super().__init__()
        self.device_id = device_id
        self.command_callback = command_callback
        self.daemon = True
        self.running = True
        
        ws_base = api_url.replace("http://", "ws://").replace("https://", "wss://")
        if not ws_base.endswith("/"):
            ws_base += "/"
        self.ws_url = f"{ws_base}ws/agent?device_id={device_id}"
        self.ws = None

    def run(self):
        logger.info(f"Starting Agent WebSocket listener on {self.ws_url}")
        while self.running:
            try:
                def on_message(ws, message):
                    try:
                        data = json.loads(message)
                        if data.get("type") == "task" or "command" in data:
                            logger.info(f"WebSocket task received: {data.get('command')}")
                            if self.command_callback:
                                self.command_callback(data)
                    except Exception as e:
                        logger.error(f"Error handling WS message: {e}")

                def on_open(ws):
                    logger.info("Agent WebSocket connected to server")
                    # Send registration frame
                    ws.send(json.dumps({
                        "type": "register",
                        "device_id": self.device_id
                    }))

                def on_error(ws, error):
                    logger.debug(f"Agent WebSocket error: {error}")

                def on_close(ws, close_status_code, close_msg):
                    logger.debug("Agent WebSocket closed")

                self.ws = websocket.WebSocketApp(
                    self.ws_url,
                    on_open=on_open,
                    on_message=on_message,
                    on_error=on_error,
                    on_close=on_close
                )
                self.ws.run_forever(ping_interval=15, ping_timeout=10)
            except Exception as e:
                logger.debug(f"Agent WS connection error: {e}")
            time.sleep(5)

    def stop(self):
        self.running = False
        if self.ws:
            self.ws.close()
