# Password Manager (MyPass)

Este es un administrador de contraseñas moderno construido con FastAPI para el backend y una interfaz web dinámica (HTML/Tailwind/JS).

## Características

- Generación de contraseñas seguras.
- Almacenamiento cifrado (simulado en `data.json`).
- Centro de mando con estadísticas de seguridad.
- Historial de eventos recientes.
- Modo oscuro.

## Estructura del Proyecto

- `app.py`: Servidor backend principal utilizando FastAPI.
- `static/`: Contiene los archivos frontend (HTML, JS).
- `data.json`: Archivo de datos para las credenciales.
- `events.json`: Registro de eventos recientes.
- `archive/`: Carpeta que contiene archivos legacy, versiones anteriores (Tkinter) y recursos no esenciales.

## Ejecución

Para ejecutar el servidor de desarrollo:

```bash
uv run fastapi dev app.py
```

Accede a `http://127.0.0.1:8000` en tu navegador.
