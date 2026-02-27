"""Servicio de verificación de contraseñas contra la API de Have I Been Pwned."""

import hashlib
import logging
import time
from dataclasses import dataclass

import httpx

from src.db import (
    get_credential,
    load_all_credentials,
    update_breach_status,
)

logger = logging.getLogger(__name__)

HIBP_API_URL = "https://api.pwnedpasswords.com/range"
HIBP_TIMEOUT = 5.0
HIBP_RATE_LIMIT_DELAY = 0.5


@dataclass
class BreachResult:
    """Resultado de la verificación de breach para un sitio."""

    website: str
    breached: bool | None
    count: int


def _check_password_breach(password: str) -> tuple[bool, int]:
    """Verifica una sola contraseña contra la API de HIBP usando k-Anonymity.

    Returns:
        Tupla (breached, count).
    """
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]

    try:
        response = httpx.get(
            f"{HIBP_API_URL}/{prefix}", timeout=HIBP_TIMEOUT
        )
        if response.status_code == 200:
            for line in response.text.splitlines():
                hash_suffix, count_str = line.split(":")
                if hash_suffix == suffix:
                    return True, int(count_str)
            return False, 0
        else:
            logger.warning("HIBP API returned status %d", response.status_code)
            return False, 0
    except Exception as e:
        logger.error("Error checking breach: %s", e)
        return False, 0


def check_single_breach(website: str) -> BreachResult:
    """Verifica si la contraseña de un sitio ha sido comprometida.

    Raises:
        KeyError: Si el sitio web no existe en la base de datos.
    """
    cred = get_credential(website)
    if cred is None:
        raise KeyError(f"Website not found: {website}")

    breached, count = _check_password_breach(cred["password"])
    update_breach_status(website, breached, count)

    return BreachResult(website=website, breached=breached, count=count)


def check_all_breaches() -> list[BreachResult]:
    """Verifica todas las contraseñas almacenadas contra la API de HIBP.

    Incluye rate-limiting de 0.5s entre peticiones para respetar
    los límites de la API.
    """
    data = load_all_credentials()
    results: list[BreachResult] = []

    for website, creds in data.items():
        breached, count = _check_password_breach(creds["password"])
        update_breach_status(website, breached, count)
        results.append(
            BreachResult(website=website, breached=breached, count=count)
        )
        time.sleep(HIBP_RATE_LIMIT_DELAY)

    return results
