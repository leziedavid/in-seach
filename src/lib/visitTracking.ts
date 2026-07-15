import { getBaseUrl } from "@/api/api";
import { getToken } from "@/lib/auth";
import { isPWAStandalone } from "@/hooks/usePWA";

/**
 * Utilitaire centralisé de suivi de visite — appelé une fois par jour maximum
 * (le serveur redéduplique aussi côté base via une clé unique, voir backend
 * site-visit.service.ts). Volontairement léger et non invasif : pas de canvas/
 * WebGL fingerprinting, juste assez de signaux pour reconnaître raisonnablement
 * le même appareil d'un jour à l'autre.
 */

const FINGERPRINT_KEY = "djamko_visitor_fp";
const LAST_VISIT_KEY = "djamko_last_visit_date";

// Garde-fou synchrone anti-double-appel (StrictMode / re-renders) — posé AVANT
// tout await pour fermer la fenêtre de course entre deux effets concurrents.
let firedThisSession = false;

function todayUTC(): string {
    return new Date().toISOString().split("T")[0];
}

async function sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOrCreateFingerprint(): Promise<string> {
    const cached = localStorage.getItem(FINGERPRINT_KEY);
    if (cached) return cached;

    const raw = [
        navigator.userAgent,
        navigator.platform,
        navigator.language,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        `${screen.width}x${screen.height}`,
        isPWAStandalone() ? "pwa" : "browser",
    ].join("|");

    const hash = await sha256Hex(raw);
    localStorage.setItem(FINGERPRINT_KEY, hash);
    return hash;
}

export async function trackVisit(): Promise<void> {
    if (typeof window === "undefined") return;
    if (firedThisSession) return;

    const today = todayUTC();
    if (localStorage.getItem(LAST_VISIT_KEY) === today) return;

    firedThisSession = true;

    try {
        const token = getToken();
        const payload = {
            fingerprint: token ? undefined : await getOrCreateFingerprint(),
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenSize: `${screen.width}x${screen.height}`,
            isPWA: isPWAStandalone(),
        };

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${getBaseUrl()}/site-visit/track`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            localStorage.setItem(LAST_VISIT_KEY, today);
        }
    } catch {
        // Le suivi de visite ne doit jamais impacter le rendu de la page.
    }
}
