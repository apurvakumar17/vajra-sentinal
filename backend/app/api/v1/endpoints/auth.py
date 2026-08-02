from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token
from app.schemas.user import Token
from datetime import timedelta
from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    user = await db.users.find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username, "role": user.get("role")}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user = dict(current_user)
    user["id"] = str(user["_id"])
    del user["_id"]
    del user["hashed_password"]
    
    # Ensure they have a name
    if "full_name" not in user:
        user["full_name"] = "Admin User"
        
    return user
