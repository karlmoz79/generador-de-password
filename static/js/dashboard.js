/**
 * dashboard.js — Módulo del dashboard (stats y eventos).
 */

import { fetchStats, fetchEvents } from './api.js';
import { getToken } from './auth.js';
import { escapeHtml, timeAgo } from './ui.js';

export async function loadStats() {
    try {
        const data = await fetchStats();

        document.getElementById("score-value").textContent = `${data.score}%`;
        document.getElementById("strong-count").textContent = data.strong;
        document.getElementById("reused-count").textContent = data.reused;
        document.getElementById("breached-count").textContent = data.breached;

        const strongPct = data.total > 0 ? (data.strong / data.total) * 100 : 0;
        const reusedPct = data.total > 0 ? (data.reused / data.total) * 100 : 0;
        const breachedPct = data.total > 0 ? (data.breached / data.total) * 100 : 0;

        document.getElementById("strong-bar").style.width = `${strongPct}%`;
        document.getElementById("reused-bar").style.width = `${reusedPct}%`;
        document.getElementById("breached-bar").style.width = `${breachedPct}%`;

        // Color del círculo
        const circle = document.getElementById("score-circle");
        circle.setAttribute("stroke-dasharray", `${data.score}, 100`);
        circle.classList.remove("text-emerald-500", "text-orange-500", "text-red-500");
        if (data.score >= 80) circle.classList.add("text-emerald-500");
        else if (data.score >= 50) circle.classList.add("text-orange-500");
        else circle.classList.add("text-red-500");

        // Badge de acción
        const badge = document.getElementById("action-badge");
        if (badge) {
            if (data.reused > 0 || data.breached > 0) {
                badge.textContent = "Acción Requerida";
                badge.className = "text-xs font-bold text-red-500 bg-red-100 dark:bg-red-500/20 px-3 py-1 rounded-full uppercase tracking-wider";
            } else if (data.score < 80) {
                badge.textContent = "Mejorable";
                badge.className = "text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-3 py-1 rounded-full uppercase tracking-wider";
            } else {
                badge.textContent = "Excelente";
                badge.className = "text-xs font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider";
            }
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

export async function loadEvents() {
    const eventsContainer = document.getElementById("events-container");
    try {
        const events = await fetchEvents();
        eventsContainer.innerHTML = '';

        if (events.length === 0) {
            eventsContainer.innerHTML = '<div class="flex justify-center items-center h-full text-slate-400 text-sm">No hay eventos recientes.</div>';
            return;
        }

        events.forEach(ev => {
            let icon, colorClass, bgClass;

            if (ev.type === 'login') {
                icon = 'ph-sign-in'; colorClass = 'text-emerald-500'; bgClass = 'bg-emerald-50 dark:bg-emerald-500/10';
            } else if (ev.type === 'warning') {
                icon = 'ph-warning'; colorClass = 'text-orange-500'; bgClass = 'bg-orange-50 dark:bg-orange-500/10';
            } else {
                icon = 'ph-device-mobile'; colorClass = 'text-blue-500'; bgClass = 'bg-blue-50 dark:bg-blue-500/10';
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

export function refreshDashboard() {
    loadStats();
    loadEvents();
}
