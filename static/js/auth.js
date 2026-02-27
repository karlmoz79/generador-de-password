/**
 * auth.js — Módulo de autenticación.
 * Gestiona el token de la contraseña maestra y el flujo de autenticación.
 */

let masterPasswordToken = "";
let pendingAction = null;

export function getToken() {
    return masterPasswordToken;
}

export function setToken(token) {
    masterPasswordToken = token;
}

export function clearToken() {
    masterPasswordToken = "";
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
    const authOverlay = document.getElementById("auth-overlay");
    const adminPasswordInput = document.getElementById("admin-password");
    const authError = document.getElementById("auth-error");

    setPendingAction(action);
    authOverlay.classList.remove("hidden");
    adminPasswordInput.value = "";
    authError.classList.add("hidden");
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
