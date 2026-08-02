import numpy as np
import datetime
from app.core.database import get_db, get_redis
from app.schemas.telemetry import TelemetryBatch, Heartbeat
from app.services.analytics.feature_engineering import extract_features
from app.services.analytics.isolation_forest import detector
from app.services.risk.scorer import calculate_risk_score
from app.services.risk.explainable_ai import generate_explanation

async def process_heartbeat(heartbeat: Heartbeat):
    db = get_db()
    if db is not None:
        await db.endpoints.update_one(
            {"agent_id": heartbeat.agent_id},
            {"$set": {"hostname": heartbeat.hostname, "status": heartbeat.status, "last_heartbeat": heartbeat.timestamp}},
            upsert=True
        )
    redis = get_redis()
    if redis is not None:
        await redis.setex(f"agent:{heartbeat.agent_id}:status", 300, "online")

async def process_telemetry_batch(batch: TelemetryBatch):
    db = get_db()
    if db is not None:
        events_docs = [event.dict() for event in batch.events]
        if events_docs:
            await db.telemetry_events.insert_many(events_docs)
            
            # Extract features for ML model
            features = extract_features(events_docs)
            feature_vector = np.array([features])
            
            # Predict Anomaly
            if not detector.is_fitted:
                # Basic mock training data for MVP hackathon
                mock_data = np.array([[0, 0, 0, 0], [1, 0, 500, 0], [2, 0, 1000, 1], [0, 0, 0, 0]])
                detector.train(mock_data)
                
            predictions, scores = detector.predict(feature_vector)
            anomaly_score = float(scores[0]) if scores is not None else 0.0
            
            # Calculate Risk Score
            risk_score = calculate_risk_score(anomaly_score, features)
            
            # If high risk, generate Alert and Explanation
            if risk_score > 60:
                explanation = await generate_explanation(events_docs, risk_score)
                alert_doc = {
                    "employee_id": batch.agent_id, # For MVP mapping agent_id -> employee_id
                    "severity": "Critical" if risk_score > 80 else "High",
                    "reason": "AI detected anomalous behavior",
                    "status": "open",
                    "timestamp": datetime.datetime.utcnow(),
                    "evidence": explanation,
                    "confidence": f"{risk_score}%",
                    "raw_data": {"features": features, "anomaly_score": anomaly_score}
                }
                await db.alerts.insert_one(alert_doc)
