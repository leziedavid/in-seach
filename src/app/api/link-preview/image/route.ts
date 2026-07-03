import { NextRequest, NextResponse } from "next/server";

/**
 * Reproxy l'image de miniature (og:image) récupérée par /api/link-preview.
 * Nécessaire car la CSP img-src du site n'autorise pas les CDN tiers
 * (tiktokcdn, fbcdn, cdninstagram, twimg…) — on sert l'image depuis notre
 * propre origine plutôt que d'élargir la CSP à des sous-domaines imprévisibles.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ALLOWED_IMAGE_SUFFIXES = [
    "tiktokcdn.com", "tiktokcdn-us.com", "tiktokcdn-eu.com", "ibytedtos.com", "ibyteimg.com",
    "fbcdn.net",
    "cdninstagram.com",
    "twimg.com",
];

function isAllowedImageHost(hostname: string): boolean {
    return ALLOWED_IMAGE_SUFFIXES.some(suf => hostname === suf || hostname.endsWith(`.${suf}`));
}

export async function GET(req: NextRequest) {
    const src = req.nextUrl.searchParams.get("u");
    if (!src) return new NextResponse(null, { status: 400 });

    let parsed: URL;
    try {
        parsed = new URL(src);
    } catch {
        return new NextResponse(null, { status: 400 });
    }
    if (parsed.protocol !== "https:" || !isAllowedImageHost(parsed.hostname)) {
        return new NextResponse(null, { status: 400 });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(src, {
            headers: { "User-Agent": UA, "Referer": parsed.origin },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !res.body || !contentType.startsWith("image/")) {
            return new NextResponse(null, { status: 404 });
        }

        return new NextResponse(res.body, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch {
        return new NextResponse(null, { status: 404 });
    }
}
