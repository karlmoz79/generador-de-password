/**
 * api.js — Capa centralizada de llamadas a la API.
 * Todas las peticiones fetch pasan por aquí.
 */

import { getToken } from './auth.js';

function authHeaders() {
    return { "Authorization": getToken() };
}

export async function fetchStats() {
    const res = await fetch("/api/stats", { headers: authHeaders() });
    return res.json();
}

export async function fetchEvents() {
    const res = await fetch("/api/events", { headers: authHeaders() });
    return res.json();
}

export async function fetchPasswords() {
    const res = await fetch("/api/passwords", { headers: authHeaders() });
    return { ok: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

export async function fetchPassword(website) {
    const res = await fetch(`/api/password/${encodeURIComponent(website)}`, {
        headers: authHeaders(),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function savePassword(website, email, password, force = false) {
    const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ website, email, password, force }),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function deletePassword(website) {
    const res = await fetch(`/api/password/${encodeURIComponent(website)}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.ok;
}

export async function checkBreach(website) {
    const res = await fetch(`/api/check-breach/${encodeURIComponent(website)}`, {
        headers: authHeaders(),
    });
    return { ok: res.ok, data: res.ok ? await res.json() : null };
}

export async function checkAllBreaches() {
    const res = await fetch("/api/check-all-breaches", {
        headers: authHeaders(),
    });
    return { ok: res.ok, data: res.ok ? await res.json() : null };
}

export async function generatePassword(length, uppercase, lowercase, numbers, symbols) {
    const params = new URLSearchParams({ length, uppercase, lowercase, numbers, symbols });
    const res = await fetch(`/api/generate?${params}`);
    return res.json();
}

export async function exportPasswords() {
    const res = await fetch("/api/export", { headers: authHeaders() });
    return { ok: res.ok, data: res.ok ? await res.json() : null };
}

export async function importPasswords(credentials, action) {
    const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ credentials, action }),
    });
    return { ok: res.ok, data: res.ok ? await res.json() : null };
}
