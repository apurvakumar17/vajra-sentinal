import logging
import os
from logging.handlers import RotatingFileHandler
from config import get_config

def setup_logger():
    config = get_config()
    log_dir = config.get("log_directory", "logs")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
        
    log_file = os.path.join(log_dir, "agent.log")
    
    logger = logging.getLogger("SentinelAgent")
    logger.setLevel(logging.DEBUG)
    
    # Rotate at 5MB, keep 5 backups
    handler = RotatingFileHandler(log_file, maxBytes=5*1024*1024, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    # Also log to console for debugging
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_logger()
