# 🔐 MyPass — Centro de Comando de Contraseñas

![Status](https://img.shields.io/badge/Status-Producción-emerald?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla--Tailwind-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Database](https://img.shields.io/badge/Database-Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Package Manager](https://img.shields.io/badge/Managed_by-uv-purple?style=for-the-badge)

**MyPass** es un administrador de contraseñas moderno, seguro y portable. Diseñado bajo una estética de **Glassmorphism**, ofrece una experiencia de "Centro de Comando" para gestionar tu seguridad digital con inteligencia y elegancia. Funciona como aplicación web local y como **binario ELF portable** (sin dependencias externas).

---

## ✨ Características Principales

### 🛡️ Seguridad

- **Autenticación por Master Password:** Acceso protegido mediante token `Bearer` validado contra la contraseña maestra almacenada únicamente en RAM.
- **Protección contra Timing Attacks:** Uso de `secrets.compare_digest()` para mitigar ataques de canal lateral en la comparación de tokens.
- **Contraseña nunca en disco:** La Master Password se solicita en cada ejecución y se almacena solo en memoria, sin persistirla en archivos.
- **Auth-on-Load:** Al abrir la interfaz, el sistema solicita la contraseña maestra automáticamente antes de mostrar cualquier dato sensible.
- **Sanitización HTML (XSS):** Todas las salidas dinámicas se escapan con `escapeHtml()` para prevenir inyección de código.
- **Validación Pydantic:** Los datos de entrada en la API se validan con modelos Pydantic v2 con restricciones de longitud (`max_length=500`).

---

### 🔑 Gestión de Credenciales (CRUD Completo)

- **Guardar** credenciales (sitio web, correo/usuario, contraseña) con persistencia en Supabase.
- **Buscar** credenciales por nombre de sitio web con auto-limpieza de campos a los 5 segundos.
- **Listar** todas las credenciales en el **Admin Vault** (tabla visual con acciones por fila).
- **Eliminar** credenciales individuales con confirmación.
- **Detección de Duplicados:** Al guardar, si ya existe una credencial para el mismo sitio y correo, muestra un modal de confirmación antes de sobrescribir (HTTP 409 → flujo `force`).
- **UPSERT inteligente:** Internamente usa `upsert` de Supabase con `on_conflict="website"` para inserción/actualización atómica.

---

### 🔐 Generador de Contraseñas

- **Generación criptográfica:** Usa `secrets.choice()` (CSPRNG) en lugar de `random` para garantizar aleatoriedad segura.
- **Longitud configurable:** Slider de 8 a 64 caracteres (backend soporta hasta 128).
- **Caracteres personalizables:** Toggles individuales para mayúsculas, minúsculas, números y símbolos.
- **Indicador de fortaleza visual:** Barra de progreso con evaluación en tiempo real:
  - 🔴 **Débil** (<3 criterios)
  - 🟠 **Media** (3-4 criterios)
  - 🟢 **Fuerte** (5+ criterios: longitud ≥8/12/16 + mayúsculas + minúsculas + dígitos + símbolos).

---

### 🌐 Auditoría de Brechas (Have I Been Pwned)

- **Verificación individual:** Botón por credencial en el Vault para verificar si la contraseña ha sido comprometida.
- **Verificación masiva:** Botón "Verificar Todas" para escanear toda la bóveda contra la API de HIBP.
- **k-Anonymity:** Solo se envían los primeros 5 caracteres del hash SHA-1 a la API, protegiendo la contraseña completa.
- **Rate Limiting:** Retardo de 0.5s entre peticiones para respetar los límites de la API de HIBP.
- **Persistencia del estado:** Los resultados de breach (`breached`, `breach_count`, `last_checked`) se almacenan en Supabase.
- **Alertas detalladas:** Muestra el número exacto de filtraciones en las que aparece cada contraseña.

---

### 📊 Dashboard de Inteligencia

- **Security Score:** Puntuación ponderada calculada en tiempo real:
  - 40% Fortaleza (contraseñas que cumplen los 4 criterios: ≥8 chars + upper + lower + digit + symbol).
  - 30% Unicidad (contraseñas no reutilizadas).
  - 30% Seguridad (contraseñas no comprometidas en brechas).
- **Métricas visuales:** Gráfico circular SVG animado + barras de progreso para:
  - Contraseñas fuertes.
  - Contraseñas reutilizadas.
  - Vulnerabilidades detectadas.
- **Badge dinámico:** Indicador contextual ("Excelente", "Mejorable", "Acción Requerida") según el estado de la bóveda.

---

### 📋 Log de Auditoría (Events)

- **Registro automático:** Cada acción crítica genera un evento persistido en Supabase:
  - `login` — Consultas exitosas de credenciales.
  - `device` — Nuevas credenciales guardadas.
  - `warning` — Credenciales eliminadas.
- **Timeline visual:** Últimos 10 eventos con iconos tipificados y timestamps relativos en español ("HACE 5M", "HACE 2H", "HACE 3D").
- **Resistencia a fallos:** El registro de eventos nunca interrumpe las operaciones principales (silencia excepciones).

---

### 📂 Importación / Exportación

- **Exportar:** Descarga todas las credenciales en formato **JSON** o **CSV** con un clic.
- **Importar:** Sube archivos `.json` o `.csv` con soporte para:
  - **Drag & Drop** sobre la zona de carga.
  - **Vista previa** de las primeras 5 credenciales antes de confirmar.
  - **Manejo de duplicados:** Opción de "Omitir duplicados" o "Sobrescribir existentes".
  - **Parser CSV:** Soporte para formato estándar `website,email,password`.

---

### 🎨 Experiencia de Usuario

- **Diseño Glassmorphism:** Tarjetas translúcidas con `backdrop-filter: blur(16px)` y bordes semitransparentes.
- **Modo Oscuro / Claro:** Toggle con persistencia en `localStorage` y transiciones CSS de 300ms.
- **Tipografía Google Fonts:** Inter como fuente principal para máxima legibilidad.
- **Iconografía Phosphor Icons:** Conjunto de iconos consistente y moderno.
- **Micro-interacciones:** Animación `scaleIn` en modales, `active:scale-[0.98]` en botones, efectos hover en filas del Vault.
- **Responsive:** Layout `grid-cols-12` con breakpoints para móvil, tablet y desktop.
- **Copiar al portapapeles:** Botón para copiar contraseñas directamente desde el Vault.
- **Toggle de visibilidad:** Botón ojo/ojo-tachado para mostrar/ocultar contraseñas tanto en el formulario como en el Vault.
- **Feedback temporal:** Mensajes estilizados que desaparecen automáticamente a los 4 segundos.

---

## 🏗️ Arquitectura del Proyecto

```text
.
├── main.py                     # Punto de entrada CLI (pide credenciales y arranca uvicorn)
├── app.py                      # Aplicación FastAPI (monta static + routers)
├── build.sh                    # Script de compilación con PyInstaller
├── pyproject.toml              # Dependencias y metadatos del proyecto (uv)
├── .env                        # Variables de entorno (SUPABASE_URL, SUPABASE_KEY)
│
├── src/
│   ├── config.py               # Singleton de configuración (Settings dataclass)
│   ├── db.py                   # Capa de datos: cliente Supabase + CRUD credentials + events
│   ├── routers/
│   │   ├── passwords.py        # GET/POST/DELETE credenciales
│   │   ├── stats.py            # GET estadísticas de seguridad
│   │   ├── generator.py        # GET generador de contraseñas
│   │   ├── events.py           # GET log de auditoría
│   │   ├── breach.py           # GET verificación HIBP (individual y masiva)
│   │   └── import_export.py    # GET exportar / POST importar credenciales
│   └── services/
│       ├── auth.py             # Verificación Bearer token + secrets.compare_digest
│       ├── breach_checker.py   # Integración HIBP con k-Anonymity
│       ├── password_generator.py  # Generación con secrets.choice (CSPRNG)
│       └── stats.py            # Cálculo ponderado del Security Score
│
├── static/
│   ├── index.html              # Interfaz principal (Glassmorphism + Tailwind CDN)
│   └── js/
│       ├── app.js              # Orquestador: inicializa módulos + auth-on-load
│       ├── api.js              # Capa de fetch centralizada
│       ├── auth.js             # Gestión de token + overlay de autenticación
│       ├── dashboard.js        # Carga de stats y eventos
│       ├── generator.js        # Generador + indicador de fuerza
│       ├── vault.js            # Admin Vault (tabla CRUD + breach check)
│       ├── import-export.js    # Importación/exportación (drag & drop + parsers)
│       └── ui.js               # Utilidades: escapeHtml, showMessage, timeAgo
│
├── tests/
│   ├── test_config.py          # Tests del módulo de configuración
│   ├── test_db.py              # Tests de la capa de datos
│   └── test_main.py            # Tests del punto de entrada
│
└── dist/
    └── MyPass                  # Binario ELF portable (generado por build.sh)
```

---

## 🛠️ Stack Tecnológico

| Capa                   | Tecnología                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Backend**            | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| **Base de Datos**      | [Supabase](https://supabase.com/) (PostgreSQL cloud)                           |
| **Validación**         | [Pydantic v2](https://docs.pydantic.dev/)                                      |
| **HTTP Client**        | [HTTPX](https://www.python-httpx.org/) (para HIBP API)                         |
| **Seguridad**          | `secrets` (stdlib), HIBP k-Anonymity                                           |
| **Frontend**           | HTML5, [Tailwind CSS](https://tailwindcss.com/) (CDN), Vanilla JS (ES Modules) |
| **Iconos**             | [Phosphor Icons](https://phosphoricons.com/)                                   |
| **Tipografía**         | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)                |
| **Gestor de Paquetes** | [uv](https://astral.sh/uv/)                                                    |
| **Compilación**        | [PyInstaller](https://pyinstaller.org/) (binario `--onefile`)                  |

---

## 🚀 Inicio Rápido

### 1. Clonar y Preparar

```bash
git clone https://github.com/karlmoz79/generador-de-password.git
cd generador-de-password
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz con tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_api_key_aquí
```

### 3. Ejecutar (Modo Desarrollo)

No necesitas activar el entorno manualmente, `uv` se encarga de todo:

```bash
uv run python main.py
```

El programa te pedirá la **Master Password** en la terminal, luego abre:
🔗 **http://127.0.0.1:8000**

### 4. Compilar como Ejecutable Portable

```bash
bash build.sh
```

El binario se genera en `dist/MyPass`. Ejecútalo desde cualquier ubicación:

```bash
./dist/MyPass
```

> [!IMPORTANT]
> El binario portable incluye todos los archivos estáticos empaquetados. Solo necesitas tener el archivo `.env` en el mismo directorio desde donde lo ejecutes.

---

## 🧪 Tests

```bash
uv run pytest tests/ -v
```

---

## 📡 API Endpoints

| Método   | Endpoint                      | Auth | Descripción                      |
| -------- | ----------------------------- | ---- | -------------------------------- |
| `GET`    | `/`                           | ❌   | Interfaz web principal           |
| `GET`    | `/api/passwords`              | ✅   | Listar todas las credenciales    |
| `GET`    | `/api/password/{website}`     | ✅   | Buscar credencial por sitio      |
| `POST`   | `/api/password`               | ✅   | Guardar/actualizar credencial    |
| `DELETE` | `/api/password/{website}`     | ✅   | Eliminar credencial              |
| `GET`    | `/api/stats`                  | ✅   | Estadísticas de seguridad        |
| `GET`    | `/api/events`                 | ✅   | Últimos 10 eventos de auditoría  |
| `GET`    | `/api/generate`               | ❌   | Generar contraseña aleatoria     |
| `GET`    | `/api/check-breach/{website}` | ✅   | Verificar breach individual      |
| `GET`    | `/api/check-all-breaches`     | ✅   | Verificar todas las contraseñas  |
| `GET`    | `/api/export`                 | ✅   | Exportar credenciales            |
| `POST`   | `/api/import`                 | ✅   | Importar credenciales (JSON/CSV) |

Documentación interactiva: **http://127.0.0.1:8000/docs**

---

## 🔒 Modelo de Seguridad

1. **Sin almacenamiento local de secretos:** La Master Password existe solo en RAM durante la sesión.
2. **Bearer Token:** Cada petición autenticada incluye el header `Authorization: Bearer <password>`.
3. **Timing-safe comparison:** `secrets.compare_digest()` previene ataques de temporización.
4. **k-Anonymity:** Las contraseñas nunca se envían completas a servicios externos; solo un prefijo de 5 chars del hash SHA-1.
5. **CSPRNG:** La generación de contraseñas usa `secrets.choice()`, un generador criptográficamente seguro.
6. **XSS Prevention:** Todas las salidas dinámicas se sanitizan con escape de HTML.

> [!CAUTION]
> Cambia la contraseña maestra en cada sesión para máxima seguridad. Esta aplicación está diseñada para uso personal y no como un servicio multi-usuario.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes una idea para mejorar el dashboard o la seguridad, siéntete libre de abrir un Pull Request o Issue.

---

## 📝 Licencia

Este proyecto fue desarrollado por **Karlmoz** como parte de su suite de herramientas de productividad personal.
