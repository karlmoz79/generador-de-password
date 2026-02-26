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
