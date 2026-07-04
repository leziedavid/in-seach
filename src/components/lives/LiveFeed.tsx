"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { getLivesFeed } from "@/api/api";
import { Live, LiveEntityType } from "@/types/interface";
import { usePWA } from "@/hooks/usePWA";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import LivePlayer from "./LivePlayer";
import LiveFilterChips from "./LiveFilterChips";
import { hasRecognizedVideo } from "./liveUtils";

const PULL_THRESHOLD = 72;

interface LiveFeedProps {
    initialFilter?: LiveEntityType | "";
    embedded?: boolean;
}

// ─── SKELETON ────────────────────────────────────────────────────────────────

function LiveSkeleton() {
    return (
        <div className="relative w-full h-full bg-zinc-900 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
            <div className="absolute bottom-6 left-4 right-16 space-y-2.5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-700" />
                    <div className="h-3 w-28 bg-zinc-700 rounded-full" />
                </div>
                <div className="h-3 w-52 bg-zinc-700 rounded-full" />
                <div className="h-3 w-36 bg-zinc-800 rounded-full" />
                <div className="h-10 w-full bg-zinc-700 rounded-full mt-3" />
            </div>
            <div className="absolute right-3 bottom-24 flex flex-col gap-5">
                {[0, 1, 2].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-zinc-700" />
                        <div className="h-2 w-6 bg-zinc-800 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function LiveFeed({ initialFilter = "", embedded = false }: LiveFeedProps) {
    const router = useRouter();

    // ── Feed state ────────────────────────────────────────────────────────
    const [lives, setLives] = useState<Live[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [status, setStatus] = useState<"loading" | "loadingMore" | "idle" | "empty">("loading");
    const [activeFilter, setActiveFilter] = useState<LiveEntityType | "">(initialFilter);

    // ── Refs (ne déclenchent PAS de re-render → pas de stale closure) ────
    const seed = useRef(Math.floor(Math.random() * 99999));
    const seenIds = useRef<Set<string>>(new Set());
    const isFetching = useRef(false);       // GUARD : un seul fetch à la fois
    const pageRef = useRef(1);              // Page courante — ref pour éviter stale closure
    const hasMoreRef = useRef(false);       // Miroir de hasMore en ref
    const activeFilterRef = useRef<LiveEntityType | "">(initialFilter);
    const livesLengthRef = useRef(0);       // Miroir de lives.length en ref
    const livesRef = useRef<Live[]>([]);    // Miroir de lives en ref (pull-to-refresh)
    const activeIndexRef = useRef(0);       // Miroir de activeIndex en ref (pull-to-refresh)
    const statusRef = useRef<"loading" | "loadingMore" | "idle" | "empty">("loading");
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => { livesRef.current = lives; }, [lives]);
    useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

    // ─── FETCH — UNIQUE POINT D'ENTRÉE ────────────────────────────────────

    /**
     * Charge une page du feed.
     * @param pNum      Numéro de page
     * @param isFirst   true = reset complet (filtre change, reload)
     * @param filter    Filtre entité actif
     * @param opts.silent  true = ne bascule pas sur le skeleton plein écran
     *                     (pull-to-refresh : le contenu existant reste visible)
     * @returns la liste jouable reçue (utile au pull-to-refresh pour relocaliser
     *          la vidéo regardée), ou null si le fetch n'a pas abouti.
     */
    const doFetch = async (pNum: number, isFirst: boolean, filter: LiveEntityType | "", opts?: { silent?: boolean }): Promise<Live[] | null> => {
        // GUARD : bloquer si un fetch est déjà en cours
        if (isFetching.current) return null;
        isFetching.current = true;

        if (!opts?.silent) {
            const newStatus = isFirst ? "loading" : "loadingMore";
            setStatus(newStatus);
            statusRef.current = newStatus;
        }

        try {
            const excludeIds = isFirst ? "" : [...seenIds.current].join(",");
            const res = await getLivesFeed({
                page: pNum,
                limit: 10,
                seed: seed.current,
                excludeIds: excludeIds || undefined,
                entityType: filter || undefined,
            });

            if (res.statusCode === 200 && res.data) {
                const allItems = res.data.data ?? [];
                // Garder les vidéos dont le lien est reconnu (YouTube, TikTok, Facebook, Instagram...)
                // — l'embed direct n'est plus requis, on affiche une carte "ouvrir sur X" si besoin.
                const playable = allItems.filter(l => hasRecognizedVideo(l.videoLink));

                // Marquer tous les IDs comme vus
                allItems.forEach(l => seenIds.current.add(l.id));

                const nextHasMore = res.data.hasMore ?? false;
                hasMoreRef.current = nextHasMore;

                if (isFirst) {
                    setLives(playable);
                    livesLengthRef.current = playable.length;
                    const s = playable.length === 0 ? "empty" : "idle";
                    setStatus(s);
                    statusRef.current = s;
                } else {
                    // Déduplication : évite les clés dupliquées si doFetch est appelé 2x
                    setLives(prev => {
                        const existingIds = new Set(prev.map(l => l.id));
                        const unique = playable.filter(l => !existingIds.has(l.id));
                        livesLengthRef.current = prev.length + unique.length;
                        return [...prev, ...unique];
                    });
                    setStatus("idle");
                    statusRef.current = "idle";
                }
                return playable;
            }
            const s = isFirst ? "empty" : "idle";
            setStatus(s);
            statusRef.current = s;
            return null;
        } catch {
            const s = isFirst ? "empty" : "idle";
            setStatus(s);
            statusRef.current = s;
            return null;
        } finally {
            isFetching.current = false;
        }
    };

    // ─── CHARGEMENT INITIAL ───────────────────────────────────────────────

    useEffect(() => {
        doFetch(1, true, initialFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Une seule fois au montage

    // ─── CHANGEMENT DE FILTRE ─────────────────────────────────────────────

    const handleFilterChange = (value: LiveEntityType | "") => {
        if (value === activeFilterRef.current) return;
        setActiveFilter(value);
        activeFilterRef.current = value;

        // Reset complet
        seed.current = Math.floor(Math.random() * 99999);
        seenIds.current.clear();
        isFetching.current = false;
        pageRef.current = 1;
        hasMoreRef.current = false;
        livesLengthRef.current = 0;
        setLives([]);
        setActiveIndex(0);
        containerRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

        doFetch(1, true, value);
    };

    // ─── SCROLL → CHARGER LA PAGE SUIVANTE ───────────────────────────────
    // Utilise uniquement des REFS — zéro stale closure possible

    useEffect(() => {
        if (
            statusRef.current === "idle" &&
            hasMoreRef.current &&
            !isFetching.current &&
            livesLengthRef.current > 0 &&
            activeIndex >= livesLengthRef.current - 3
        ) {
            pageRef.current += 1;
            doFetch(pageRef.current, false, activeFilterRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex]); // activeIndex seul — les autres valeurs sont lues via refs

    // ─── DÉTECTION DE LA VIDÉO ACTIVE — position de scroll, une fois stabilisée ──
    // Avant : un IntersectionObserver par item (seuil 0.6) déclenchait setActiveIndex
    // en cascade pendant un scroll rapide — l'item quitté ET le suivant franchissaient
    // tour à tour le seuil, ce qui relançait brièvement la lecture de la vidéo
    // précédente avant de se stabiliser ("effet de rebond"). On calcule maintenant
    // l'index actif une seule fois le scroll réellement arrêté (scrollend natif,
    // ou débounce en repli) — comme TikTok : la position ne bouge qu'après un geste
    // explicite de l'utilisateur, jamais pendant la transition.

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const computeActiveIndex = () => {
            const itemHeight = container.clientHeight;
            if (!itemHeight) return;
            const idx = Math.round(container.scrollTop / itemHeight);
            const clamped = Math.max(0, Math.min(idx, lives.length - 1));
            setActiveIndex(prev => (prev === clamped ? prev : clamped));
        };

        // scrollend se déclenche exactement quand le snap s'immobilise — le plus
        // fidèle au comportement TikTok. Le débounce n'est qu'un repli pour les
        // navigateurs qui ne l'exposent pas encore (ex: Safari < 17.4) ; les deux
        // ne sont jamais actifs en même temps pour éviter tout calcul redondant.
        if ("onscrollend" in window) {
            container.addEventListener("scrollend", computeActiveIndex, { passive: true });
            return () => container.removeEventListener("scrollend", computeActiveIndex);
        }

        let debounceTimer: ReturnType<typeof setTimeout>;
        const handleScroll = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(computeActiveIndex, 120);
        };
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            container.removeEventListener("scroll", handleScroll);
            clearTimeout(debounceTimer);
        };
    }, [lives.length]);

    // ─── Navigation clavier (desktop) ────────────────────────────────────

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown" || e.key === "j") {
                e.preventDefault();
                scrollToIndex(Math.min(activeIndex + 1, lives.length - 1));
            }
            if (e.key === "ArrowUp" || e.key === "k") {
                e.preventDefault();
                scrollToIndex(Math.max(activeIndex - 1, 0));
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, lives.length]);

    const scrollToIndex = (idx: number) => {
        itemRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveIndex(idx);
    };

    // ─── PULL-TO-REFRESH (PWA installée uniquement) ───────────────────────

    const { isInstalled } = usePWA();

    const handlePullRefresh = useCallback(async () => {
        const watchedId = livesRef.current[activeIndexRef.current]?.id;

        seed.current = Math.floor(Math.random() * 99999);
        seenIds.current.clear();
        pageRef.current = 1;
        hasMoreRef.current = false;
        const fresh = await doFetch(1, true, activeFilterRef.current, { silent: true });

        // La vidéo regardée est toujours présente : on se replace dessus sans
        // animation, aucun saut visuel — que sa position ait bougé ou non.
        const newIndex = watchedId ? (fresh?.findIndex(l => l.id === watchedId) ?? -1) : -1;
        if (newIndex !== -1) {
            setActiveIndex(newIndex);
            const itemHeight = containerRef.current?.clientHeight ?? 0;
            containerRef.current?.scrollTo({ top: newIndex * itemHeight, behavior: "instant" as ScrollBehavior });
            return;
        }

        // Vidéo regardée absente du nouveau feed → repartir du début
        setActiveIndex(0);
        containerRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, []);

    const { pullDistance, isPulling, isRefreshing } = usePullToRefresh({
        containerRef,
        onRefresh: handlePullRefresh,
        enabled: isInstalled && !embedded,
        threshold: PULL_THRESHOLD,
    });

    // ─── RENDER ──────────────────────────────────────────────────────────

    const feedHeight = embedded ? "70vh" : "100dvh";
    const containerClass = embedded ? "w-full max-w-sm mx-auto relative" : "fixed inset-0 z-50 bg-black";

    // Loading initial
    if (status === "loading") {
        return (
            <div className={`${containerClass} bg-black`} style={{ height: feedHeight }}>
                <div className="absolute top-0 left-0 right-0 z-30">
                    <FilterBar activeFilter={activeFilter} onChange={handleFilterChange} onBack={!embedded ? () => router.back() : undefined} />
                </div>
                <LiveSkeleton />
            </div>
        );
    }

    // Empty
    if (status === "empty") {
        return (
            <div className={`${containerClass} bg-zinc-950 flex flex-col`} style={{ height: feedHeight }}>
                <FilterBar activeFilter={activeFilter} onChange={handleFilterChange} onBack={!embedded ? () => router.back() : undefined} />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
                    <Icon icon="solar:videocamera-slash-bold-duotone" className="w-16 h-16 text-zinc-600" />
                    <p className="text-zinc-400 font-semibold text-sm">Aucun Live disponible</p>
                    <p className="text-zinc-600 text-xs">
                        {activeFilter ? "Essayez un autre filtre." : "Revenez bientôt !"}
                    </p>
                    {activeFilter && (
                        <button onClick={() => handleFilterChange("")} className="text-primary text-xs font-bold underline mt-1">
                            Voir tous les Lives
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Feed
    return (
        <div className={containerClass} style={{ position: embedded ? "relative" : undefined }}>
            {/* Barre filtres flottante */}
            <div className="absolute top-0 left-0 right-0 z-30">
                <FilterBar activeFilter={activeFilter} onChange={handleFilterChange} onBack={!embedded ? () => router.back() : undefined} />
            </div>

            {/* Scroll container */}
            <div
                ref={containerRef}
                className="overflow-y-scroll snap-y snap-mandatory overscroll-y-contain"
                style={{ height: feedHeight, scrollbarWidth: "none", msOverflowStyle: "none", overflowAnchor: "none" } as React.CSSProperties}
            >
                <style>{`div::-webkit-scrollbar{display:none}`}</style>

                {/* Indicateur pull-to-refresh — PWA installée uniquement, pousse le
                    contenu vers le bas via sa propre hauteur (pas de transform, pour
                    ne jamais désynchroniser le scroll-snap) */}
                {isInstalled && !embedded && (
                    <div
                        className={`flex items-center justify-center overflow-hidden ${isPulling ? "" : "transition-[height] duration-300 ease-out"}`}
                        style={{ height: isRefreshing ? 56 : pullDistance }}
                    >
                        <Icon
                            icon={isRefreshing ? "solar:restart-bold-duotone" : "solar:arrow-down-bold-duotone"}
                            className={`w-6 h-6 text-white/90 ${isRefreshing ? "animate-spin" : ""}`}
                            style={{
                                opacity: Math.min(1, (isRefreshing ? 56 : pullDistance) / 50),
                                transform: isRefreshing ? undefined : `rotate(${Math.min(180, (pullDistance / PULL_THRESHOLD) * 180)}deg)`,
                            }}
                        />
                    </div>
                )}

                {lives.map((live, idx) => (
                    <div key={live.id} ref={el => { itemRefs.current[idx] = el; }} className="w-full snap-start snap-always flex-shrink-0 relative" style={{ height: feedHeight }} >
                        <LivePlayer live={live} isActive={idx === activeIndex}
                            onNext={idx < lives.length - 1 ? () => scrollToIndex(idx + 1) : undefined}
                            onPrev={idx > 0 ? () => scrollToIndex(idx - 1) : undefined}
                            showNav={!embedded}
                        />
                    </div>
                ))}

                {/* Loading more */}
                {status === "loadingMore" && (
                    <div className="w-full snap-start flex-shrink-0" style={{ height: feedHeight }}>
                        <LiveSkeleton />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── BARRE FILTRES ────────────────────────────────────────────────────────────

interface FilterBarProps {
    activeFilter: LiveEntityType | "";
    onChange: (value: LiveEntityType | "") => void;
    onBack?: () => void;
}

function FilterBar({ activeFilter, onChange, onBack }: FilterBarProps) {
    return (
        // pt-16 (au lieu de pt-3) : évite le chevauchement avec la rangée d'icônes
        // du Header mobile (fixed top-6, z-[100], au-dessus de ce feed en z-50)
        <div className="flex items-center gap-3 px-4 pt-16 pb-2 bg-gradient-to-b from-black/80 to-transparent">
            {onBack && (
                <button
                    onClick={onBack}
                    className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0 hover:bg-black/60 transition active:scale-90"
                >
                    <Icon icon="solar:arrow-left-bold" className="w-4 h-4 text-white" />
                </button>
            )}
            <div className="flex-1 min-w-0">
                <LiveFilterChips active={activeFilter} onChange={onChange} />
            </div>
        </div>
    );
}
