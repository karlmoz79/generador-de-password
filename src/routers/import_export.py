"""Router de importación y exportación de credenciales."""

from fastapi import APIRouter, Header
from pydantic import BaseModel, Field

from src.db import load_all_credentials, upsert_credential
from src.services.auth import verify_auth

router = APIRouter(prefix="/api", tags=["import_export"])


class ImportCredential(BaseModel):
    website: str = Field(max_length=500)
    email: str = Field(max_length=500)
    password: str = Field(max_length=500)
    force: bool = False


@router.get("/export")
def export_passwords(authorization: str | None = Header(default=None)):
    verify_auth(authorization)
    return load_all_credentials()


@router.post("/import")
def import_passwords(
    credentials: list[ImportCredential],
    action: str = "skip",
    authorization: str | None = Header(default=None),
):
    verify_auth(authorization)

    if action not in ("skip", "overwrite"):
        action = "skip"

    data = load_all_credentials()
    imported = 0
    skipped = 0

    for cred in credentials:
        if cred.website in data and action == "skip":
            skipped += 1
            continue
        upsert_credential(cred.website, cred.email, cred.password)
        imported += 1

    return {"imported": imported, "skipped": skipped}
