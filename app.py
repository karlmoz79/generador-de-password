"""MyPass — Punto de entrada de la aplicación FastAPI.

Este archivo solo configura la app e incluye los routers.
Toda la lógica de negocio vive en src/services/.
Todos los endpoints viven en src/routers/.
"""

import logging

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.routers import (
    breach,
    events,
    generator,
    import_export,
    passwords,
    stats,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import os
import sys

def get_base_path():
    """Obtiene la ruta base, ya sea si se ejecuta como script o como binario de PyInstaller."""
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

base_path = get_base_path()
static_dir = os.path.join(base_path, "static")

app = FastAPI(title="MyPass", version="2.0.0")

# ── Archivos estáticos ────────────────────────────────────────────
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def read_root():
    return FileResponse(os.path.join(static_dir, "index.html"))


# ── Routers ───────────────────────────────────────────────────────
app.include_router(passwords.router)
app.include_router(stats.router)
app.include_router(generator.router)
app.include_router(events.router)
app.include_router(breach.router)
app.include_router(import_export.router)
