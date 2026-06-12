"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Live, LiveEntityType } from "@/types/interface";
import { likeLive, shareLive } from "@/api/api";
import {
    getYouTubeId,
    getTikTokVideoId,
    getEmbedType,
    detectPlatform,
    type EmbedType,
} from "./liveUtils";

interface LivePlayerProps {
    live: Live;
    /** true = cette carte est visible dans le viewport → lecture automatique */
    isActive: boolean;
    onNext?: () => void;
    onPrev?: () => void;
    showNav?: boolean;
}

// ─── BUILD EMBED URL (appelé une seule fois au montage) ──────────────────────

/**
 * Construit l'URL initiale de l'iframe.
 * On NE passe plus autoplay/mute dans la clé React — l'iframe est montée UNE SEULE FOIS.
 * Le contrôle play/pause/mute se fait ensuite via postMessage.
 */
function buildEmbedUrl(videoLink: string, type: EmbedType): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    if (type === "youtube") {
        const id = getYouTubeId(videoLink)!;
        const p = new URLSearchParams({
            rel: "0",
            modestbranding: "1",
            playsinline: "1",
            controls: "1",
            enablejsapi: "1",   // Requis pour postMessage play/pause/mute
            origin,
            autoplay: "1",      // Démarre muet (mute=1 obligatoire pour autoplay)
            mute: "1",
        });
        return `https://www.youtube.com/embed/${id}?${p}`;
    }

    if (type === "tiktok-player") {
        const id = getTikTokVideoId(videoLink)!;
        const p = new URLSearchParams({
            music_info: "0",
            description: "0",
            loop: "0",
            autoplay: "1",
            mute: "1",          // Obligatoire pour que le navigateur autorise l'autoplay
            controls: "1",
            from: "embed",
            lang: "fr",
        });
        return `https://www.tiktok.com/player/v1/${id}?${p}`;
    }

    if (type === "facebook") {
        const p = new URLSearchParams({
            href: videoLink,
            show_text: "false",
            autoplay: "true",
            allowfullscreen: "true",
            app_id: "26851350967894514",
        });
        return `https://www.facebook.com/plugins/video.php?${p}`;
    }

    return "";
}

// ─── COMMANDES postMessage ────────────────────────────────────────────────────

function sendYouTubeCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown = "") {
    iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
    );
}

function sendTikTokCommand(iframe: HTMLIFrameElement | null, type: string) {
    iframe?.contentWindow?.postMessage(JSON.stringify({ type }), "*");
}

// ─── PLATFORM META ────────────────────────────────────────────────────────────

const PLATFORM_INFO: Record<string, { icon: string; name: string; bg: string }> = {
    tiktok:    { icon: "mdi:tiktok",    name: "TikTok",    bg: "bg-black" },
    instagram: { icon: "mdi:instagram", name: "Instagram", bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" },
    youtube:   { icon: "mdi:youtube",   name: "YouTube",   bg: "bg-red-600" },
    facebook:  { icon: "mdi:facebook",  name: "Facebook",  bg: "bg-blue-600" },
    other:     { icon: "solar:link-bold-duotone", name: "Lien", bg: "bg-zinc-800" },
};

const ENTITY_LABELS: Record<LiveEntityType, string> = {
    [LiveEntityType.PRODUCT]:            "Produit",
    [LiveEntityType.ANNONCE]:            "Annonce",
    [LiveEntityType.SERVICE]:            "Service",
    [LiveEntityType.SERVICE_LOGISTIQUE]: "Logistique",
    [LiveEntityType.PROFILE]:            "Profil",
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function LivePlayer({ live, isActive, onNext, onPrev, showNav }: LivePlayerProps) {
    const iframeRef   = useRef<HTMLIFrameElement>(null);
    const isActiveRef = useRef(isActive);
    useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

    const embedType = getEmbedType(live.videoLink);
    const platform = detectPlatform(live.videoLink);
    const platformInfo = PLATFORM_INFO[platform] ?? PLATFORM_INFO.other;

    // Toutes les plateformes démarrent muettes (obligatoire pour l'autoplay navigateur)
    const [isMuted, setIsMuted] = useState(true);
    // Overlay fin de vidéo — bloque l'UI TikTok "More videos" et les écrans de fin YouTube
    const [videoEnded, setVideoEnded] = useState(false);

    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(live.likesCount);
    const [shares, setShares] = useState(live.sharesCount);
    const [showDesc, setShowDesc] = useState(false);

    // URL embed construite UNE SEULE FOIS au montage (pas dans le key)
    const embedUrl = (embedType === "youtube" || embedType === "tiktok-player" || embedType === "facebook")
        ? buildEmbedUrl(live.videoLink, embedType)
        : null;

    // ─── Play / Pause automatique quand isActive change ──────────────────
    // Contrôle via postMessage — AUCUN remontage d'iframe

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        if (isActive) {
            setVideoEnded(false);
            if (embedType === "youtube") sendYouTubeCommand(iframe, "playVideo");
            if (embedType === "tiktok-player") sendTikTokCommand(iframe, "play");
        } else {
            if (embedType === "youtube") sendYouTubeCommand(iframe, "pauseVideo");
            if (embedType === "tiktok-player") sendTikTokCommand(iframe, "pause");
        }
    }, [isActive, embedType]);

    // ─── Écoute des messages de l'iframe (fin de vidéo) ──────────────────

    const handleVideoEnd = useCallback(() => {
        setVideoEnded(true);
        setTimeout(() => {
            setVideoEnded(false);
            // N'avancer que si l'utilisateur n'a pas déjà scrollé manuellement
            if (isActiveRef.current) onNext?.();
        }, 1200);
    }, [onNext]);

    useEffect(() => {
        if (!isActive) return;
        const handleMessage = (e: MessageEvent) => {
            try {
                const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
                // YouTube : playerState 0 = ended
                if (data?.event === "infoDelivery" && data?.info?.playerState === 0) handleVideoEnd();
                // TikTok Player V1
                if (data?.type === "onStateChange" && data?.playerState === "ended") handleVideoEnd();
                // Facebook
                if (data?.action === "videoEnd" || data?.type === "videoEnded") handleVideoEnd();
            } catch { /* non-JSON */ }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [isActive, handleVideoEnd]);

    // ─── Mute / Unmute via postMessage (pas de remontage) ─────────────────

    const toggleMute = () => {
        const unmuting = isMuted;
        if (embedType === "youtube") {
            if (unmuting) {
                sendYouTubeCommand(iframeRef.current, "unMute");
                sendYouTubeCommand(iframeRef.current, "setVolume", [100]);
            } else {
                sendYouTubeCommand(iframeRef.current, "mute");
            }
        }
        if (embedType === "tiktok-player") {
            sendTikTokCommand(iframeRef.current, unmuting ? "unmute" : "mute");
        }
        setIsMuted(m => !m);
    };

    // ─── Like / Share ─────────────────────────────────────────────────────

    const handleLike = async () => {
        if (liked) return;
        setLiked(true);
        setLikes(l => l + 1);
        await likeLive(live.id).catch(() => {});
    };

    const handleShare = async () => {
        setShares(s => s + 1);
        await shareLive(live.id).catch(() => {});
        if (navigator.share) {
            navigator.share({ title: live.title, url: live.videoLink }).catch(() => {});
        } else {
            navigator.clipboard.writeText(live.videoLink).catch(() => {});
        }
    };

    const storeName = live.user.storeName || live.user.companyName || live.user.fullName || "Boutique";
    const showShopCTA = live.entityType === LiveEntityType.PRODUCT || !live.entityType;
    const shopHref = live.entityId
        ? (live.entityType === LiveEntityType.PRODUCT ? `/products/${live.entityId}` : "#")
        : `/shop/${live.user.storeName || live.userId}`;

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">

            {/* ══════════════════════════════════════════════════
                ZONE VIDÉO
            ══════════════════════════════════════════════════ */}
            <div className="absolute inset-0">
                {embedUrl ? (
                    <iframe
                        key={live.id}
                        ref={iframeRef}
                        src={embedUrl}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                        title={live.title}
                    />
                ) : (
                    /* Plateforme non-embarquable — ne devrait pas être dans le feed
                       mais on affiche quand même un fallback au cas où */
                    <ExternalPlatformCard
                        platform={platformInfo}
                        title={live.title}
                        url={live.videoLink}
                    />
                )}
            </div>

            {/* Gradient bas */}
            <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-10" />

            {/* ══════════════════════════════════════════════════
                OVERLAY FIN DE VIDÉO
                Couvre totalement l'iframe pour bloquer l'UI
                TikTok "More videos" et l'écran de fin YouTube.
                Affiché pendant 1.2s avant passage à la suivante.
            ══════════════════════════════════════════════════ */}
            {videoEnded && (
                <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center gap-4">
                    {/* Spinner "vidéo suivante" */}
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icon icon="solar:play-bold" className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-white/80 text-xs font-medium tracking-wide">Vidéo suivante...</p>

                    {/* Bouton rejouer cette vidéo */}
                    <button
                        onClick={() => {
                            setVideoEnded(false);
                            if (embedType === "youtube") sendYouTubeCommand(iframeRef.current, "seekTo", [0, true]);
                            if (embedType === "youtube") sendYouTubeCommand(iframeRef.current, "playVideo");
                            if (embedType === "tiktok-player") sendTikTokCommand(iframeRef.current, "play");
                        }}
                        className="flex items-center gap-2 text-white/50 text-[11px] hover:text-white transition"
                    >
                        <Icon icon="solar:restart-bold-duotone" className="w-4 h-4" />
                        Rejouer
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                BOUTON MUTE / UNMUTE — coin haut gauche
            ══════════════════════════════════════════════════ */}
            {embedUrl && (
                <button
                    onClick={toggleMute}
                    className="absolute top-14 left-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center hover:bg-black/70 transition active:scale-90"
                    title={isMuted ? "Activer le son" : "Couper le son"}
                >
                    <Icon
                        icon={isMuted ? "solar:volume-cross-bold-duotone" : "solar:volume-loud-bold-duotone"}
                        className="w-4 h-4 text-white"
                    />
                </button>
            )}

            {/* Indicateur "son coupé" animé — visible 2 s au démarrage si muet */}
            {embedUrl && isMuted && isActive && (
                <div className="absolute top-14 left-14 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-none animate-fade-in-out">
                    <Icon icon="solar:volume-cross-bold-duotone" className="w-3 h-3 text-white/80" />
                    <span className="text-white/80 text-[10px] font-bold">Appuyez pour activer le son</span>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                INFO BAS
            ══════════════════════════════════════════════════ */}
            <div className="absolute bottom-0 left-0 right-14 px-4 pb-5 z-20">
                {/* Vendeur + plateforme */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ring-2 ring-white/20">
                        <span className="text-xs font-black text-white">{storeName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-white font-black text-sm truncate drop-shadow">{storeName}</span>
                    {live.entityType && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm shrink-0">
                            {ENTITY_LABELS[live.entityType]}
                        </span>
                    )}
                    <span className={`ml-auto shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${platformInfo.bg}`}>
                        <Icon icon={platformInfo.icon} className="w-3.5 h-3.5 text-white" />
                    </span>
                </div>

                {/* Titre */}
                <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2 drop-shadow">
                    {live.title}
                </h3>

                {/* Description */}
                {live.description && (
                    <button onClick={() => setShowDesc(s => !s)} className="text-white/75 text-xs text-left leading-relaxed">
                        <span className={showDesc ? "" : "line-clamp-1"}>{live.description}</span>
                        <span className="text-white/90 font-bold ml-1">{showDesc ? " Moins" : "... Plus"}</span>
                    </button>
                )}

                {/* CTA boutique */}
                {showShopCTA && (
                    <a href={shopHref} className="mt-3 flex items-center justify-center gap-2 w-full bg-white text-black font-black text-sm rounded-full py-2.5 px-4 hover:bg-white/90 transition active:scale-95">
                        <Icon icon="solar:shop-bold-duotone" className="w-4 h-4" />
                        Aller au magasin
                    </a>
                )}
            </div>

            {/* ══════════════════════════════════════════════════
                ACTIONS DROITE
            ══════════════════════════════════════════════════ */}
            <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
                {/* Like */}
                <button onClick={handleLike} className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm ${liked ? "bg-red-500" : "bg-black/40 backdrop-blur-sm border border-white/10"}`}>
                        <Icon icon={liked ? "solar:heart-bold" : "solar:heart-outline"} className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white text-[10px] font-bold drop-shadow">{likes}</span>
                </button>

                {/* Share */}
                <button onClick={handleShare} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                        <Icon icon="solar:share-bold-duotone" className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white text-[10px] font-bold drop-shadow">{shares}</span>
                </button>

                {/* Vues */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                        <Icon icon="solar:eye-bold-duotone" className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-white/70 text-[10px] drop-shadow">{live.viewsCount}</span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                NAV DESKTOP
            ══════════════════════════════════════════════════ */}
            {showNav && (onPrev || onNext) && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
                    {onPrev && (
                        <button onClick={onPrev} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/70 transition active:scale-90">
                            <Icon icon="solar:arrow-up-bold" className="w-4 h-4 text-white" />
                        </button>
                    )}
                    {onNext && (
                        <button onClick={onNext} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/70 transition active:scale-90">
                            <Icon icon="solar:arrow-down-bold" className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── CARTE FALLBACK plateforme non-embarquable ────────────────────────────────

function ExternalPlatformCard({ platform, title, url }: {
    platform: { icon: string; name: string; bg: string };
    title: string;
    url: string;
}) {
    return (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center ${platform.bg}`}>
            <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center">
                <Icon icon={platform.icon} className="w-10 h-10 text-white" />
            </div>
            <p className="text-white font-bold text-base leading-snug line-clamp-3 max-w-xs">{title}</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-white text-black font-black text-sm px-7 py-3.5 rounded-full hover:bg-white/90 transition active:scale-95 shadow-xl">
                <Icon icon="solar:play-bold" className="w-5 h-5" />
                Voir sur {platform.name}
            </a>
        </div>
    );
}
