document.addEventListener("DOMContentLoaded", () => {
    // XSS Prevention - sanitize user input
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    const websiteInput = document.getElementById("website");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    
    const searchBtn = document.getElementById("search-btn");
    const generateBtn = document.getElementById("generate-btn");
    const form = document.getElementById("vault-form");
    const feedbackMsg = document.getElementById("feedback-msg");
    const darkModeBtn = document.getElementById("dark-mode-btn");
    const darkModeIcon = document.getElementById("dark-mode-icon");
    const notifBtn = document.getElementById("notification-btn");
    const eventsContainer = document.getElementById("events-container");
    const togglePasswordBtn = document.getElementById("toggle-password");
    const togglePasswordIcon = document.getElementById("toggle-password-icon");

    // Toggle Password Visibility in Main Form
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            // Toggle eye icon class
            if (type === "text") {
                togglePasswordIcon.classList.remove("ph-eye");
                togglePasswordIcon.classList.add("ph-eye-slash");
            } else {
                togglePasswordIcon.classList.remove("ph-eye-slash");
                togglePasswordIcon.classList.add("ph-eye");
            }
        });
    }

    // Dark Mode Toggle
    let isDark = localStorage.getItem("theme") === "dark";
    if (isDark) document.documentElement.classList.add("dark");
    
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

    if (isDark) darkModeIcon.className = "ph ph-sun text-lg";

    // Notifications
    notifBtn.addEventListener("click", () => {
        showMessage("No tienes notificaciones pendientes.", "success");
    });


    // Helper to show messages
    function showMessage(msg, type = 'success') {
        feedbackMsg.textContent = msg;
        feedbackMsg.className = `mb-6 p-4 rounded-xl text-sm font-medium transition-all block ${type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`;
        
        // Hide after 4 seconds
        setTimeout(() => {
            feedbackMsg.classList.add('hidden');
            feedbackMsg.classList.remove('block');
        }, 4000);
    }

    // Load Stats
    async function loadStats() {
        try {
            const res = await fetch("/api/stats");
            const data = await res.json();
            
            // Update counts
            document.getElementById("score-value").textContent = `${data.score}%`;
            document.getElementById("strong-count").textContent = data.strong;
            document.getElementById("reused-count").textContent = data.reused;
            document.getElementById("breached-count").textContent = data.breached;
            
            // Update bars 
            const strongPct = data.total > 0 ? (data.strong / data.total) * 100 : 0;
            const reusedPct = data.total > 0 ? (data.reused / data.total) * 100 : 0;
            const breachedPct = data.total > 0 ? (data.breached / data.total) * 100 : 0;
            
            document.getElementById("strong-bar").style.width = `${strongPct}%`;
            document.getElementById("reused-bar").style.width = `${reusedPct}%`;
            document.getElementById("breached-bar").style.width = `${breachedPct}%`;
            
            // Update Circle
            document.getElementById("score-circle").setAttribute("stroke-dasharray", `${data.score}, 100`);
            
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    }

    // Load Events
    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 60) return 'Ahora mismo';
        if (minutes < 60) return `HACE ${minutes}M`;
        if (hours < 24) return `HACE ${hours}H`;
        return `HACE ${days}D`;
    }

    async function loadEvents() {
        try {
            const res = await fetch("/api/events");
            const events = await res.json();
            
            eventsContainer.innerHTML = '';
            
            if(events.length === 0) {
                eventsContainer.innerHTML = '<div class="flex justify-center items-center h-full text-slate-400 text-sm">No hay eventos recientes.</div>';
                return;
            }

            events.forEach(ev => {
                let icon = '';
                let colorClass = '';
                let bgClass = '';
                
                if (ev.type === 'login') {
                    icon = 'ph-sign-in';
                    colorClass = 'text-emerald-500';
                    bgClass = 'bg-emerald-50 dark:bg-emerald-500/10';
                } else if (ev.type === 'warning') {
                    icon = 'ph-warning';
                    colorClass = 'text-orange-500';
                    bgClass = 'bg-orange-50 dark:bg-orange-500/10';
                } else {
                    icon = 'ph-device-mobile';
                    colorClass = 'text-blue-500';
                    bgClass = 'bg-blue-50 dark:bg-blue-500/10';
                }

                eventsContainer.innerHTML += `
                    <div class="flex items-center gap-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl">
                        <div class="w-12 h-12 ${bgClass} rounded-xl flex items-center justify-center ${colorClass} shrink-0">
                            <i class="ph-fill ${icon} text-xl"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-800 dark:text-white truncate">${escapeHtml(ev.title)}</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${escapeHtml(ev.description)}</p>
                        </div>
                        <div class="text-[0.65rem] font-bold text-slate-400 tracking-wider">
                            ${timeAgo(ev.timestamp)}
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error("Error loading events:", error);
        }
    }

    function refreshDashboard() {
        loadStats();
        loadEvents();
    }

    // Vault Elements
    const vaultOverlay = document.getElementById("vault-overlay");
    const vaultToggleBtn = document.getElementById("vault-toggle-btn");
    const closeVaultBtn = document.getElementById("close-vault");
    const refreshVaultBtn = document.getElementById("refresh-vault");
    const vaultTableBody = document.getElementById("vault-table-body");
    const vaultEmptyState = document.getElementById("vault-empty-state");
    const vaultCount = document.getElementById("vault-count");

    // Vault Auth Elements
    const authOverlay = document.getElementById("auth-overlay");
    const closeAuthBtn = document.getElementById("close-auth");
    const authForm = document.getElementById("auth-form");
    const adminPasswordInput = document.getElementById("admin-password");
    const authError = document.getElementById("auth-error");

    let masterPasswordToken = "";

    // Vault Toggle
    vaultToggleBtn.addEventListener("click", () => {
        authOverlay.classList.remove("hidden");
        adminPasswordInput.value = "";
        authError.classList.add("hidden");
        adminPasswordInput.focus();
    });

    closeAuthBtn.addEventListener("click", () => {
        authOverlay.classList.add("hidden");
    });
    
    // Auth Form Submission
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pwd = adminPasswordInput.value;
        
        try {
            // Store token
            masterPasswordToken = `Bearer ${pwd}`;
            
            // Try to load vault
            const success = await loadVault();
            
            if (success) {
                authOverlay.classList.add("hidden");
                vaultOverlay.classList.remove("hidden");
            } else {
                authError.classList.remove("hidden");
                adminPasswordInput.value = "";
                adminPasswordInput.focus();
                masterPasswordToken = "";
            }
        } catch (err) {
            authError.classList.remove("hidden");
        }
    });

    closeVaultBtn.addEventListener("click", () => {
        vaultOverlay.classList.add("hidden");
    });

    refreshVaultBtn.addEventListener("click", loadVault);

    // Close on click outside
    vaultOverlay.addEventListener("click", (e) => {
        if (e.target === vaultOverlay) vaultOverlay.classList.add("hidden");
    });

    async function loadVault() {
        try {
            const res = await fetch("/api/passwords", {
                headers: {
                    "Authorization": masterPasswordToken
                }
            });
            
            if (!res.ok) {
                if(res.status === 401) {
                    return false; // Auth failed
                }
                throw new Error("Failed to load");
            }
            
            const passwords = await res.json();
            
            vaultCount.textContent = passwords.length;
            vaultTableBody.innerHTML = '';
            
            if (passwords.length === 0) {
                vaultEmptyState.classList.remove("hidden");
                return;
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
                
                // Add event listeners
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
                        await deletePassword(p.website);
                    }
                });
                
                vaultTableBody.appendChild(tr);
            });
            return true; // Auth succeeded and vault loaded
        } catch (error) {
            console.error("Error loading vault:", error);
            return false;
        }
    }

    async function deletePassword(website) {
        try {
            const res = await fetch(`/api/password/${encodeURIComponent(website)}`, { method: "DELETE" });
            if (res.ok) {
                showMessage(`Credenciales de ${website} eliminadas.`);
                loadVault();
                refreshDashboard();
            } else {
                showMessage("Error al eliminar las credenciales.", "error");
            }
        } catch (error) {
            showMessage("Error de conexión al eliminar.", "error");
        }
    }

    // Import/Export Modal Elements
    const importModal = document.getElementById("import-modal");
    const closeImportBtn = document.getElementById("close-import");
    const importVaultBtn = document.getElementById("import-vault");
    const importDropzone = document.getElementById("import-dropzone");
    const importFileInput = document.getElementById("import-file");
    const importPreview = document.getElementById("import-preview");
    const importPreviewBody = document.getElementById("import-preview-body");
    const importOptions = document.getElementById("import-options");
    const importError = document.getElementById("import-error");
    const confirmImportBtn = document.getElementById("confirm-import");

    const exportModal = document.getElementById("export-modal");
    const closeExportBtn = document.getElementById("close-export");
    const exportVaultBtn = document.getElementById("export-vault");
    const exportJsonBtn = document.getElementById("export-json");
    const exportCsvBtn = document.getElementById("export-csv");

    let importedCredentials = [];

    // Import Modal
    importVaultBtn.addEventListener("click", () => {
        importModal.classList.remove("hidden");
        resetImportModal();
    });

    closeImportBtn.addEventListener("click", () => {
        importModal.classList.add("hidden");
    });

    importModal.addEventListener("click", (e) => {
        if (e.target === importModal) importModal.classList.add("hidden");
    });

    function resetImportModal() {
        importedCredentials = [];
        importFileInput.value = "";
        importPreview.classList.add("hidden");
        importOptions.classList.add("hidden");
        importError.classList.add("hidden");
        confirmImportBtn.classList.add("hidden");
        importDropzone.classList.remove("hidden");
    }

    importDropzone.addEventListener("click", () => {
        importFileInput.click();
    });

    importDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        importDropzone.classList.add("border-blue-400", "bg-blue-50", "dark:bg-blue-500/10");
    });

    importDropzone.addEventListener("dragleave", () => {
        importDropzone.classList.remove("border-blue-400", "bg-blue-50", "dark:bg-blue-500/10");
    });

    importDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        importDropzone.classList.remove("border-blue-400", "bg-blue-50", "dark:bg-blue-500/10");
        const files = e.dataTransfer.files;
        if (files.length > 0) handleImportFile(files[0]);
    });

    importFileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleImportFile(e.target.files[0]);
    });

    function handleImportFile(file) {
        const validTypes = [".csv", ".json"];
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        
        if (!validTypes.includes(ext)) {
            importError.textContent = "Tipo de archivo no válido. Usa .csv o .json";
            importError.classList.remove("hidden");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (ext === ".json") {
                    importedCredentials = JSON.parse(e.target.result);
                } else {
                    importedCredentials = parseCSV(e.target.result);
                }

                if (!Array.isArray(importedCredentials) || importedCredentials.length === 0) {
                    throw new Error("No credentials found");
                }

                showImportPreview();
            } catch (err) {
                importError.textContent = "Error al parsear el archivo";
                importError.classList.remove("hidden");
            }
        };
        reader.readAsText(file);
    }

    function parseCSV(content) {
        const lines = content.trim().split("\n");
        const credentials = [];
        
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(",");
            if (parts.length >= 3) {
                credentials.push({
                    website: parts[0].trim(),
                    email: parts[1].trim(),
                    password: parts[2].trim()
                });
            }
        }
        return credentials;
    }

    function showImportPreview() {
        importDropzone.classList.add("hidden");
        importPreview.classList.remove("hidden");
        importOptions.classList.remove("hidden");
        confirmImportBtn.classList.remove("hidden");

        importPreviewBody.innerHTML = "";
        const previewItems = importedCredentials.slice(0, 5);
        previewItems.forEach(cred => {
            importPreviewBody.innerHTML += `
                <tr class="text-slate-600 dark:text-slate-300">
                    <td class="py-1">${escapeHtml(cred.website)}</td>
                    <td class="py-1">${escapeHtml(cred.email)}</td>
                </tr>
            `;
        });
    }

    confirmImportBtn.addEventListener("click", async () => {
        const action = document.querySelector('input[name="import-action"]:checked').value;
        
        try {
            const res = await fetch("/api/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": masterPasswordToken
                },
                body: JSON.stringify({
                    credentials: importedCredentials,
                    action: action
                })
            });

            if (res.ok) {
                const result = await res.json();
                showMessage(`Importadas: ${result.imported}, Omitidas: ${result.skipped}`);
                importModal.classList.add("hidden");
                loadVault();
                refreshDashboard();
            } else {
                importError.textContent = "Error al importar credenciales";
                importError.classList.remove("hidden");
            }
        } catch (error) {
            importError.textContent = "Error de conexión";
            importError.classList.remove("hidden");
        }
    });

    // Export Modal
    exportVaultBtn.addEventListener("click", () => {
        exportModal.classList.remove("hidden");
    });

    closeExportBtn.addEventListener("click", () => {
        exportModal.classList.add("hidden");
    });

    exportModal.addEventListener("click", (e) => {
        if (e.target === exportModal) exportModal.classList.add("hidden");
    });

    exportJsonBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/export", {
                headers: { "Authorization": masterPasswordToken }
            });
            
            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "passwords.json";
                a.click();
                URL.revokeObjectURL(url);
                showMessage("Credenciales exportadas en JSON");
                exportModal.classList.add("hidden");
            }
        } catch (error) {
            showMessage("Error al exportar", "error");
        }
    });

    exportCsvBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/export", {
                headers: { "Authorization": masterPasswordToken }
            });
            
            if (res.ok) {
                const data = await res.json();
                let csv = "website,email,password\n";
                for (const [website, cred] of Object.entries(data)) {
                    csv += `${website},${cred.email},${cred.password}\n`;
                }
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "passwords.csv";
                a.click();
                URL.revokeObjectURL(url);
                showMessage("Credenciales exportadas en CSV");
                exportModal.classList.add("hidden");
            }
        } catch (error) {
            showMessage("Error al exportar", "error");
        }
    });

    // Call on load
    refreshDashboard();

    // Search Password
    searchBtn.addEventListener("click", async () => {
        const website = websiteInput.value.trim();
        if (!website) {
            showMessage("Please enter a website to search.", "error");
            return;
        }

        try {
            const res = await fetch(`/api/password/${encodeURIComponent(website)}`);
            const data = await res.json();
            
            if (res.ok) {
                emailInput.value = data.email;
                passwordInput.value = data.password;
                passwordInput.type = "text"; // Reveal password temporarily
                if (togglePasswordIcon) {
                    togglePasswordIcon.classList.remove("ph-eye");
                    togglePasswordIcon.classList.add("ph-eye-slash");
                }
                
                // Copy to clipboard
                await navigator.clipboard.writeText(data.password);
                showMessage(`Credenciales encontradas para ${website}. ¡Contraseña copiada al portapapeles!`, "success");
                
                // Re-hide password after 5 seconds
                setTimeout(() => {
                    passwordInput.type = "password";
                    if (togglePasswordIcon) {
                        togglePasswordIcon.classList.remove("ph-eye-slash");
                        togglePasswordIcon.classList.add("ph-eye");
                    }
                }, 5000);
                
                refreshDashboard(); // Refresh to log search event
            } else {
                showMessage(data.detail || "No existen credenciales para este sitio.", "error");
                passwordInput.value = "";
            }
        } catch (error) {
            showMessage("Error connecting to server.", "error");
        }
    });

    // Generate Password
    generateBtn.addEventListener("click", async () => {
        const length = document.getElementById("password-length").value;
        const uppercase = document.getElementById("opt-uppercase").checked;
        const lowercase = document.getElementById("opt-lowercase").checked;
        const numbers = document.getElementById("opt-numbers").checked;
        const symbols = document.getElementById("opt-symbols").checked;
        
        try {
            const params = new URLSearchParams({
                length,
                uppercase,
                lowercase,
                numbers,
                symbols
            });
            const res = await fetch(`/api/generate?${params}`);
            const data = await res.json();
            
            passwordInput.value = data.password;
            passwordInput.type = "text";
            
            // Update strength indicator
            updateStrengthIndicator(data.password);
            
            await navigator.clipboard.writeText(data.password);
            showMessage("¡Contraseña generada y copiada al portapapeles!", "success");
            
            setTimeout(() => {
                passwordInput.type = "password";
            }, 5000);
        } catch (error) {
            showMessage("Error generando contraseña.", "error");
        }
    });

    function updateStrengthIndicator(password) {
        const indicator = document.getElementById("strength-indicator");
        const text = document.getElementById("strength-text");
        const bar = document.getElementById("strength-bar");
        
        indicator.classList.remove("hidden");
        
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        let strength = "débil";
        let color = "bg-red-500";
        let width = "14%";
        
        if (score >= 5) {
            strength = "fuerte";
            color = "bg-emerald-500";
            width = "100%";
        } else if (score >= 3) {
            strength = "media";
            color = "bg-orange-500";
            width = "57%";
        }
        
        text.textContent = strength;
        text.className = `text-sm font-bold ${color.replace('bg-', 'text-')}`;
        bar.className = `h-full rounded-full transition-all ${color}`;
        bar.style.width = width;
    }

    document.getElementById("password-length").addEventListener("input", (e) => {
        document.getElementById("length-value").textContent = e.target.value;
    });

    // Add/Save Password
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const website = websiteInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!website || !password) {
            showMessage("¡Por favor no dejes campos vacíos!", "error");
            return;
        }

        try {
            const res = await fetch("/api/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ website, email, password })
            });

            if (res.ok) {
                showMessage(`¡Credenciales para ${website} guardadas de forma segura!`, "success");
                websiteInput.value = "";
                passwordInput.value = "";
                passwordInput.type = "password";
                if (togglePasswordIcon) {
                    togglePasswordIcon.classList.remove("ph-eye-slash");
                    togglePasswordIcon.classList.add("ph-eye");
                }
                refreshDashboard(); // refresh stats and events
            } else {
                const data = await res.json();
                showMessage(data.detail || "Error al guardar la contraseña.", "error");
            }
        } catch (error) {
            showMessage("Error al guardar la contraseña. El servidor podría estar inactivo.", "error");
        }
    });
});
