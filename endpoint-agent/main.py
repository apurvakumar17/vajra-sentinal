import sys
import os
from agent import SentinelAgent
from logger import logger

def main():
    try:
        agent = SentinelAgent()
        agent.start()
    except Exception as e:
        logger.critical(f"Agent crashed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
