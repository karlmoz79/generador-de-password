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

app = FastAPI(title="MyPass", version="2.0.0")

# ── Archivos estáticos ────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return FileResponse("static/index.html")


# ── Routers ───────────────────────────────────────────────────────
app.include_router(passwords.router)
app.include_router(stats.router)
app.include_router(generator.router)
app.include_router(events.router)
app.include_router(breach.router)
app.include_router(import_export.router)
