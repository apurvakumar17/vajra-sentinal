# Sentinel Windows Desktop Agent Integration

The backend is fully prepared to receive connections from the native Windows Desktop Agent. 
Follow the steps below to integrate the Windows Service C# / C++ agent.

## Endpoints

1. **Register**: `POST /api/v1/agent/register`
   Payload: `{ hostname, os_version, ip_address, mac_address, ram, cpu, antivirus_status, firewall_status, agent_version }`
   Response: `{ id: "DEV-...", ... }`
2. **Heartbeat**: `POST /api/v1/agent/heartbeat`
   Payload: `{ device_id }`
3. **Telemetry**: `POST /api/v1/agent/telemetry`
   Payload: `{ device_id, event_type, data }`
4. **WebSocket**: `ws://<domain>/api/v1/ws/agent`

## Authentication

Provide the authorization header:
`Authorization: Bearer secret_key_here`

