import os
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from models.schemas import CopilotRequest
from services.db import db
from api.auth import get_current_user

router = APIRouter()

@router.post("/copilot")
async def copilot(req: CopilotRequest, current_user: dict = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        high_risk_names = ", ".join([e["full_name"] for e in db["employees"] if e["risk_score"] >= 70])
        return {"response": f"(Simulated AI) Based on the data: Alerts: {len(db['alerts'])}, High Risk: {high_risk_names}. I understood your prompt: '{req.prompt}'. Add GEMINI_API_KEY to use real AI."}
    
    try:
        client = genai.Client(api_key=api_key)
        high_risk_emp = next((e for e in db["employees"] if e["risk_score"] >= 70), None)
        context = f"System Data: {len(db['employees'])} employees, {len(db['alerts'])} alerts. High risk employee: {high_risk_emp['full_name'] if high_risk_emp else 'None'}."
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"You are an AI Security Analyst. Context: {context}\n\nUser Query: {req.prompt}"
        )
        return {"response": response.text}
    except Exception as e:
        high_risk_names = ", ".join([e["full_name"] for e in db["employees"] if e["risk_score"] >= 70])
        return {"response": f"(Simulated AI Fallback due to API Error: {str(e)[:50]}...) Based on the data: Alerts: {len(db['alerts'])}, High Risk: {high_risk_names}. I understood your prompt: '{req.prompt}'."}
