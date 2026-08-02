from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi.security import OAuth2PasswordBearer
from models.schemas import LoginRequest, Token
from services.db import db, pwd_context

router = APIRouter()

SECRET_KEY = "your_jwt_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = next((u for u in db["users"] if u["username"] == username), None)
    if user is None:
        raise credentials_exception
    return user

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "username": current_user["username"], "full_name": current_user.get("full_name", current_user["username"]), "role": current_user["role"], "email": current_user["email"]}

@router.post("/login", response_model=Token)
async def login(req: LoginRequest):
    print(f"Login attempt: {req.username}")
    user = next((u for u in db["users"] if (u["username"] == req.username or u["email"] == req.username or u["email"] == req.email)), None)
    if not user:
        print("User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials - User not found")
    if not pwd_context.verify(req.password, user["password_hash"]):
        print("Password mismatch")
        raise HTTPException(status_code=401, detail="Invalid credentials - Password mismatch")
    
    print(f"Login successful: {user['username']}")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user["id"], "username": user["username"], "role": user["role"]}}
