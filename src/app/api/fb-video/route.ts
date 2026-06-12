import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });

        const html = await res.text();

        // Extraire l'URL HD en priorité, puis SD
        const hdMatch = html.match(/"hd_src":"([^"]+)"/) || html.match(/hd_src_no_ratelimit":"([^"]+)"/);
        const sdMatch = html.match(/"sd_src":"([^"]+)"/) || html.match(/sd_src_no_ratelimit":"([^"]+)"/);

        const videoUrl = hdMatch?.[1] || sdMatch?.[1];

        if (!videoUrl) {
            return NextResponse.json({ error: "video_not_found" }, { status: 404 });
        }

        // Décoder les caractères unicode échappés (% → %)
        const decoded = videoUrl.replace(/\\u0025/g, "%").replace(/\\\//g, "/").replace(/\\u003C/g, "<");

        return NextResponse.json({ videoUrl: decoded });
    } catch {
        return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }
}
