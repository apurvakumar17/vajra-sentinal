from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class EmployeeBase(BaseModel):
    email: Optional[str] = None
    full_name: str
    department: str
    role: str
    is_active: bool = True
    photo_url: Optional[str] = None
    current_risk_score: Optional[int] = 0

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: str
    risk_score: int = 0
    device_id: Optional[str] = None
    manager: Optional[str] = None
