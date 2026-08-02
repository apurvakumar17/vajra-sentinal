from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str = None
    email: str = None
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class CommandRequest(BaseModel):
    command: str

class CopilotRequest(BaseModel):
    prompt: str

class IncidentStatusUpdate(BaseModel):
    status: str
