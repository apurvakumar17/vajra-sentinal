@echo off
pip install pyinstaller
pyinstaller --onefile --noconsole --name SentinelAgent src/main.py
echo Build complete!
