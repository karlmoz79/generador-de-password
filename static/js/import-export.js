/**
 * import-export.js — Módulo de importación y exportación de credenciales.
 */

import * as api from './api.js';
import { escapeHtml, showMessage } from './ui.js';
import { refreshDashboard } from './dashboard.js';
import { loadVault } from './vault.js';

let importedCredentials = [];

function parseCSV(content) {
    const lines = content.trim().split("\n");
    const credentials = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length >= 3) {
            credentials.push({
                website: parts[0].trim(),
                email: parts[1].trim(),
                password: parts[2].trim(),
            });
        }
    }
    return credentials;
}

function resetImportModal() {
    const importFileInput = document.getElementById("import-file");
    const importPreview = document.getElementById("import-preview");
    const importOptions = document.getElementById("import-options");
    const importError = document.getElementById("import-error");
    const confirmImportBtn = document.getElementById("confirm-import");
    const importDropzone = document.getElementById("import-dropzone");

    importedCredentials = [];
    importFileInput.value = "";
    importPreview.classList.add("hidden");
    importOptions.classList.add("hidden");
    importError.classList.add("hidden");
    confirmImportBtn.classList.add("hidden");
    importDropzone.classList.remove("hidden");
}

function showImportPreview() {
    const importDropzone = document.getElementById("import-dropzone");
    const importPreview = document.getElementById("import-preview");
    const importOptions = document.getElementById("import-options");
    const confirmImportBtn = document.getElementById("confirm-import");
    const importPreviewBody = document.getElementById("import-preview-body");

    importDropzone.classList.add("hidden");
    importPreview.classList.remove("hidden");
    importOptions.classList.remove("hidden");
    confirmImportBtn.classList.remove("hidden");

    importPreviewBody.innerHTML = "";
    importedCredentials.slice(0, 5).forEach(cred => {
        importPreviewBody.innerHTML += `
            <tr class="text-slate-600 dark:text-slate-300">
                <td class="py-1">${escapeHtml(cred.website)}</td>
                <td class="py-1">${escapeHtml(cred.email)}</td>
            </tr>
        `;
    });
}

function handleImportFile(file) {
    const importError = document.getElementById("import-error");
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
            importedCredentials = ext === ".json"
                ? JSON.parse(e.target.result)
                : parseCSV(e.target.result);

            if (!Array.isArray(importedCredentials) || importedCredentials.length === 0) {
                throw new Error("No credentials found");
            }
            showImportPreview();
        } catch {
            importError.textContent = "Error al parsear el archivo";
            importError.classList.remove("hidden");
        }
    };
    reader.readAsText(file);
}

export function initImportExport() {
    const importModal = document.getElementById("import-modal");
    const closeImportBtn = document.getElementById("close-import");
    const importVaultBtn = document.getElementById("import-vault");
    const importDropzone = document.getElementById("import-dropzone");
    const importFileInput = document.getElementById("import-file");
    const importError = document.getElementById("import-error");
    const confirmImportBtn = document.getElementById("confirm-import");

    const exportModal = document.getElementById("export-modal");
    const closeExportBtn = document.getElementById("close-export");
    const exportVaultBtn = document.getElementById("export-vault");
    const exportJsonBtn = document.getElementById("export-json");
    const exportCsvBtn = document.getElementById("export-csv");

    // Import
    importVaultBtn.addEventListener("click", () => {
        importModal.classList.remove("hidden");
        resetImportModal();
    });

    closeImportBtn.addEventListener("click", () => importModal.classList.add("hidden"));
    importModal.addEventListener("click", (e) => {
        if (e.target === importModal) importModal.classList.add("hidden");
    });

    importDropzone.addEventListener("click", () => importFileInput.click());
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
        if (e.dataTransfer.files.length > 0) handleImportFile(e.dataTransfer.files[0]);
    });
    importFileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleImportFile(e.target.files[0]);
    });

    confirmImportBtn.addEventListener("click", async () => {
        const action = document.querySelector('input[name="import-action"]:checked').value;
        try {
            const result = await api.importPasswords(importedCredentials, action);
            if (result.ok) {
                showMessage(`Importadas: ${result.data.imported}, Omitidas: ${result.data.skipped}`);
                importModal.classList.add("hidden");
                loadVault();
                refreshDashboard();
            } else {
                importError.textContent = "Error al importar credenciales";
                importError.classList.remove("hidden");
            }
        } catch {
            importError.textContent = "Error de conexión";
            importError.classList.remove("hidden");
        }
    });

    // Export
    exportVaultBtn.addEventListener("click", () => exportModal.classList.remove("hidden"));
    closeExportBtn.addEventListener("click", () => exportModal.classList.add("hidden"));
    exportModal.addEventListener("click", (e) => {
        if (e.target === exportModal) exportModal.classList.add("hidden");
    });

    exportJsonBtn.addEventListener("click", async () => {
        try {
            const result = await api.exportPasswords();
            if (result.ok) {
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
                downloadBlob(blob, "passwords.json");
                showMessage("Credenciales exportadas en JSON");
                exportModal.classList.add("hidden");
            }
        } catch {
            showMessage("Error al exportar", "error");
        }
    });

    exportCsvBtn.addEventListener("click", async () => {
        try {
            const result = await api.exportPasswords();
            if (result.ok) {
                let csv = "website,email,password\n";
                for (const [website, cred] of Object.entries(result.data)) {
                    csv += `${website},${cred.email},${cred.password}\n`;
                }
                const blob = new Blob([csv], { type: "text/csv" });
                downloadBlob(blob, "passwords.csv");
                showMessage("Credenciales exportadas en CSV");
                exportModal.classList.add("hidden");
            }
        } catch {
            showMessage("Error al exportar", "error");
        }
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
