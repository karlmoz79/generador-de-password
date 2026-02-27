/**
 * app.js — Punto de entrada principal de la aplicación.
 * Orquesta la inicialización de todos los módulos.
 */

import * as api from './api.js';
import { initAuth, requireAuth, getToken, clearToken } from './auth.js';
import { refreshDashboard } from './dashboard.js';
import { initGenerator } from './generator.js';
import { initImportExport } from './import-export.js';
import { showMessage } from './ui.js';
import { initVault } from './vault.js';

document.addEventListener("DOMContentLoaded", () => {
    // ── Dark Mode ─────────────────────────────────────────────
    const darkModeBtn = document.getElementById("dark-mode-btn");
    const darkModeIcon = document.getElementById("dark-mode-icon");
    let isDark = localStorage.getItem("theme") === "dark";

    if (isDark) {
        document.documentElement.classList.add("dark");
        darkModeIcon.className = "ph ph-sun text-lg";
    }

    darkModeBtn.addEventListener("click", () => {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
            darkModeIcon.className = "ph ph-sun text-lg";
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
            darkModeIcon.className = "ph ph-moon text-lg";
        }
    });

    // ── Notifications ─────────────────────────────────────────
    document.getElementById("notification-btn").addEventListener("click", () => {
        showMessage("No tienes notificaciones pendientes.", "success");
    });

    // ── Auth ──────────────────────────────────────────────────
    initAuth(() => refreshDashboard());

    // ── Modules ──────────────────────────────────────────────
    initGenerator();
    initVault();
    initImportExport();

    // ── Overwrite Modal ──────────────────────────────────────
    function showOverwriteModal(message) {
        const modal = document.getElementById("overwrite-modal");
        const msg = document.getElementById("overwrite-msg");
        const confirmBtn = document.getElementById("overwrite-confirm");
        const cancelBtn = document.getElementById("overwrite-cancel");

        return new Promise((resolve) => {
            msg.textContent = message;
            modal.classList.remove("hidden");

            function onConfirm() { cleanup(); resolve(true); }
            function onCancel() { cleanup(); resolve(false); }
            function cleanup() {
                confirmBtn.removeEventListener("click", onConfirm);
                cancelBtn.removeEventListener("click", onCancel);
                modal.classList.add("hidden");
            }

            confirmBtn.addEventListener("click", onConfirm);
            cancelBtn.addEventListener("click", onCancel);
        });
    }

    // ── Search Password ──────────────────────────────────────
    document.getElementById("search-btn").addEventListener("click", () => {
        const websiteInput = document.getElementById("website");
        const website = websiteInput.value.trim();
        if (!website) {
            showMessage("Please enter a website to search.", "error");
            return;
        }

        const performSearch = async () => {
            try {
                const result = await api.fetchPassword(website);
                const emailInput = document.getElementById("email");
                const passwordInput = document.getElementById("password");
                const togglePasswordIcon = document.getElementById("toggle-password-icon");

                if (result.ok) {
                    emailInput.value = result.data.email;
                    passwordInput.value = result.data.password;
                    passwordInput.type = "text";
                    if (togglePasswordIcon) {
                        togglePasswordIcon.classList.remove("ph-eye");
                        togglePasswordIcon.classList.add("ph-eye-slash");
                    }
                    showMessage(`Credenciales encontradas para ${website}.`, "success");

                    setTimeout(() => {
                        websiteInput.value = "";
                        emailInput.value = "";
                        passwordInput.value = "";
                        passwordInput.type = "password";
                        if (togglePasswordIcon) {
                            togglePasswordIcon.classList.remove("ph-eye-slash");
                            togglePasswordIcon.classList.add("ph-eye");
                        }
                    }, 5000);

                    refreshDashboard();
                } else {
                    if (result.status === 401) {
                        clearToken();
                        showMessage("Contraseña maestra incorrecta", "error");
                    } else {
                        showMessage(result.data?.detail || "No existen credenciales para este sitio.", "error");
                    }
                    passwordInput.value = "";
                }
            } catch {
                showMessage("Error connecting to server.", "error");
            }
        };

        requireAuth(performSearch);
    });

    // ── Save Password (Form Submit) ──────────────────────────
    document.getElementById("vault-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const websiteInput = document.getElementById("website");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const togglePasswordIcon = document.getElementById("toggle-password-icon");

        const website = websiteInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!website || !password) {
            showMessage("¡Por favor no dejes campos vacíos!", "error");
            return;
        }

        function handleSaveSuccess() {
            showMessage(`¡Credenciales para ${website} guardadas de forma segura!`, "success");
            websiteInput.value = "";
            passwordInput.value = "";
            passwordInput.type = "password";
            if (togglePasswordIcon) {
                togglePasswordIcon.classList.remove("ph-eye-slash");
                togglePasswordIcon.classList.add("ph-eye");
            }
            refreshDashboard();
        }

        async function trySave(force = false) {
            if (!getToken()) return { ok: false, status: 401, data: null };
            return api.savePassword(website, email, password, force);
        }

        try {
            let res = await trySave(false);

            if (res.status === 401) {
                requireAuth(async () => {
                    const retryRes = await trySave(false);
                    if (retryRes.status === 409) {
                        const confirmed = await showOverwriteModal(retryRes.data.detail);
                        if (confirmed) {
                            const finalRes = await trySave(true);
                            if (finalRes.ok) handleSaveSuccess();
                        } else {
                            showMessage("Operación cancelada.", "error");
                        }
                    } else if (retryRes.ok) {
                        handleSaveSuccess();
                    }
                });
                return;
            }

            if (res.status === 409) {
                const confirmed = await showOverwriteModal(res.data.detail);
                if (confirmed) {
                    res = await trySave(true);
                } else {
                    showMessage("Operación cancelada. La contraseña no fue reemplazada.", "error");
                    return;
                }
            }

            if (res.ok) {
                handleSaveSuccess();
            } else {
                showMessage(res.data?.detail || "Error al guardar la contraseña.", "error");
            }
        } catch {
            showMessage("Error al guardar la contraseña. El servidor podría estar inactivo.", "error");
        }
    });

    // ── Initial Load ─────────────────────────────────────────
    refreshDashboard();
});
