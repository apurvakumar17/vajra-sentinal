import os
import google.generativeai as genai
from app.core.config import settings

# In a real app, GEMINI_API_KEY should be set in environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

async def generate_explanation(events: list, risk_score: int):
    """
    Uses Google Gemini to provide a human-readable explanation of why a user was flagged.
    """
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
        prompt = f"""
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
        """
        response = model.generate_content(prompt)
        # In production, securely parse the JSON string response
        return response.text 
    except Exception as e:
        return {"error": str(e)}
