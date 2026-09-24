import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from server.api.v1.router import api_router
from server.core.config import settings
from server.db.session import engine
from server.db.models import Base
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    from server.init_db import init_db
    try:
        await init_db()
    except Exception as e:
        print(f"Database initialization notice: {e}")
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

extra_origins = [
    origin.strip() 
    for origin in os.environ.get("ALLOWED_ORIGINS", "").split(",") 
    if origin.strip()
]

if extra_origins:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"] + extra_origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Seamlessly allow all deployed frontend domains (Vercel, Netlify, Render, preview URLs) with credentials
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/ml-lab", include_in_schema=False)
async def ml_lab():
    lab_path = os.path.join(static_dir, "ml_lab.html")
    if os.path.exists(lab_path):
        return FileResponse(lab_path)
    return {"message": "ML Lab UI not found"}

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url="/docs")

