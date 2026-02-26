# Plan de Implementación de MyPass Portable (Linux + Supabase)

> **Para Claude:** SUB-SKILL REQUERIDA: Usa `skill-executing-plans` para implementar este plan tarea por tarea.

**Objetivo:** Refactorizar MyPass para reemplazar el almacenamiento local por Supabase y compilar el proyecto como un único binario ejecutable para Linux usando PyInstaller.

**Arquitectura:** El punto de entrada será un script interactivo en CLI que solicitará la URL de Supabase, el API Key y la Master Password, almacenándolas globalmente en memoria RAM. Luego de capturarlas, iniciará el servidor FastAPI/Uvicorn programáticamente. FastAPI interactuará con Supabase para persistencia. Finalmente, PyInstaller agrupará la app de Python y la carpeta `static/` en un archivo ELF.

**Tech Stack:** Python 3.12+, FastAPI, Uvicorn, Supabase Python Client, PyInstaller, uv, pytest.

---

## Tarea 0 (Prerrequisito): Esquema SQL de Supabase

El usuario debe ejecutar este SQL en el **SQL Editor** de su dashboard de Supabase antes de lanzar la app.

```sql
-- Tabla de credenciales (reemplaza data.json)
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL,
    breached BOOLEAN DEFAULT FALSE,
    breach_count INTEGER DEFAULT 0,
    last_checked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de eventos de auditoría (reemplaza events.json)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('login', 'device', 'warning')),
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsquedas frecuentes por website
CREATE INDEX IF NOT EXISTS idx_credentials_website ON credentials (website);

-- Índice para ordenar eventos recientes
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp DESC);

-- Habilitar RLS (Row Level Security) - desactivado para uso con service_role key
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política para acceso total con service_role key (las políticas solo aplican a anon/authenticated)
CREATE POLICY "Service role full access credentials" ON credentials FOR ALL USING (true);
CREATE POLICY "Service role full access events" ON events FOR ALL USING (true);
```

**Mapeo de datos actuales:**
| Campo data.json | Columna Supabase |
|----------------------|---------------------------|
| key (website name) | `credentials.website` |
| `.email` | `credentials.email` |
| `.password` | `credentials.password` |
| `.breached` | `credentials.breached` |
| `.breach_count` | `credentials.breach_count`|
| `.last_checked` | `credentials.last_checked`|

---

### Tarea 1: Configuración en Memoria y Dependencias

**Archivos:**

- Crear: `src/__init__.py`, `src/config.py`
- Modificar: `pyproject.toml`
- Probar: `tests/test_config.py`

**Paso 1: Escribir la prueba que falla**

```python
# tests/test_config.py
from src.config import get_settings, set_settings

def test_in_memory_settings():
    set_settings("https://supa.url", "supa_key", "my_master_pass")
    settings = get_settings()
    assert settings.supabase_url == "https://supa.url"
    assert settings.supabase_key == "supa_key"
    assert settings.admin_password == "my_master_pass"

def test_settings_not_configured():
    """Un Settings limpio debe tener cadenas vacías."""
    from src.config import Settings
    s = Settings()
    assert s.supabase_url == ""
    assert s.admin_password == ""
```

**Paso 2: Ejecutar la prueba para verificar que falla**
Comando: `uv run pytest tests/test_config.py -v`
Esperado: FALLA con "ModuleNotFoundError: No module named 'src.config'"

**Paso 3: Escribir implementación mínima**

```python
# src/__init__.py
# Package marker

# src/config.py
from dataclasses import dataclass, field

@dataclass
class Settings:
    supabase_url: str = ""
    supabase_key: str = ""
    admin_password: str = ""

_settings = Settings()

def set_settings(url: str, key: str, password: str) -> None:
    _settings.supabase_url = url
    _settings.supabase_key = key
    _settings.admin_password = password

def get_settings() -> Settings:
    return _settings
```

**Paso 4: Ejecutar prueba para verificar que pasa**
Comando: `uv run pytest tests/test_config.py -v`
Esperado: PASS

**Paso 5: Instalar dependencia y commit**

```bash
uv add supabase
git add src/ tests/test_config.py pyproject.toml uv.lock
git commit -m "feat: add in-memory config and supabase dependency"
```

---

### Tarea 2: Refactorizar Persistencia de Datos (Supabase)

**Archivos:**

- Crear: `src/db.py`
- Modificar: `app.py` (reemplazar funciones JSON por llamadas a `src.db`)
- Probar: `tests/test_db.py`

**Paso 1: Escribir la prueba que falla**

```python
# tests/test_db.py
from unittest.mock import MagicMock, patch
from src.config import set_settings

# Configurar settings antes de importar db
set_settings("https://fake.supabase.co", "fake_key", "test_pass")


def _mock_client():
    """Crea un mock del cliente Supabase con la cadena de métodos."""
    client = MagicMock()
    return client


@patch("src.db.create_client")
def test_get_supabase_client_returns_client(mock_create):
    mock_create.return_value = _mock_client()
    from src.db import get_supabase_client, _reset_client
    _reset_client()
    client = get_supabase_client()
    assert client is not None
    mock_create.assert_called_once()


@patch("src.db.create_client")
def test_load_all_credentials(mock_create):
    mock_client = _mock_client()
    mock_client.table.return_value.select.return_value.execute.return_value.data = [
        {"website": "github", "email": "a@b.com", "password": "123",
         "breached": False, "breach_count": 0, "last_checked": None}
    ]
    mock_create.return_value = mock_client
    from src.db import load_all_credentials, _reset_client
    _reset_client()
    data = load_all_credentials()
    assert "github" in data
    assert data["github"]["email"] == "a@b.com"


@patch("src.db.create_client")
def test_save_event(mock_create):
    mock_client = _mock_client()
    mock_client.table.return_value.insert.return_value.execute.return_value = MagicMock()
    mock_create.return_value = mock_client
    from src.db import save_event, _reset_client
    _reset_client()
    save_event("Test Title", "Test Desc", "login")
    mock_client.table.assert_called_with("events")
```

**Paso 2: Ejecutar la prueba para verificar que falla**
Comando: `uv run pytest tests/test_db.py -v`
Esperado: FALLA con "ImportError: cannot import name 'load_all_credentials' from 'src.db'"

**Paso 3: Escribir implementación de `src/db.py`**

```python
# src/db.py
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
    client = get_supabase_client()
    response = client.table("credentials").select("*").eq("website", website).execute()
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
    client = get_supabase_client()
    response = client.table("credentials").delete().eq("website", website).execute()
    return len(response.data) > 0


def update_breach_status(website: str, breached: bool, count: int) -> None:
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
    client = get_supabase_client()
    client.table("events").insert(
        {
            "title": title,
            "description": description,
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
        }
    ).execute()
```

**Paso 4: Refactorizar `app.py`**

Reemplazar las funciones locales de JSON por importaciones de `src.db` y `src.config`:

- Eliminar: `load_data()`, `save_data()`, `load_events()`, `save_event()` locales.
- Eliminar: imports de `dotenv`, lectura de `.env`, constantes `DATA_FILE`, `EVENTS_FILE`.
- Importar: `from src.db import ...` y `from src.config import get_settings`.
- Reemplazar `EXPECTED_PASSWORD` por `get_settings().admin_password` en cada endpoint.
- Cambiar el cuerpo de cada endpoint para usar las funciones de `src.db`.

**Paso 5: Ejecutar pruebas para verificar que pasan**
Comando: `uv run pytest tests/ -v`
Esperado: PASS

**Paso 6: Commit**

```bash
git add src/db.py tests/test_db.py app.py
git commit -m "refactor: replace json file storage with supabase client"
```

---

### Tarea 3: CLI Interactivo y Punto de Entrada

**Archivos:**

- Crear: `main.py`
- Modificar: `app.py` (quitar dependencias de `.env` global)

**Paso 1: Escribir la prueba que falla**

```python
# tests/test_main.py
import main

def test_main_exists():
    assert hasattr(main, "start_app")
```

**Paso 2: Ejecutar la prueba para verificar que falla**
Comando: `uv run pytest tests/test_main.py -v`
Esperado: FALLA con "ModuleNotFoundError: No module named 'main'"

**Paso 3: Escribir implementación mínima**

```python
# main.py
import getpass
import uvicorn
from src.config import set_settings

def start_app():
    print("=== MyPass Portable ===")
    url = input("Supabase URL: ")
    key = getpass.getpass("Supabase API Key: ")
    pwd = getpass.getpass("Master Password: ")

    set_settings(url, key, pwd)
    print("Iniciando servidor local de MyPass en http://127.0.0.1:8000...")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    start_app()
```

**Paso 4: Ejecutar prueba para verificar que pasa**
Comando: `uv run pytest tests/test_main.py -v`
Esperado: PASS

**Paso 5: Commit**

```bash
git add main.py tests/test_main.py
git commit -m "feat: add interactive CLI entrypoint"
```

---

### Tarea 4: Script de Empaquetado PyInstaller

**Archivos:**

- Crear: `build.sh`
- Probar: Compilación local.

**Paso 1: Escribir la prueba que falla**
Comando: `bash build.sh`
Esperado: FALLA con "bash: build.sh: No such file or directory"

**Paso 2: Ejecutar la prueba para verificar que falla**
(Ya verificado arriba).

**Paso 3: Escribir implementación mínima**

```bash
#!/bin/bash
# build.sh - Compila MyPass como binario ELF para Linux
set -e
echo "=== MyPass Build Script ==="
echo "Instalando PyInstaller..."
uv pip install pyinstaller
echo "Compilando MyPass..."
uv run pyinstaller --name MyPass \
    --onefile \
    --add-data "static:static" \
    --hidden-import "uvicorn.logging" \
    --hidden-import "uvicorn.loops" \
    --hidden-import "uvicorn.loops.auto" \
    --hidden-import "uvicorn.protocols" \
    --hidden-import "uvicorn.protocols.http" \
    --hidden-import "uvicorn.protocols.http.auto" \
    --hidden-import "uvicorn.protocols.websockets" \
    --hidden-import "uvicorn.protocols.websockets.auto" \
    --hidden-import "uvicorn.lifespan" \
    --hidden-import "uvicorn.lifespan.on" \
    main.py
echo "✅ Compilación exitosa. Ejecutable en dist/MyPass"
```

**Paso 4: Ejecutar prueba para verificar que pasa**
Comando: `chmod +x build.sh && ./build.sh`
Esperado: PASS (Debe generar el binario ELF en `dist/MyPass`)

**Paso 5: Commit**

```bash
git add build.sh
git commit -m "chore: add pyinstaller build script for linux binary"
```
