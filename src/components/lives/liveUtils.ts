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
    | "x-link"
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
        if (host.includes("x.com") || host.includes("twitter.com")) return "x-link";
    } catch { /* invalid url */ }
    return "unknown";
}

/**
 * Retourne true si la vidéo peut être lue en autoplay, en embed direct, sur notre site.
 * Seul YouTube autorise ça de façon fiable multi-origine — TikTok, Facebook et
 * Instagram ne permettent la lecture que dans leur propre app/plateforme.
 * Utilisé dans LivePlayer pour choisir iframe (embed) vs carte "ouvrir sur X".
 */
export function isEmbeddable(videoLink: string): boolean {
    return getEmbedType(videoLink) === "youtube";
}

/**
 * Retourne true si le lien pointe vers une plateforme vidéo reconnue
 * (même si elle n'est pas embarquable). Utilisé dans LiveFeed pour ne garder
 * que les liens exploitables — un lien "unknown" est cassé ou invalide.
 */
export function hasRecognizedVideo(videoLink: string): boolean {
    return getEmbedType(videoLink) !== "unknown";
}

export function detectPlatform(url: string): string {
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook";
    if (url.includes("instagram.com")) return "instagram";
    if (url.includes("x.com") || url.includes("twitter.com")) return "x";
    return "other";
}
