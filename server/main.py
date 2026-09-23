from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url="/docs")
