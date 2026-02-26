# 🔐 MyPass - Centro de Comando de Contraseñas

![Status](https://img.shields.io/badge/Status-Producción-emerald?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla--Tailwind-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Package Manager](https://img.shields.io/badge/Managed_by-uv-purple?style=for-the-badge)

**MyPass** es un administrador de contraseñas moderno, seguro y visualmente impactante. Diseñado bajo una estética de **Glassmorphism**, ofrece una experiencia de "Centro de Comando" para gestionar tu seguridad digital con inteligencia y elegancia.

---

## ✨ Características Principales

### 🛡️ Seguridad de Nivel Superior

- **Bóveda Protegida:** Acceso restringido mediante una _Master Password_ con validación segura de tokens (Bearer Auth).
- **Protección contra Ataques de Tiempo:** Implementación de `secrets.compare_digest()` para mitigar vulnerabilidades de canal lateral.
- **Auditoría Global:** Sistema de monitoreo de brechas integrado con la API de **Have I Been Pwned (HIBP)**.

### 📊 Inteligencia de Datos

- **Security Score:** Cálculo dinámico de tu salud de seguridad basado en la fuerza, reutilización y vulnerabilidad de tus credenciales.
- **Análisis Real-Time:** Identificación inmediata de contraseñas débiles o reutilizadas en todo tu inventario.
- **Audit Log:** Registro detallado de eventos recientes (búsquedas, guardados, eliminaciones) para trazabilidad.

### 🎨 Experiencia de Usuario Pro

- **Diseño Glassmorphism:** Interfaz translúcida moderna con animaciones fluidas y micro-interacciones.
- **Modo Oscuro Dinámico:** Soporte nativo para temas claro y oscuro con transiciones suaves.
- **Generador Avanzado:** Creación de contraseñas personalizables (longitud, mayúsculas, símbolos) con indicador de fortaleza visual.
- **Gestión de Duplicados:** Detección inteligente de colisiones al guardar credenciales para evitar sobrescrituras accidentales.

### 📂 Portabilidad

- **Importación/Exportación:** Soporte completo para mover tus datos en formatos **JSON** y **CSV**.

---

## 🛠️ Stack Tecnológico

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
- **Validación:** [Pydantic v2](https://docs.pydantic.dev/)
- **Gestor de Paquetes:** [uv](https://astral.sh/uv/)
- **Frontend:** HTML5, CSS3 (Custom Animation Core), [Tailwind CSS](https://tailwindcss.com/)
- **Iconografía:** [Phosphor Icons](https://phosphoricons.com/)

---

## 🚀 Inicio Rápido

Este proyecto utiliza `uv` para una gestión de dependencias ultra-rápida.

### 1. Clonar y Preparar

```bash
git clone https://github.com/karlmoz79/generador-de-password.git
cd generador-de-password
```

### 2. Configurar Entorno

Crea un archivo `.env` en la raíz con tu contraseña maestra:

```bash
echo "ADMIN_VAULT_PASSWORD=tu_contraseña_secreta" > .env
```

### 3. Ejecutar

No necesitas activar el entorno manualmente, `uv` se encarga de todo:

```bash
uv run fastapi dev app.py
```

Accede a: `http://127.0.0.1:8000`

---

## 🔒 Modelo de Seguridad

El backend implementa una capa de middleware de seguridad que intercepta todas las peticiones críticas. Las credenciales se almacenan localmente en `data.json` y los eventos en `events.json`.

> [!IMPORTANT]
> Se recomienda encarecidamente cambiar la contraseña en el archivo `.env` antes del primer uso en un entorno compartido.

---

## 📁 Estructura del Proyecto

```text
.
├── app.py              # Núcleo del API (FastAPI)
├── static/             # Frontend Assets
│   ├── index.html      # Interfaz principal
│   └── script.js       # Lógica del cliente y Auth system
├── data.json           # Almacén de credenciales (Persistencia)
├── events.json         # Log de auditoría
├── pyproject.toml      # Configuración de dependencias (uv)
└── .env                # Variables de entorno (Secrets)
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes una idea para mejorar el dashboard o la seguridad, siéntete libre de abrir un Pull Request o Issue.

---

## 📝 Licencia

Este proyecto fue desarrollado por **Karlmoz** como parte de su suite de herramientas de productividad personal.
