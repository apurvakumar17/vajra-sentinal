# Sentinel Endpoint Agent

A lightweight, production-ready Windows agent for the Sentinel Enterprise Insider Threat Detection platform.

## Features
- Background execution
- Periodic heartbeats
- Real-time telemetry (Network, USB, File Activity)
- Remote command execution (Lock Workstation, Restart, Warn)
- Rotating logs

## Prerequisites
- Windows 10/11
- Python 3.11+

## Building the Executable
To package the agent into a standalone executable:
1. Run `build.bat`
2. The executable will be generated at `dist/SentinelEndpointAgent.exe`.

## Deployment
Place the `config.json` alongside the `.exe` (if overridden values are needed), or rely on the embedded defaults. Run the executable as Administrator.
