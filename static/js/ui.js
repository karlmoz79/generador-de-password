/**
 * ui.js — Utilidades de interfaz de usuario.
 * Funciones para sanitización, mensajes y formateo de tiempo.
 */

/** Escapa HTML para prevenir XSS. */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** Muestra un mensaje de feedback temporal. */
export function showMessage(msg, type = 'success') {
    const feedbackMsg = document.getElementById("feedback-msg");
    feedbackMsg.textContent = msg;
    feedbackMsg.className = `mb-6 p-4 rounded-xl text-sm font-medium transition-all block ${
        type === 'success'
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-red-100 text-red-800'
    }`;
    setTimeout(() => {
        feedbackMsg.classList.add('hidden');
        feedbackMsg.classList.remove('block');
    }, 4000);
}

/** Formatea una fecha ISO como tiempo relativo en español. */
export function timeAgo(dateString) {
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
