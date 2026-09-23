from fastapi import APIRouter
from server.api.v1.endpoints import sync, caregiver, auth, reminders, asha, games

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(caregiver.router, prefix="", tags=["caregiver"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(asha.router, prefix="/asha", tags=["asha"])
api_router.include_router(games.router, prefix="/games", tags=["games"])
