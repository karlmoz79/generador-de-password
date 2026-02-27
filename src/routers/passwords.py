"""Router de CRUD de credenciales."""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from src.db import (
    delete_credential,
    get_credential,
    load_all_credentials,
    save_event,
    upsert_credential,
)
from src.services.auth import verify_auth

router = APIRouter(prefix="/api", tags=["passwords"])


class Credential(BaseModel):
    website: str = Field(max_length=500)
    email: str = Field(max_length=500)
    password: str = Field(max_length=500)
    force: bool = False


@router.get("/password/{website}")
def get_password(website: str, authorization: str | None = Header(default=None)):
    verify_auth(authorization)

    cred = get_credential(website)
    if cred is None:
        raise HTTPException(
            status_code=404, detail="No details for the website exist"
        )

    save_event(
        "Búsqueda Existosa",
        f"Credenciales consultadas para {website}",
        "login",
    )
    return {"email": cred["email"], "password": cred["password"]}


@router.post("/password")
def save_password(
    cred: Credential, authorization: str | None = Header(default=None)
):
    verify_auth(authorization)

    if not cred.website or not cred.password:
        raise HTTPException(
            status_code=400, detail="Please don't leave any fields empty!"
        )

    existing = get_credential(cred.website)
    if existing and existing["email"] == cred.email and not cred.force:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Ya existe una contraseña para {cred.website} "
                f"con el correo {cred.email}. ¿Deseas reemplazarla?"
            ),
        )

    upsert_credential(cred.website, cred.email, cred.password)
    save_event(
        "Nueva Credencial",
        f"Contraseña guardada para {cred.website}",
        "device",
    )
    return {"message": "Success"}


@router.get("/passwords")
def list_passwords(authorization: str | None = Header(default=None)):
    verify_auth(authorization)

    data = load_all_credentials()
    return [
        {"website": website, "email": details["email"], "password": details["password"]}
        for website, details in data.items()
    ]


@router.delete("/password/{website}")
def delete_password_endpoint(
    website: str, authorization: str | None = Header(default=None)
):
    verify_auth(authorization)

    existing = get_credential(website)
    if existing is None:
        raise HTTPException(status_code=404, detail="Credential not found")

    delete_credential(website)
    save_event(
        "Credencial Eliminada",
        f"Se eliminaron las credenciales de {website}",
        "warning",
    )
    return {"message": "Success"}
