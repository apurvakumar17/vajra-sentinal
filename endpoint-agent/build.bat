@echo off
echo Starting Sentinel Endpoint Agent Build Process...
echo.

echo 1. Installing requirements...
pip install -r requirements.txt

echo.
echo 2. Running PyInstaller...
pyinstaller --clean SentinelEndpointAgent.spec

echo.
echo 3. Copying to downloads directory...
mkdir ..\frontend\public\downloads 2>nul
copy /Y dist\SentinelEndpointAgent.exe ..\frontend\public\downloads\SentinelEndpointAgent.exe

echo.
echo Build Complete!
echo You can find the executable in the 'dist' folder and in the web portal downloads.
pause
