"""Router de eventos de auditoría."""

from fastapi import APIRouter, Header

from src.db import load_events
from src.services.auth import verify_auth

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events")
def get_events(authorization: str | None = Header(default=None)):
    verify_auth(authorization)
    return load_events()
