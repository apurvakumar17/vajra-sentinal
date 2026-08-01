import os

files = {
    "sentinel-insider-ai/backend/requirements.txt": """fastapi[all]
motor
pymongo
redis
pyjwt
passlib[bcrypt]
pydantic
pydantic-settings
uvicorn
scikit-learn
numpy
google-generativeai
""",
    "sentinel-insider-ai/backend/app/services/analytics/isolation_forest.py": """import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        # contamination sets the expected proportion of outliers (e.g., 5%)
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.is_fitted = False

    def train(self, data: np.ndarray):
        \"\"\"
        Train the model with historical feature vectors.
        data: 2D numpy array [n_samples, n_features]
        \"\"\"
        if len(data) > 0:
            self.model.fit(data)
            self.is_fitted = True

    def predict(self, data: np.ndarray):
        \"\"\"
        Returns anomaly scores and predictions.
        Predictions: 1 for normal, -1 for anomaly.
        Scores: Lower (negative) means more anomalous.
        \"\"\"
        if not self.is_fitted:
            return None, None
        
        predictions = self.model.predict(data)
        scores = self.model.score_samples(data)
        return predictions, scores

detector = AnomalyDetector()
""",
    "sentinel-insider-ai/backend/app/services/analytics/feature_engineering.py": """from datetime import datetime

def extract_features(events: list):
    \"\"\"
    Converts raw telemetry events into a numerical feature vector.
    For MVP, we extract:
    - Number of file reads
    - Number of USB insertions
    - Network upload bytes
    - Off-hours activity count
    \"\"\"
    file_reads = 0
    usb_inserts = 0
    network_uploads = 0
    off_hours = 0
    
    for event in events:
        event_type = event.get("event_type")
        payload = event.get("payload", {})
        ts_str = event.get("timestamp")
        
        if event_type == "file_access" and payload.get("action") == "read":
            file_reads += 1
        elif event_type == "usb_insert":
            usb_inserts += 1
        elif event_type == "network_conn":
            network_uploads += payload.get("upload_bytes", 0)
            
        if ts_str:
            try:
                # Basic off-hours check (e.g., outside 8 AM - 6 PM)
                dt = datetime.fromisoformat(ts_str.replace("Z", ""))
                if dt.hour < 8 or dt.hour >= 18:
                    off_hours += 1
            except:
                pass
                
    return [file_reads, usb_inserts, network_uploads, off_hours]
""",
    "sentinel-insider-ai/backend/app/services/risk/scorer.py": """def calculate_risk_score(anomaly_score: float, features: list):
    \"\"\"
    Translates the Isolation Forest anomaly score into a 0-100 Risk Score.
    The anomaly score from Isolation Forest is usually between -1.0 (anomalous) and 1.0 (normal).
    \"\"\"
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
""",
    "sentinel-insider-ai/backend/app/services/risk/explainable_ai.py": """import os
import google.generativeai as genai
from app.core.config import settings

# In a real app, GEMINI_API_KEY should be set in environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

async def generate_explanation(events: list, risk_score: int):
    \"\"\"
    Uses Google Gemini to provide a human-readable explanation of why a user was flagged.
    \"\"\"
    if GEMINI_API_KEY == "YOUR_API_KEY":
        # Fallback for hackathon testing without a real key
        return {
            "Reason": "AI model detected anomalous data egress.",
            "Evidence": f"{len(events)} suspicious events triggered a score of {risk_score}.",
            "MITRE": "T1052 - Exfiltration",
            "Confidence": "85%"
        }
        
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f\"\"\"
        You are a senior SOC Analyst AI. Explain the following insider threat incident.
        User Risk Score: {risk_score} (0-100)
        Events: {events}
        
        Provide the response strictly in this JSON format:
        {{
            "Reason": "Short sentence explaining the core deviation.",
            "Evidence": "Specific metrics or file paths.",
            "MITRE": "Closest MITRE ATT&CK T-Code mapping.",
            "Confidence": "Percentage e.g., 90%"
        }}
        \"\"\"
        response = model.generate_content(prompt)
        # In production, securely parse the JSON string response
        return response.text 
    except Exception as e:
        return {"error": str(e)}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Phase 5 Scaffolding completed.")
