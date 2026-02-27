"""Router de estadísticas de seguridad."""

from fastapi import APIRouter, Header

from src.services.auth import verify_auth
from src.services.stats import calculate_stats

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats")
def get_stats(authorization: str | None = Header(default=None)):
    verify_auth(authorization)
    return calculate_stats()
