import { NextRequest, NextResponse } from "next/server";

/**
 * Unfurl un lien de post/vidéo externe (TikTok, Facebook, Instagram, X…) pour
 * afficher un vrai aperçu (miniature/titre) sur les cartes "ouvrir sur X" de
 * LivePlayer, sans jamais réintégrer d'iframe de ces plateformes.
 *
 * TikTok bloque le scraping HTML classique (page quasi vide, rendue en JS) —
 * on utilise donc son API oEmbed publique, qui renvoie directement thumbnail_url.
 * Facebook et Instagram n'exposent pas de vraie image sans jeton d'app Meta
 * (Instagram sert même un mur de connexion à toute requête non authentifiée) :
 * on récupère au mieux un titre texte via les balises Open Graph, et la carte
 * retombe sur le design de marque élégant côté front si aucune image n'est trouvée.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Seules les plateformes réellement utilisées par le module Lives sont autorisées
// — empêche que cette route serve de proxy générique vers une URL arbitraire (SSRF).
const ALLOWED_SOURCE_SUFFIXES = [
    "tiktok.com", "facebook.com", "fb.watch", "instagram.com", "x.com", "twitter.com",
];

function isAllowedSource(hostname: string): boolean {
    return ALLOWED_SOURCE_SUFFIXES.some(suf => hostname === suf || hostname.endsWith(`.${suf}`));
}

function extractMeta(html: string, prop: string): string | null {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i");
    return html.match(re1)?.[1] ?? html.match(re2)?.[1] ?? null;
}

function decodeEntities(s: string): string {
    return s
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#0?39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

type Preview = { image?: string; title?: string; description?: string };

function proxied(imageUrl: string): string {
    return `/api/link-preview/image?u=${encodeURIComponent(imageUrl)}`;
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { headers, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

/** TikTok bloque le scraping HTML — son endpoint oEmbed public reste, lui, fiable. */
async function fetchTikTokPreview(url: string): Promise<Preview> {
    const res = await fetchWithTimeout(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { "User-Agent": UA },
        6000,
    );
    if (!res.ok) return {};
    const data = await res.json() as { thumbnail_url?: string; title?: string };
    const payload: Preview = {};
    if (data.thumbnail_url) payload.image = proxied(data.thumbnail_url);
    if (data.title) payload.title = data.title;
    return payload;
}

/** Facebook/Instagram/X : au mieux un titre texte via Open Graph, pas d'image fiable. */
async function fetchOpenGraphPreview(url: string): Promise<Preview> {
    const res = await fetchWithTimeout(url, {
        "User-Agent": UA,
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }, 6000);
    const html = await res.text();

    const rawImage = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
    const rawTitle = extractMeta(html, "og:title");
    const rawDescription = extractMeta(html, "og:description");

    const payload: Preview = {};
    if (rawImage) payload.image = proxied(decodeEntities(rawImage));
    if (rawTitle) payload.title = decodeEntities(rawTitle);
    if (rawDescription) payload.description = decodeEntities(rawDescription);
    return payload;
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return NextResponse.json({ error: "invalid_protocol" }, { status: 400 });
    }
    const hostname = parsed.hostname.replace(/^www\./, "");
    if (!isAllowedSource(hostname)) {
        return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
    }

    try {
        const payload = hostname.endsWith("tiktok.com")
            ? await fetchTikTokPreview(url)
            : await fetchOpenGraphPreview(url);

        return NextResponse.json(payload, {
            headers: { "Cache-Control": "public, max-age=3600" },
        });
    } catch {
        // Échec silencieux — le front retombe sur la carte de fallback élégante
        return NextResponse.json({});
    }
}
