import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import jwt
from passlib.context import CryptContext
from supabase_py import create_client
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Environment variables in .env
load_dotenv()

# Supabase connection
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

# Router
router = APIRouter()

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class UserCredential(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(user: UserCredential):
    response = supabase.auth.sign_up(user.email, user.password)
    if response["status_code"] == 200:
        user_id = response["user"]["id"]
        email = response["user"]["email"]
        access_token = create_access_token({"sub": user_id, "email": email})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=400, detail=response["msg"])

@router.post("/token")
async def login(user: UserCredential):
    response = supabase.auth.sign_in(email=user.email, password=user.password)
    if response["status_code"] == 200:
        user_id = response["user"]["id"]
        email = response["user"]["email"]
        access_token = create_access_token({"sub": user_id, "email": email})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=400, detail=response["error_description"])

def create_access_token(data: dict):
    to_encode = data.copy()
    expires = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expires})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        if user_id and email:
            return {"id": user_id, "email": email}
    except jwt.JWTError:
        pass

    raise credentials_exception
