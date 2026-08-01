import os

files = {
    "sentinel-insider-ai/backend/tests/conftest.py": """import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
""",
    "sentinel-insider-ai/backend/tests/test_api_auth.py": """def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@sentinel.ai", "password": "admin"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_fail(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@sentinel.ai", "password": "wrongpassword"}
    )
    assert response.status_code == 400
""",
    "sentinel-insider-ai/backend/tests/test_api_telemetry.py": """def test_telemetry_heartbeat(client):
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
""",
    "sentinel-insider-ai/backend/tests/test_analytics.py": """import numpy as np
from app.services.analytics.isolation_forest import detector
from app.services.analytics.feature_engineering import extract_features

def test_feature_extraction():
    events = [
        {"event_type": "file_access", "payload": {"action": "read"}, "timestamp": "2026-08-01T12:00:00Z"},
        {"event_type": "usb_insert", "payload": {}, "timestamp": "2026-08-01T12:05:00Z"}
    ]
    # Expecting: [file_reads, usb_inserts, network_uploads, off_hours]
    features = extract_features(events)
    assert features == [1, 1, 0, 0]

def test_isolation_forest():
    # Train with normal data
    normal_data = np.array([[1, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [1, 0, 100, 0]] * 10)
    detector.train(normal_data)
    
    assert detector.is_fitted == True
    
    # Test normal data
    preds, scores = detector.predict(np.array([[1, 0, 0, 0]]))
    assert preds[0] == 1 # 1 is normal
    
    # Test anomalous data (Mass copy to USB off-hours)
    anomalous_data = np.array([[50, 1, 5000000, 1]])
    preds, scores = detector.predict(anomalous_data)
    assert preds[0] == -1 # -1 is anomaly
""",
    "sentinel-insider-ai/backend/tests/test_risk_scorer.py": """from app.services.risk.scorer import calculate_risk_score

def test_calculate_risk_score_normal():
    # Anomaly score close to 1.0 is very normal
    score = calculate_risk_score(0.8, [1, 0, 0, 0])
    # (1.0 - 0.8) / 2 = 0.1 * 100 = 10
    assert score == 10

def test_calculate_risk_score_anomaly():
    # Anomaly score of -0.5 is anomalous
    score = calculate_risk_score(-0.5, [2, 0, 0, 0])
    # (1.0 - (-0.5)) / 2 = 1.5 / 2 = 0.75 * 100 = 75
    assert score == 75

def test_calculate_risk_score_heuristics():
    # Heuristics: High file read + USB
    # Base score: 0.0 -> 50
    # Heuristics add 30
    score = calculate_risk_score(0.0, [20, 1, 0, 0])
    assert score == 80
""",
    "sentinel-insider-ai/backend/requirements-test.txt": """pytest
pytest-asyncio
httpx
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Phase 8 Scaffolding completed.")
