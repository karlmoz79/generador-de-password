"""Router de verificación de brechas (breach checking)."""

from fastapi import APIRouter, Header, HTTPException

from src.services.auth import verify_auth
from src.services.breach_checker import check_all_breaches, check_single_breach

router = APIRouter(prefix="/api", tags=["breach"])


@router.get("/check-breach/{website}")
def check_breach_endpoint(
    website: str, authorization: str | None = Header(default=None)
):
    verify_auth(authorization)

    try:
        result = check_single_breach(website)
    except KeyError:
        raise HTTPException(status_code=404, detail="Website not found")

    return {
        "website": result.website,
        "breached": result.breached,
        "count": result.count,
    }


@router.get("/check-all-breaches")
def check_all_breaches_endpoint(
    authorization: str | None = Header(default=None),
):
    verify_auth(authorization)

    results = check_all_breaches()
    return [
        {
            "website": r.website,
            "breached": r.breached,
            "count": r.count,
        }
        for r in results
    ]
