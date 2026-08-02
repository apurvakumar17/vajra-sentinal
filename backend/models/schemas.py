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

class PolicyCreate(BaseModel):
    name: str
    description: str
    type: str = "custom"
    status: str = "enabled"
    severity: str = "medium"
    rules: dict = {}

class PolicyUpdate(BaseModel):
    name: str = None
    description: str = None
    type: str = None
    status: str = None
    severity: str = None
    rules: dict = None

class ReportGenerateRequest(BaseModel):
    title: str = "New Report"

class IncidentUpdate(BaseModel):
    status: str = None
    assigned_to: str = None
    notes: str = None

class AlertStatusUpdate(BaseModel):
    status: str

class EmployeeCreate(BaseModel):
    full_name: str
    department: str
    role: str

class NotificationReadRequest(BaseModel):
    id: str = None

class TaskLockRequest(BaseModel):
    employee_id: str = None
    device_id: str = None

class TaskLogoutRequest(BaseModel):
    employee_id: str = None
    device_id: str = None

class TaskKillProcessRequest(BaseModel):
    employee_id: str = None
    device_id: str = None
    process_name: str = None
    pid: int = None

class TaskCollectForensicsRequest(BaseModel):
    employee_id: str = None
    device_id: str = None
    depth: str = "standard"

class TaskRestartAgentRequest(BaseModel):
    employee_id: str = None
    device_id: str = None

class TaskResultRequest(BaseModel):
    task_id: str
    device_id: str = None
    status: str
    result: dict = None

