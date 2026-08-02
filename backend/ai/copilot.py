import os
import json
import re
from fastapi import APIRouter, Depends
from google import genai
from models.schemas import CopilotRequest
from services.db import db
from api.auth import get_current_user

router = APIRouter()

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

def local_intelligence(prompt: str) -> str:
    prompt_lower = prompt.lower()
    
    if "who are you" in prompt_lower:
        return "I am Sentinel AI Copilot. I help SOC analysts investigate alerts, endpoints, risks, telemetry and incidents."
        
    if "how many alerts" in prompt_lower or "alert count" in prompt_lower or ("alerts" in prompt_lower and "how many" in prompt_lower):
        alerts = db.get("alerts", [])
        return f"There are currently {len(alerts)} alerts in the system. {len([a for a in alerts if a.get('severity') == 'Critical'])} are Critical."
        
    if "highest risk" in prompt_lower or "highest-risk" in prompt_lower:
        employees = db.get("employees", [])
        if not employees:
            return "No employees found in the system."
        highest = max(employees, key=lambda x: x.get("risk_score", 0))
        return f"The highest risk employee is {highest['full_name']} with a risk score of {highest.get('risk_score', 0)}."
        
    if "offline endpoints" in prompt_lower or "offline device" in prompt_lower or ("endpoints" in prompt_lower and "offline" in prompt_lower):
        devices = db.get("devices", [])
        offline = [d for d in devices if d.get("status") != "online"]
        if not offline:
            return "All endpoints are currently online."
        names = ", ".join([d.get("hostname", "Unknown") for d in offline])
        return f"There are {len(offline)} offline endpoints: {names}."
        
    if "ransomware" in prompt_lower or "malware" in prompt_lower:
        return "Ransomware is a type of malware that encrypts files and demands payment to restore access. To mitigate it, monitor for mass file modifications, enforce backup policies, and use Endpoint Detection and Response (EDR) to block unauthorized encryption processes."
        
    if "summarize" in prompt_lower and "incident" in prompt_lower:
        incidents = db.get("incidents", [])
        if not incidents:
            return "There are no incidents today."
        open_incidents = [i for i in incidents if i.get("status", "") != "resolved"]
        titles = ", ".join([i.get("title", "Unknown") for i in incidents])
        return f"Today there are {len(incidents)} total incidents, with {len(open_incidents)} currently open. Incident summaries: {titles}. Review the Incidents page to investigate further."
        
    if "why is" in prompt_lower and "high risk" in prompt_lower:
        match = re.search(r"why is\s+([a-zA-Z]+)\s+high risk", prompt_lower)
        if match:
            name = match.group(1)
            emp = next((e for e in db.get("employees", []) if name.lower() in e.get("full_name", "").lower()), None)
            if emp:
                alerts = [a for a in db.get("alerts", []) if a.get("employee_id") == emp["id"]]
                reasons = ", ".join([a.get("reason", "unknown") for a in alerts])
                if not reasons:
                    reasons = "no explicit alerts found"
                return f"{emp['full_name']} has a risk score of {emp.get('risk_score', 0)} because of these alerts: {reasons}."
            return f"I couldn't find an employee named {name}."
            
    # Fallback to general stats based on keywords
    if "alert" in prompt_lower:
        alerts = db.get("alerts", [])
        return f"The system has {len(alerts)} alerts. You can view them on the Alerts page."
    if "employee" in prompt_lower:
        emps = db.get("employees", [])
        return f"There are {len(emps)} active employees being monitored."
    if "endpoint" in prompt_lower or "device" in prompt_lower:
        devices = db.get("devices", [])
        return f"There are {len(devices)} enrolled endpoints."
    if "policy" in prompt_lower or "policies" in prompt_lower:
        policies = db.get("policies", [])
        return f"There are {len(policies)} active security policies."
        
    return "I am analyzing your request locally based on system data, but I need more specific keywords like 'alerts', 'highest risk', or 'endpoints' to give a precise answer."

@router.post("/copilot")
async def copilot(req: CopilotRequest, current_user: dict = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    prompt = req.prompt
    
    # 1. Intent Detection
    local_intents = ["who are you", "how many", "highest risk", "offline", "ransomware", "summarize", "why is"]
    is_local_intent = any(k in prompt.lower() for k in local_intents)
    
    # If API key is missing or intent matches, attempt local intelligence
    if not api_key or is_local_intent:
        local_ans = local_intelligence(prompt)
        
        # If it was an explicit local intent, we return it
        if is_local_intent:
            return {"response": local_ans}
            
        # If no API key, and it wasn't a specific intent, we still return local intelligence
        if not api_key:
            return {"response": "Cloud AI is not configured. " + local_ans}
            
    # 2. Call Gemini
    try:
        client = genai.Client(api_key=api_key)
        context_data = get_system_context()
        context_str = f"Alerts: {json.dumps(context_data['alerts'])}\n"
        context_str += f"Employees: {json.dumps(context_data['employees'])}\n"
        context_str += f"Endpoints: {json.dumps(context_data['devices'])}\n"
        context_str += f"Incidents: {json.dumps(context_data['incidents'])}\n"
        context_str += f"Policies: {json.dumps(context_data['policies'])}\n"
        context_str += f"Recent Telemetry: {json.dumps(context_data['telemetry'])}\n"
        context_str += f"Risk History: {json.dumps(context_data['risk_history'])}\n"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"You are an expert AI Security Analyst for the Sentinel EDR Platform. Use the context to answer.\n\nContext:\n{context_str}\n\nUser Query: {prompt}"
        )
        return {"response": response.text}
    except Exception:
        # 3. Fallback
        local_ans = local_intelligence(prompt)
        return {"response": "Cloud AI is temporarily unavailable. Using local Sentinel Intelligence.\n\n" + local_ans}
