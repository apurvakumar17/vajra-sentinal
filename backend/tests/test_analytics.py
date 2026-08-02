import numpy as np
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
