from app.services.risk.scorer import calculate_risk_score

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
