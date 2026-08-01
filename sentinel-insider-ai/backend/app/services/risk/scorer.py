def calculate_risk_score(anomaly_score: float, features: list):
    """
    Translates the Isolation Forest anomaly score into a 0-100 Risk Score.
    The anomaly score from Isolation Forest is usually between -1.0 (anomalous) and 1.0 (normal).
    """
    # Base mapping: normalize from [-1, 1] to [0, 100], where -1 = 100 risk, 1 = 0 risk.
    # We clip the score for safety.
    norm_score = (1.0 - anomaly_score) / 2.0  # now 0.0 to 1.0
    risk = int(norm_score * 100)
    
    # Heuristic adjustments
    file_reads, usb_inserts, network_uploads, off_hours = features
    
    if usb_inserts > 0 and file_reads > 10:
        risk += 30  # High heuristic weight for mass copy + USB
        
    if off_hours > 5:
        risk += 15
        
    return min(max(risk, 0), 100)
