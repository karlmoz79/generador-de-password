"""Servicio de autenticación: verifica el header Authorization."""

import secrets

from fastapi import HTTPException

from src.config import get_settings


def verify_auth(authorization: str | None) -> None:
    """Verifica el header Authorization contra la master password en memoria.

    Raises:
        HTTPException 401 si el token es inválido o falta.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    provided_token = authorization.split(" ", maxsplit=1)[1]
    expected = get_settings().admin_password

    if not expected or not secrets.compare_digest(provided_token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")
