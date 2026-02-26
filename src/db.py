from supabase import create_client, Client
from src.config import get_settings
from datetime import datetime

_client: Client | None = None


def _reset_client() -> None:
    """Para testing: fuerza la re-creación del cliente."""
    global _client
    _client = None


def get_supabase_client() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client


# ── Credentials CRUD ──────────────────────────────────────────────


def load_all_credentials() -> dict:
    """Carga todas las credenciales de Supabase como dict {website: {...}}."""
    client = get_supabase_client()
    response = client.table("credentials").select("*").execute()
    result = {}
    for row in response.data:
        result[row["website"]] = {
            "email": row["email"],
            "password": row["password"],
            "breached": row.get("breached", False),
            "breach_count": row.get("breach_count", 0),
            "last_checked": row.get("last_checked"),
        }
    return result


def get_credential(website: str) -> dict | None:
    """Obtiene una credencial por nombre de sitio web."""
    client = get_supabase_client()
    response = (
        client.table("credentials").select("*").eq("website", website).execute()
    )
    if response.data:
        row = response.data[0]
        return {
            "email": row["email"],
            "password": row["password"],
            "breached": row.get("breached", False),
            "breach_count": row.get("breach_count", 0),
            "last_checked": row.get("last_checked"),
        }
    return None


def upsert_credential(website: str, email: str, password: str) -> None:
    """Inserta o actualiza una credencial por website (UPSERT)."""
    client = get_supabase_client()
    client.table("credentials").upsert(
        {
            "website": website,
            "email": email,
            "password": password,
            "updated_at": datetime.now().isoformat(),
        },
        on_conflict="website",
    ).execute()


def delete_credential(website: str) -> bool:
    """Elimina una credencial por website. Retorna True si se eliminó."""
    client = get_supabase_client()
    response = (
        client.table("credentials").delete().eq("website", website).execute()
    )
    return len(response.data) > 0


def update_breach_status(website: str, breached: bool, count: int) -> None:
    """Actualiza el estado de breach de una credencial."""
    client = get_supabase_client()
    client.table("credentials").update(
        {
            "breached": breached,
            "breach_count": count,
            "last_checked": datetime.now().isoformat(),
        }
    ).eq("website", website).execute()


# ── Events ────────────────────────────────────────────────────────


def load_events() -> list:
    """Carga los últimos 10 eventos ordenados por timestamp DESC."""
    client = get_supabase_client()
    response = (
        client.table("events")
        .select("*")
        .order("timestamp", desc=True)
        .limit(10)
        .execute()
    )
    return [
        {
            "title": r["title"],
            "description": r["description"],
            "type": r["type"],
            "timestamp": r["timestamp"],
        }
        for r in response.data
    ]


def save_event(title: str, description: str, event_type: str) -> None:
    """Registra un nuevo evento de auditoría."""
    try:
        client = get_supabase_client()
        client.table("events").insert(
            {
                "title": title,
                "description": description,
                "type": event_type,
                "timestamp": datetime.now().isoformat(),
            }
        ).execute()
    except Exception:
        pass  # Log event failure shouldn't break main operations
