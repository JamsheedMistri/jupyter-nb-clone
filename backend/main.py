from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from notebooks import router as notebooks_router

app = FastAPI()

# Allow CORS, since frontend is running on another origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include each of the auth and notebook routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(notebooks_router, prefix="/notebooks", tags=["Notebooks"])
