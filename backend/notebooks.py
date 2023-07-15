import re
import os
import subprocess
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from pymongo import MongoClient
from auth import get_current_user
from datetime import datetime

# MongoDB connection
client = MongoClient(os.getenv('MONGO_URL'))
db = client["notebooks"]
notebooks_collection = db["notebooks"]

# Router
router = APIRouter()

class NotebookCreateRequest(BaseModel):
    filename: str

class NotebookDetailResponse(BaseModel):
    filename: str
    content: str
    latest_run: str

class NotebookResponse(BaseModel):
    id: str
    filename: str

class NotebookUpdateRequest(BaseModel):
    filename: str
    content: str

class NotebookRunResponse(BaseModel):
    output: str

# Create new notebook
@router.post("/", response_model=NotebookResponse)
async def create_notebook(
    notebook: NotebookCreateRequest, current_user: dict = Depends(get_current_user)
):
    notebook_data = notebook.dict()
    notebook_data["content"] = ""
    notebook_data["latest_run"] = ""
    notebook_data["created_at"] = datetime.now()
    notebook_data["updated_at"] = datetime.now()
    notebook_data["user"] = current_user["id"]
    result = notebooks_collection.insert_one(notebook_data)
    notebook_data["id"] = str(result.inserted_id)
    return notebook_data

# Get all notebooks for account
@router.get("/", response_model=list[NotebookResponse])
async def list_notebooks(current_user: dict = Depends(get_current_user)):
    notebooks = notebooks_collection.find({ "user": current_user["id"] }, { "_id": 1, "filename": 1 })
    notebooks_response = [{"id": str(notebook["_id"]), "filename": notebook["filename"]} for notebook in notebooks]
    return notebooks_response

# Get a specific notebook
@router.get("/{notebook_id}", response_model=NotebookDetailResponse)
async def get_notebook(
    notebook_id: str, current_user: dict = Depends(get_current_user)
):
    notebook = notebooks_collection.find_one({"_id": ObjectId(notebook_id)})
    if notebook:
        return notebook
    raise HTTPException(status_code=404, detail="Notebook not found")

# Update a specific notebook
@router.put("/{notebook_id}", response_model=NotebookDetailResponse)
async def update_notebook(
    notebook_id: str,
    notebook: NotebookUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    notebook_data = notebook.dict()
    notebook_data["updated_at"] = datetime.now()
    result = notebooks_collection.update_one(
        {"_id": ObjectId(notebook_id)}, {"$set": notebook_data}
    )
    if result.modified_count == 1:
        updated_notebook = notebooks_collection.find_one(
            {"_id": ObjectId(notebook_id)}
        )
        return updated_notebook
    raise HTTPException(status_code=404, detail="Notebook not found")

# Delete a specific notebook
@router.delete("/{notebook_id}")
async def delete_notebook(
    notebook_id: str, current_user: dict = Depends(get_current_user)
):
    result = notebooks_collection.delete_one({"_id": ObjectId(notebook_id)})
    if result.deleted_count == 1:
        return {"message": "Notebook deleted successfully"}
    raise HTTPException(status_code=404, detail="Notebook not found")

# Run a specific notebook
@router.post("/{notebook_id}/run", response_model=NotebookRunResponse)
async def run_notebook(
    notebook_id: str, current_user: dict = Depends(get_current_user)
):
    notebook = notebooks_collection.find_one({"_id": ObjectId(notebook_id)})
    if notebook:
        code_blocks = re.findall(r"```python\n(.*?)```", notebook["content"], re.DOTALL)
        output = ""
        for code_block in code_blocks:
            process = await asyncio.create_subprocess_exec(
                "python", "-c", code_block,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            stdout, stderr = await process.communicate()
            output += stdout.decode() + stderr.decode()

        notebooks_collection.update_one(
            {"_id": ObjectId(notebook_id)}, {"$set": {"latest_run": output}}
        )
        return {"output": output}
    raise HTTPException(status_code=404, detail="Notebook not found")
