/**
 * Utilitaires partagés du module Lives
 * Importé par LivePlayer.tsx et LiveFeed.tsx
 */

export function getYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.pathname.includes("/shorts/")) return u.pathname.split("/shorts/")[1].split(/[?/]/)[0];
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    } catch { /* invalid url */ }
    return null;
}

export function getTikTokVideoId(url: string): string | null {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
}

export type EmbedType =
    | "youtube"
    | "tiktok-player"
    | "tiktok-link"
    | "facebook"
    | "instagram-link"
    | "unknown";

export function getEmbedType(videoLink: string): EmbedType {
    try {
        const u = new URL(videoLink);
        const host = u.hostname.replace("www.", "");
        if (host.includes("youtube.com") || host === "youtu.be") {
            return getYouTubeId(videoLink) ? "youtube" : "unknown";
        }
        if (host.includes("tiktok.com")) {
            return getTikTokVideoId(videoLink) ? "tiktok-player" : "tiktok-link";
        }
        if (host.includes("facebook.com") || host.includes("fb.watch")) return "facebook";
        if (host.includes("instagram.com")) return "instagram-link";
    } catch { /* invalid url */ }
    return "unknown";
}

/**
 * Retourne true si la vidéo peut être lue en embed dans l'application.
 * Utilisé dans LiveFeed pour filtrer les vidéos non-lisibles.
 */
export function isEmbeddable(videoLink: string): boolean {
    const type = getEmbedType(videoLink);
    return type === "youtube" || type === "tiktok-player" || type === "facebook";
}

export function detectPlatform(url: string): string {
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook";
    if (url.includes("instagram.com")) return "instagram";
    return "other";
}
