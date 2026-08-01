def test_telemetry_heartbeat(client):
    payload = {
        "agent_id": "AGT-TEST",
        "hostname": "TEST-HOST",
        "status": "online"
    }
    response = client.post("/api/v1/telemetry/heartbeat", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "received"

def test_telemetry_events(client):
    payload = {
        "agent_id": "AGT-TEST",
        "events": [
            {
                "agent_id": "AGT-TEST",
                "event_type": "file_access",
                "payload": {"file_path": "C:/test.txt", "action": "read"}
            }
        ]
    }
    response = client.post("/api/v1/telemetry/events", json=payload)
    assert response.status_code == 200
    assert response.json()["count"] == 1
