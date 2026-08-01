from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas.user import Token
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

# Mock user for MVP Phase 2
MOCK_USER = {
    "email": "admin@sentinel.ai",
    "hashed_password": get_password_hash("admin") # password: admin
}

@router.post("/login", response_model=Token)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # In Phase 3 we will integrate this with MongoDB
    if form_data.username != MOCK_USER["email"] or not verify_password(form_data.password, MOCK_USER["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
