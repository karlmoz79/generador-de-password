/**
 * generator.js — Módulo del generador de contraseñas e indicador de fuerza.
 */

import * as api from './api.js';
import { showMessage } from './ui.js';

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
        strength = "fuerte"; color = "bg-emerald-500"; width = "100%";
    } else if (score >= 3) {
        strength = "media"; color = "bg-orange-500"; width = "57%";
    }

    text.textContent = strength;
    text.className = `text-sm font-bold ${color.replace('bg-', 'text-')}`;
    bar.className = `h-full rounded-full transition-all ${color}`;
    bar.style.width = width;
}

export function initGenerator() {
    const passwordInput = document.getElementById("password");
    const generateBtn = document.getElementById("generate-btn");
    const togglePasswordIcon = document.getElementById("toggle-password-icon");

    // Slider de longitud
    document.getElementById("password-length").addEventListener("input", (e) => {
        document.getElementById("length-value").textContent = e.target.value;
    });

    generateBtn.addEventListener("click", async () => {
        const length = document.getElementById("password-length").value;
        const uppercase = document.getElementById("opt-uppercase").checked;
        const lowercase = document.getElementById("opt-lowercase").checked;
        const numbers = document.getElementById("opt-numbers").checked;
        const symbols = document.getElementById("opt-symbols").checked;

        try {
            const data = await api.generatePassword(length, uppercase, lowercase, numbers, symbols);
            passwordInput.value = data.password;
            passwordInput.type = "text";
            updateStrengthIndicator(data.password);
            showMessage("¡Contraseña generada!", "success");

            setTimeout(() => {
                passwordInput.type = "password";
            }, 5000);
        } catch {
            showMessage("Error generando contraseña.", "error");
        }
    });

    // Toggle password visibility
    const togglePasswordBtn = document.getElementById("toggle-password");
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            if (type === "text") {
                togglePasswordIcon.classList.remove("ph-eye");
                togglePasswordIcon.classList.add("ph-eye-slash");
            } else {
                togglePasswordIcon.classList.remove("ph-eye-slash");
                togglePasswordIcon.classList.add("ph-eye");
            }
        });
    }
}
