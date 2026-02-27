/**
 * auth.js — Módulo de autenticación.
 * Gestiona el token de la contraseña maestra usando sessionStorage
 * para persistir entre recargas de página (F5) pero no entre sesiones.
 */

const SESSION_KEY = "mypass_auth_token";

let pendingAction = null;

export function getToken() {
    const pwd = sessionStorage.getItem(SESSION_KEY) || "";
    return pwd ? `Bearer ${pwd}` : "";
}

export function setToken(token) {
    // Guardar solo la contraseña sin el prefijo Bearer
    const pwd = token.startsWith("Bearer ") ? token.slice(7) : token;
    sessionStorage.setItem(SESSION_KEY, pwd);
}

export function clearToken() {
    sessionStorage.removeItem(SESSION_KEY);
}

export function getPendingAction() {
    return pendingAction;
}

export function setPendingAction(action) {
    pendingAction = action;
}

export function clearPendingAction() {
    pendingAction = null;
}

/**
 * Muestra el overlay de autenticación y configura la acción pendiente.
 * @param {Function} action — Función async a ejecutar tras autenticarse.
 */
export function requireAuth(action) {
    // Si ya tenemos un token válido en sessionStorage, ejecutar directamente
    if (getToken()) {
        action();
        return;
    }

    const authOverlay = document.getElementById("auth-overlay");
    const adminPasswordInput = document.getElementById("admin-password");
    const authError = document.getElementById("auth-error");
    const closeAuthBtn = document.getElementById("close-auth");

    setPendingAction(action);
    authOverlay.classList.remove("hidden");
    adminPasswordInput.value = "";
    authError.classList.add("hidden");

    // Ocultar botón de cerrar si es el login inicial (no hay token aún)
    closeAuthBtn.style.display = "none";

    adminPasswordInput.focus();
}

/**
 * Inicializa el formulario de autenticación (login overlay).
 * @param {Function} onAuthSuccess — Callback cuando la autenticación es exitosa.
 */
export function initAuth(onAuthSuccess) {
    const authOverlay = document.getElementById("auth-overlay");
    const closeAuthBtn = document.getElementById("close-auth");
    const authForm = document.getElementById("auth-form");
    const adminPasswordInput = document.getElementById("admin-password");
    const authError = document.getElementById("auth-error");

    closeAuthBtn.addEventListener("click", () => {
        authOverlay.classList.add("hidden");
    });

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pwd = adminPasswordInput.value;
        const tempToken = `Bearer ${pwd}`;

        try {
            const res = await fetch("/api/passwords", {
                headers: { "Authorization": tempToken },
            });

            if (res.ok) {
                setToken(tempToken);
                authOverlay.classList.add("hidden");
                // Restaurar botón cerrar para futuros usos del overlay
                closeAuthBtn.style.display = "";
                const action = getPendingAction();
                if (action) {
                    await action();
                    clearPendingAction();
                }
                if (onAuthSuccess) onAuthSuccess();
            } else {
                authError.classList.remove("hidden");
                adminPasswordInput.value = "";
                adminPasswordInput.focus();
                clearToken();
            }
        } catch {
            authError.classList.remove("hidden");
        }
    });
}
