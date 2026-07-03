import { NextRequest, NextResponse } from "next/server";

/**
 * Unfurl un lien de post/vidéo externe (TikTok, Facebook, Instagram, X…) en
 * récupérant ses balises Open Graph côté serveur — évite le CORS et permet
 * d'afficher un vrai aperçu (miniature/titre) sur les cartes "ouvrir sur X"
 * de LivePlayer, sans jamais réintégrer d'iframe de ces plateformes.
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
    if (!isAllowedSource(parsed.hostname.replace(/^www\./, ""))) {
        return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
            headers: {
                "User-Agent": UA,
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        const html = await res.text();

        const rawImage = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
        const rawTitle = extractMeta(html, "og:title");
        const rawDescription = extractMeta(html, "og:description");

        const payload: { image?: string; title?: string; description?: string } = {};
        if (rawImage) payload.image = `/api/link-preview/image?u=${encodeURIComponent(decodeEntities(rawImage))}`;
        if (rawTitle) payload.title = decodeEntities(rawTitle);
        if (rawDescription) payload.description = decodeEntities(rawDescription);

        return NextResponse.json(payload, {
            headers: { "Cache-Control": "public, max-age=3600" },
        });
    } catch {
        // Échec silencieux — le front retombe sur la carte de fallback élégante
        return NextResponse.json({});
    }
}
