"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { getLivesFeed } from "@/api/api";
import { Live, LiveEntityType } from "@/types/interface";
import LivePlayer from "./LivePlayer";
import LiveFilterChips from "./LiveFilterChips";
import { isEmbeddable } from "./liveUtils";

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
    const [hasMore, setHasMore] = useState(false);
    const [activeFilter, setActiveFilter] = useState<LiveEntityType | "">(initialFilter);

    // ── Refs (ne déclenchent PAS de re-render → pas de stale closure) ────
    const seed = useRef(Math.floor(Math.random() * 99999));
    const seenIds = useRef<Set<string>>(new Set());
    const isFetching = useRef(false);       // GUARD : un seul fetch à la fois
    const pageRef = useRef(1);              // Page courante — ref pour éviter stale closure
    const hasMoreRef = useRef(false);       // Miroir de hasMore en ref
    const activeFilterRef = useRef<LiveEntityType | "">(initialFilter);
    const livesLengthRef = useRef(0);       // Miroir de lives.length en ref
    const statusRef = useRef<"loading" | "loadingMore" | "idle" | "empty">("loading");
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // ─── FETCH — UNIQUE POINT D'ENTRÉE ────────────────────────────────────

    /**
     * Charge une page du feed.
     * @param pNum      Numéro de page
     * @param isFirst   true = reset complet (filtre change, reload)
     * @param filter    Filtre entité actif
     */
    const doFetch = async (pNum: number, isFirst: boolean, filter: LiveEntityType | "") => {
        // GUARD : bloquer si un fetch est déjà en cours
        if (isFetching.current) return;
        isFetching.current = true;

        const newStatus = isFirst ? "loading" : "loadingMore";
        setStatus(newStatus);
        statusRef.current = newStatus;

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
                // Garder uniquement les vidéos jouables
                const playable = allItems.filter(l => isEmbeddable(l.videoLink));

                // Marquer tous les IDs comme vus
                allItems.forEach(l => seenIds.current.add(l.id));

                const nextHasMore = res.data.hasMore ?? false;
                setHasMore(nextHasMore);
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
            } else {
                const s = isFirst ? "empty" : "idle";
                setStatus(s);
                statusRef.current = s;
            }
        } catch {
            const s = isFirst ? "empty" : "idle";
            setStatus(s);
            statusRef.current = s;
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
        setHasMore(false);
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

    // ─── FIN DU FEED → REPLAY DEPUIS LE DÉBUT (sans nouvel appel API) ────

    useEffect(() => {
        if (
            status === "idle" &&
            !hasMore &&
            !isFetching.current &&
            livesLengthRef.current > 0 &&
            activeIndex >= livesLengthRef.current - 1
        ) {
            const timer = setTimeout(() => {
                setActiveIndex(0);
                containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [activeIndex, status, hasMore, lives.length]); // Dépendances stables

    // ─── IntersectionObserver — détecte la vidéo active ──────────────────

    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        itemRefs.current.forEach((el, idx) => {
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveIndex(idx); },
                { threshold: 0.6 }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach(obs => obs.disconnect());
    }, [lives.length]); // Recréer quand le nombre de vidéos change

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
                className="overflow-y-scroll snap-y snap-mandatory"
                style={{ height: feedHeight, scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
                <style>{`div::-webkit-scrollbar{display:none}`}</style>

                {lives.map((live, idx) => (
                    <div
                        key={live.id}
                        ref={el => { itemRefs.current[idx] = el; }}
                        className="w-full snap-start snap-always flex-shrink-0 relative"
                        style={{ height: feedHeight }}
                    >
                        <LivePlayer
                            live={live}
                            isActive={idx === activeIndex}
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
        <div className="flex items-center gap-3 px-4 pt-3 pb-2 bg-gradient-to-b from-black/80 to-transparent">
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
