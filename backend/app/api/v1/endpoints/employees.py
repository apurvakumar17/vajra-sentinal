from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.user import EmployeeResponse, EmployeeCreate
from bson import ObjectId

router = APIRouter()

def serialize_mongo_doc(doc):
    doc["id"] = str(doc["_id"])
    if "current_risk_score" in doc:
        doc["risk_score"] = doc["current_risk_score"]
    del doc["_id"]
    return doc

@router.get("", response_model=List[EmployeeResponse])
async def get_employees(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    employees = await db.employees.find().to_list(length=100)
    return [serialize_mongo_doc(emp) for emp in employees]

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    try:
        obj_id = ObjectId(employee_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid employee ID format")
        
    employee = await db.employees.find_one({"_id": obj_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return serialize_mongo_doc(employee)

@router.post("", response_model=EmployeeResponse)
async def create_employee(employee_in: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    employee_dict = employee_in.dict()
    # Add default fields if needed
    if "current_risk_score" not in employee_dict or employee_dict["current_risk_score"] is None:
        employee_dict["current_risk_score"] = 0
        
    result = await db.employees.insert_one(employee_dict)
    
    # Fetch the newly created employee
    created_employee = await db.employees.find_one({"_id": result.inserted_id})
    return serialize_mongo_doc(created_employee)
