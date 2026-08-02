import os
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from models.schemas import CopilotRequest
from services.db import db
from api.auth import get_current_user

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_system_context():
    return {
        "alerts": db.get("alerts", []),
        "employees": db.get("employees", []),
        "devices": db.get("devices", []),
        "incidents": db.get("incidents", []),
        "policies": db.get("policies", []),
        "telemetry": db.get("telemetry", [])[:20],
        "risk_history": db.get("risk_history", [])
    }

@router.post("/copilot")
async def copilot(req: CopilotRequest, current_user: dict = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    prompt = req.prompt
    
    if not api_key:
        logger.error("GEMINI_API_KEY is missing from environment variables.")
        return {"response": "Error: GEMINI_API_KEY is not configured on the server. Please add it to the environment variables to enable the AI Copilot."}
        
    try:
        logger.info(f"Received copilot request from user {current_user.get('id', 'unknown')}: {prompt}")
        client = genai.Client(api_key=api_key)
        context_data = get_system_context()
        
        context_str = (
            f"Alerts: {json.dumps(context_data['alerts'])}\n"
            f"Employees: {json.dumps(context_data['employees'])}\n"
            f"Endpoints: {json.dumps(context_data['devices'])}\n"
            f"Incidents: {json.dumps(context_data['incidents'])}\n"
            f"Policies: {json.dumps(context_data['policies'])}\n"
            f"Recent Telemetry: {json.dumps(context_data['telemetry'])}\n"
            f"Risk History: {json.dumps(context_data['risk_history'])}\n"
        )
        
        logger.info("Sending prompt to Gemini...")
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"You are an expert AI Security Analyst for the Sentinel EDR Platform. Use the provided context to answer the user's query.\n\nContext:\n{context_str}\n\nUser Query: {prompt}"
        )
        
        if hasattr(response, 'usage_metadata'):
            logger.info(f"Token usage - Prompt: {response.usage_metadata.prompt_token_count}, Candidates: {response.usage_metadata.candidates_token_count}, Total: {response.usage_metadata.total_token_count}")
            
        logger.info(f"Received response from Gemini. Length: {len(response.text)}")
        return {"response": response.text}
        
    except Exception as e:
        logger.error(f"Error during Gemini API call: {str(e)}", exc_info=True)
        # Return a clear error to the UI instead of falling back to fake analysis
        return {"response": f"AI Copilot Error: Could not generate response. Details: {str(e)}"}

