import subprocess
import asyncio
import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from bson import ObjectId
from pymongo import MongoClient
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase_py import create_client
from dotenv import load_dotenv

# Environment variables in .env
load_dotenv()

# MongoDB connection
client = MongoClient(os.getenv('MONGO_URL'))
db = client["notebooks"]
notebooks_collection = db["notebooks"]

# Supabase connection
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

# FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.post("/auth/signup")
async def signup(user: UserCredential):
    response = supabase.auth.sign_up(user.email, user.password)
    if response["status_code"] == 200:
        user_id = response["user"]["id"]
        email = response["user"]["email"]
        access_token = create_access_token({"sub": user_id, "email": email})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=400, detail=response["msg"])


# Auth route
@app.post("/auth/token")
async def login(user: UserCredential):
    response = supabase.auth.sign_in(email=user.email, password=user.password)
    if response["status_code"] == 200:
        user_id = response["user"]["id"]
        email = response["user"]["email"]
        access_token = create_access_token({"sub": user_id, "email": email})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=400, detail=response["error_description"])

# Token creation
def create_access_token(data: dict):
    to_encode = data.copy()
    expires = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expires})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Token verification
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
    except JWTError:
        pass

    raise credentials_exception

# Model for creating a new notebook
class NotebookCreateRequest(BaseModel):
    filename: str
    content: str

class NotebookListResponse(BaseModel):
    id: str
    filename: str

# Model for updating a notebook
class NotebookUpdateRequest(BaseModel):
    filename: str
    content: str

# Model for notebook run response
class NotebookRunResponse(BaseModel):
    output: str

# Endpoint to create a new notebook
@app.post("/notebooks", response_model=NotebookCreateRequest)
async def create_notebook(
    notebook: NotebookCreateRequest, current_user: str = Depends(get_current_user)
):
    notebook_data = notebook.dict()
    notebook_data["created_at"] = datetime.now()
    notebook_data["updated_at"] = datetime.now()
    notebook_data["user"] = current_user["id"]
    result = notebooks_collection.insert_one(notebook_data)
    notebook_data["_id"] = result.inserted_id
    return notebook_data

# Endpoint to get a list of notebooks
@app.get("/notebooks", response_model=list[NotebookListResponse])
async def list_notebooks(current_user: str = Depends(get_current_user)):
    notebooks = notebooks_collection.find({ "user": current_user["id"] }, { "_id": 1, "filename": 1 })
    notebooks_response = [{"id": str(notebook["_id"]), "filename": notebook["filename"]} for notebook in notebooks]
    return notebooks_response

# Endpoint to get a notebook by ID
@app.get("/notebooks/{notebook_id}", response_model=NotebookCreateRequest)
async def get_notebook(
    notebook_id: str, current_user: str = Depends(get_current_user)
):
    notebook = await notebooks_collection.find_one({"_id": ObjectId(notebook_id)})
    if notebook:
        return notebook
    raise HTTPException(status_code=404, detail="Notebook not found")

# Endpoint to update a notebook by ID
@app.put("/notebooks/{notebook_id}", response_model=NotebookCreateRequest)
async def update_notebook(
    notebook_id: str,
    notebook: NotebookUpdateRequest,
    current_user: str = Depends(get_current_user),
):
    notebook_data = notebook.dict()
    notebook_data["updated_at"] = datetime.now()
    result = await notebooks_collection.update_one(
        {"_id": ObjectId(notebook_id)}, {"$set": notebook_data}
    )
    if result.modified_count == 1:
        updated_notebook = await notebooks_collection.find_one(
            {"_id": ObjectId(notebook_id)}
        )
        return updated_notebook
    raise HTTPException(status_code=404, detail="Notebook not found")

# Endpoint to delete a notebook by ID
@app.delete("/notebooks/{notebook_id}")
async def delete_notebook(
    notebook_id: str, current_user: str = Depends(get_current_user)
):
    result = await notebooks_collection.delete_one({"_id": ObjectId(notebook_id)})
    if result.deleted_count == 1:
        return {"message": "Notebook deleted successfully"}
    raise HTTPException(status_code=404, detail="Notebook not found")

# Endpoint to run a notebook by ID
@app.post("/notebooks/{notebook_id}/run", response_model=NotebookRunResponse)
async def run_notebook(
    notebook_id: str, current_user: str = Depends(get_current_user)
):
    notebook = await notebooks_collection.find_one({"_id": ObjectId(notebook_id)})
    if notebook:
        code_lines = notebook["content"].split("\n")
        output = ""
        for line in code_lines:
            process = await asyncio.create_subprocess_shell(
                line,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            stdout, stderr = await process.communicate()
            output += stdout.decode() + stderr.decode()

        notebook_run = {
            "timestamp": datetime.now(),
            "output": output,
        }
        await notebooks_collection.update_one(
            {"_id": ObjectId(notebook_id)}, {"$set": {"latest_run": notebook_run}}
        )
        return {"output": output}
    raise HTTPException(status_code=404, detail="Notebook not found")
