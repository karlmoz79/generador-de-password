"""Servicio de cálculo de estadísticas de seguridad del vault."""

from src.db import load_all_credentials


def _is_strong_password(password: str) -> bool:
    """Evalúa si una contraseña es fuerte (>=8chars, upper+lower+digit+symbol)."""
    if len(password) < 8:
        return False
    return (
        any(c.isupper() for c in password)
        and any(c.islower() for c in password)
        and any(c.isdigit() for c in password)
        and any(not c.isalnum() for c in password)
    )


def calculate_stats() -> dict:
    """Calcula las métricas de seguridad del vault.

    Returns:
        Dict con score, strong, reused, breached, total.
    """
    data = load_all_credentials()
    total = len(data)

    if total == 0:
        return {
            "score": 0,
            "strong": 0,
            "reused": 0,
            "breached": 0,
            "total": 0,
        }

    passwords = [entry["password"] for entry in data.values()]

    # Contraseñas fuertes
    strong_count = sum(1 for pwd in passwords if _is_strong_password(pwd))

    # Contraseñas reutilizadas
    seen: set[str] = set()
    reused_set: set[str] = set()
    for pwd in passwords:
        if pwd in seen:
            reused_set.add(pwd)
        seen.add(pwd)
    reused_count = sum(1 for pwd in passwords if pwd in reused_set)

    # Contraseñas comprometidas
    breached_count = sum(
        1 for entry in data.values() if entry.get("breached") is True
    )

    # Score ponderado: 40% fortaleza + 30% unicidad + 30% no comprometidas
    strength_pct = (strong_count / total) * 100
    unique_pct = ((total - reused_count) / total) * 100
    safe_pct = ((total - breached_count) / total) * 100
    score = int(strength_pct * 0.4 + unique_pct * 0.3 + safe_pct * 0.3)

    return {
        "score": score,
        "strong": strong_count,
        "reused": reused_count,
        "breached": breached_count,
        "total": total,
    }
