/**
 * vault.js — Módulo de la bóveda de credenciales (Admin Vault).
 */

import * as api from './api.js';
import { getToken } from './auth.js';
import { escapeHtml, showMessage } from './ui.js';
import { refreshDashboard } from './dashboard.js';

export async function loadVault() {
    try {
        const result = await api.fetchPasswords();

        if (!result.ok) {
            return result.status !== 401;
        }

        const passwords = result.data;
        const vaultCount = document.getElementById("vault-count");
        const vaultTableBody = document.getElementById("vault-table-body");
        const vaultEmptyState = document.getElementById("vault-empty-state");

        vaultCount.textContent = passwords.length;
        vaultTableBody.innerHTML = '';

        if (passwords.length === 0) {
            vaultEmptyState.classList.remove("hidden");
            return true;
        }

        vaultEmptyState.classList.add("hidden");

        passwords.forEach(p => {
            const tr = document.createElement("tr");
            tr.className = "bg-white/40 dark:bg-slate-800/40 rounded-2xl transition-all hover:bg-white/60 dark:hover:bg-slate-800/60 group";
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-slate-800 dark:text-white rounded-l-2xl">${escapeHtml(p.website)}</td>
                <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">${escapeHtml(p.email)}</td>
                <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-sm tracking-widest vault-password items-center flex gap-2 w-[180px] h-[72px]">
                    <span class="pwd-text transition-all truncate">••••••••</span>
                </td>
                <td class="px-6 py-4 text-right rounded-r-2xl h-[72px]">
                    <div class="flex justify-end gap-2">
                        <button class="check-breach-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors shadow-sm" title="Verificar si fue comprometida">
                            <i class="ph ph-shield-warning"></i>
                        </button>
                        <button class="toggle-vault-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors shadow-sm" title="Mostrar/Ocultar Contraseña">
                            <i class="ph ph-eye hover-icon"></i>
                        </button>
                        <button class="copy-vault-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors shadow-sm" title="Copiar Contraseña">
                            <i class="ph ph-copy"></i>
                        </button>
                        <button class="delete-vault-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors shadow-sm" title="Eliminar">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            let isVisible = false;
            const toggleBtn = tr.querySelector(".toggle-vault-btn");
            const toggleIcon = toggleBtn.querySelector("i");
            const pwdText = tr.querySelector(".pwd-text");

            toggleBtn.addEventListener("click", () => {
                isVisible = !isVisible;
                if (isVisible) {
                    pwdText.textContent = p.password;
                    toggleIcon.classList.remove("ph-eye");
                    toggleIcon.classList.add("ph-eye-slash");
                } else {
                    pwdText.textContent = "••••••••";
                    toggleIcon.classList.remove("ph-eye-slash");
                    toggleIcon.classList.add("ph-eye");
                }
            });

            tr.querySelector(".copy-vault-btn").addEventListener("click", async () => {
                await navigator.clipboard.writeText(p.password);
                showMessage(`Contraseña de ${escapeHtml(p.website)} copiada.`, "success");
            });

            tr.querySelector(".delete-vault-btn").addEventListener("click", async () => {
                if (confirm(`¿Estás seguro de que quieres eliminar las credenciales de ${p.website}?`)) {
                    const ok = await api.deletePassword(p.website);
                    if (ok) {
                        showMessage(`Credenciales de ${p.website} eliminadas.`);
                        loadVault();
                        refreshDashboard();
                    } else {
                        showMessage("Error al eliminar las credenciales.", "error");
                    }
                }
            });

            tr.querySelector(".check-breach-btn").addEventListener("click", async () => {
                try {
                    const result = await api.checkBreach(p.website);
                    if (result.ok) {
                        if (result.data.breached) {
                            alert(`⚠️ ALERTA: La contraseña de ${p.website} ha sido comprometida.\n\nEsta contraseña aparece en ${result.data.count.toLocaleString()} filtraciones de datos.\n\nSe recomienda cambiarla inmediatamente.`);
                        } else {
                            alert(`✅ La contraseña de ${p.website} no ha sido encontrada en filtraciones conocidas.`);
                        }
                        refreshDashboard();
                    }
                } catch {
                    showMessage("Error al verificar la contraseña.", "error");
                }
            });

            vaultTableBody.appendChild(tr);
        });

        return true;
    } catch (error) {
        console.error("Error loading vault:", error);
        return false;
    }
}

export function initVault() {
    const vaultOverlay = document.getElementById("vault-overlay");
    const closeVaultBtn = document.getElementById("close-vault");
    const refreshVaultBtn = document.getElementById("refresh-vault");
    const checkAllBreachesBtn = document.getElementById("check-all-breaches");

    // Importamos requireAuth dinámicamente para evitar dependencia circular
    import('./auth.js').then(({ requireAuth }) => {
        document.getElementById("vault-toggle-btn").addEventListener("click", () => {
            requireAuth(async () => {
                const success = await loadVault();
                if (success) vaultOverlay.classList.remove("hidden");
            });
        });
    });

    closeVaultBtn.addEventListener("click", () => {
        vaultOverlay.classList.add("hidden");
    });

    vaultOverlay.addEventListener("click", (e) => {
        if (e.target === vaultOverlay) vaultOverlay.classList.add("hidden");
    });

    refreshVaultBtn.addEventListener("click", loadVault);

    checkAllBreachesBtn.addEventListener("click", async () => {
        if (!getToken()) return;
        try {
            checkAllBreachesBtn.disabled = true;
            checkAllBreachesBtn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Verificando...';

            const result = await api.checkAllBreaches();
            if (result.ok) {
                const breached = result.data.filter(r => r.breached === true);
                if (breached.length > 0) {
                    let message = "⚠️ ALERTA: Las siguientes contraseñas han sido comprometidas:\n\n";
                    breached.forEach(b => {
                        message += `• ${b.website}: ${b.count.toLocaleString()} filtraciones\n`;
                    });
                    message += "\nSe recomienda cambiar estas contraseñas inmediatamente.";
                    alert(message);
                } else {
                    alert("✅ Ninguna contraseña ha sido encontrada en filtraciones conocidas.");
                }
                refreshDashboard();
            }
        } catch {
            showMessage("Error al verificar las contraseñas.", "error");
        } finally {
            checkAllBreachesBtn.disabled = false;
            checkAllBreachesBtn.innerHTML = '<i class="ph ph-shield-warning"></i> Verificar Todas';
        }
    });
}
