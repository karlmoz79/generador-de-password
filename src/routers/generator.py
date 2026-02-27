"""Router de generación de contraseñas."""

from fastapi import APIRouter, HTTPException

from src.services.password_generator import generate_password

router = APIRouter(prefix="/api", tags=["generator"])


@router.get("/generate")
def generate_password_endpoint(
    length: int = 16,
    uppercase: bool = True,
    lowercase: bool = True,
    numbers: bool = True,
    symbols: bool = True,
):
    try:
        password = generate_password(length, uppercase, lowercase, numbers, symbols)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return {"password": password}
