from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class EmployeeBase(BaseModel):
    email: EmailStr
    full_name: str
    department: str
    role: str
    is_active: bool = True

class EmployeeResponse(EmployeeBase):
    id: str
    risk_score: int
    device_id: Optional[str] = None
    manager: Optional[str] = None
