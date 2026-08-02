import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        # contamination sets the expected proportion of outliers (e.g., 5%)
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.is_fitted = False

    def train(self, data: np.ndarray):
        """
        Train the model with historical feature vectors.
        data: 2D numpy array [n_samples, n_features]
        """
        if len(data) > 0:
            self.model.fit(data)
            self.is_fitted = True

    def predict(self, data: np.ndarray):
        """
        Returns anomaly scores and predictions.
        Predictions: 1 for normal, -1 for anomaly.
        Scores: Lower (negative) means more anomalous.
        """
        if not self.is_fitted:
            return None, None
        
        predictions = self.model.predict(data)
        scores = self.model.score_samples(data)
        return predictions, scores

detector = AnomalyDetector()
