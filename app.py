from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import string
import secrets
import hashlib
import httpx
import time
import logging
from datetime import datetime

from src.config import get_settings
from src.db import (
    load_all_credentials,
    get_credential,
    upsert_credential,
    delete_credential,
    update_breach_status,
    load_events,
    save_event,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Servir archivos estáticos (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return FileResponse("static/index.html")


class Credential(BaseModel):
    website: str = Field(max_length=500)
    email: str = Field(max_length=500)
    password: str = Field(max_length=500)
    force: bool = False


def _verify_auth(authorization: str | None) -> None:
    """Verifica el header Authorization contra la master password en memoria."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    provided_token = authorization.split(" ")[1]
    expected = get_settings().admin_password
    if not expected or not secrets.compare_digest(provided_token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/api/password/{website}")
def get_password(website: str, authorization: str | None = Header(default=None)):
    _verify_auth(authorization)

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


@app.post("/api/password")
def save_password(
    cred: Credential, authorization: str | None = Header(default=None)
):
    _verify_auth(authorization)

    if not cred.website or not cred.password:
        raise HTTPException(
            status_code=400, detail="Please don't leave any fields empty!"
        )

    # Check for duplicate: same website and same email
    existing = get_credential(cred.website)
    if (
        existing
        and existing["email"] == cred.email
        and not cred.force
    ):
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe una contraseña para {cred.website} con el correo {cred.email}. ¿Deseas reemplazarla?",
        )

    upsert_credential(cred.website, cred.email, cred.password)
    save_event(
        "Nueva Credencial",
        f"Contraseña guardada para {cred.website}",
        "device",
    )
    return {"message": "Success"}


@app.get("/api/stats")
def get_stats(authorization: str | None = Header(default=None)):
    _verify_auth(authorization)

    data = load_all_credentials()
    total = len(data)

    passwords = [entry["password"] for entry in data.values()]

    # Calculate strong passwords (>=8 chars, has upper+lower+digit+symbol)
    strong_count = 0
    for pwd in passwords:
        has_upper = any(c.isupper() for c in pwd)
        has_lower = any(c.islower() for c in pwd)
        has_digit = any(c.isdigit() for c in pwd)
        has_symbol = any(not c.isalnum() for c in pwd)
        if len(pwd) >= 8 and has_upper and has_lower and has_digit and has_symbol:
            strong_count += 1

    # Calculate reused passwords
    seen: set[str] = set()
    reused_set: set[str] = set()
    for pwd in passwords:
        if pwd in seen:
            reused_set.add(pwd)
        seen.add(pwd)
    reused_count = sum(1 for pwd in passwords if pwd in reused_set)

    # Calculate breached passwords from persisted state
    breached_count = sum(
        1 for entry in data.values() if entry.get("breached") is True
    )

    # Weighted score: 40% strength + 30% uniqueness + 30% not breached
    if total > 0:
        strength_pct = (strong_count / total) * 100
        unique_pct = ((total - reused_count) / total) * 100
        safe_pct = ((total - breached_count) / total) * 100
        score = int(strength_pct * 0.4 + unique_pct * 0.3 + safe_pct * 0.3)
    else:
        score = 0

    return {
        "score": score,
        "strong": strong_count,
        "reused": reused_count,
        "breached": breached_count,
        "total": total,
    }


@app.get("/api/generate")
def generate_password(
    length: int = 16,
    uppercase: bool = True,
    lowercase: bool = True,
    numbers: bool = True,
    symbols: bool = True,
):
    if length < 4 or length > 128:
        raise HTTPException(
            status_code=400, detail="Length must be between 4 and 128"
        )

    chars = ""
    if uppercase:
        chars += string.ascii_uppercase
    if lowercase:
        chars += string.ascii_lowercase
    if numbers:
        chars += string.digits
    if symbols:
        chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if not chars:
        chars = string.ascii_lowercase

    password = "".join(secrets.choice(chars) for _ in range(length))
    return {"password": password}


@app.get("/api/events")
def get_events(authorization: str | None = Header(default=None)):
    _verify_auth(authorization)
    return load_events()


@app.get("/api/passwords")
def list_passwords(authorization: str | None = Header(default=None)):
    _verify_auth(authorization)

    data = load_all_credentials()
    return [
        {"website": website, "email": details["email"], "password": details["password"]}
        for website, details in data.items()
    ]


@app.delete("/api/password/{website}")
def delete_password(
    website: str, authorization: str | None = Header(default=None)
):
    _verify_auth(authorization)

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


@app.get("/api/export")
def export_passwords(authorization: str | None = Header(default=None)):
    _verify_auth(authorization)
    return load_all_credentials()


@app.post("/api/import")
def import_passwords(
    credentials: list[Credential],
    action: str = "skip",
    authorization: str | None = Header(default=None),
):
    _verify_auth(authorization)

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


@app.get("/api/check-breach/{website}")
def check_breach(
    website: str, authorization: str | None = Header(default=None)
):
    _verify_auth(authorization)

    cred = get_credential(website)
    if cred is None:
        raise HTTPException(status_code=404, detail="Website not found")

    password = cred["password"]
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]

    breached = False
    count = 0

    try:
        response = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}", timeout=5.0
        )
        if response.status_code == 200:
            hashes = response.text.splitlines()
            for h in hashes:
                hash_suffix, c = h.split(":")
                if hash_suffix == suffix:
                    breached = True
                    count = int(c)
                    break
        else:
            logger.warning(
                f"HIBP API returned status {response.status_code} for {website}"
            )
    except Exception as e:
        logger.error(f"Error checking breach for {website}: {e}")

    # Persist breach state in Supabase
    update_breach_status(website, breached, count)

    return {"website": website, "breached": breached, "count": count}


@app.get("/api/check-all-breaches")
def check_all_breaches(authorization: str | None = Header(default=None)):
    _verify_auth(authorization)

    data = load_all_credentials()
    results = []

    for website, creds in data.items():
        password = creds["password"]
        sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]

        breached = False
        count = 0

        try:
            response = httpx.get(
                f"https://api.pwnedpasswords.com/range/{prefix}", timeout=5.0
            )
            if response.status_code == 200:
                hashes = response.text.splitlines()
                for h in hashes:
                    hash_suffix, c = h.split(":")
                    if hash_suffix == suffix:
                        breached = True
                        count = int(c)
                        break
                results.append(
                    {"website": website, "breached": breached, "count": count}
                )
            else:
                logger.warning(
                    f"HIBP API returned status {response.status_code} for {website}"
                )
                results.append(
                    {"website": website, "breached": None, "count": 0}
                )
        except Exception as e:
            logger.error(f"Error checking breach for {website}: {e}")
            results.append(
                {"website": website, "breached": None, "count": 0}
            )

        # Persist breach state per entry
        update_breach_status(website, breached, count)

        time.sleep(0.5)

    return results
