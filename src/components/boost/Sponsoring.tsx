"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Boost, BoostEntityType, BoostedEntitySummary } from "@/types/interface";
import { getActiveBoosts } from "@/api/boost-api";

// ── Routing ──────────────────────────────────────────────────────────────────
const ENTITY_ROUTES: Partial<Record<BoostEntityType, string>> = {
    PRODUCT: "/produit",
    SERVICE: "/service",
    ANNONCE: "/annonce",
};

function getRoute(entityType: BoostEntityType, entityId: string): string | null {
    const base = ENTITY_ROUTES[entityType];
    return base ? `${base}/${entityId}` : null;
}

// ── Badge labels ──────────────────────────────────────────────────────────────
const BADGE_LABELS: Record<string, string> = {
    DEPANNAGE: "Dépannage",
    VENTE: "Vente",
    LOCATION: "Location",
    INSTALLATION: "Installation",
    CONSEIL: "Conseil",
    PRODUCT: "Produit",
    ANNONCE: "Annonce",
};

const LIMIT = 10;

// ── Sub-components ────────────────────────────────────────────────────────────

function EntityImage({ entity, onClick }: { entity: BoostedEntitySummary; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="relative w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-white/8 focus:outline-none"
            aria-label={`Voir ${entity.title}`}
        >
            {entity.image ? (
                <Image
                    src={entity.image}
                    fill
                    unoptimized
                    className="object-cover"
                    alt={entity.title}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Icon icon="solar:star-bold-duotone" className="w-8 h-8 text-white/20" />
                </div>
            )}
            {/* Gradient overlay bas */}
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/60 to-transparent" />
            {entity.price != null && (
                <span className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] font-black text-white leading-tight px-0.5 truncate">
                    {entity.price.toLocaleString()} F
                </span>
            )}
        </button>
    );
}

function EntityBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/20 text-primary text-[9px] font-black uppercase tracking-wide">
            {label}
        </span>
    );
}

function NavDots({
    total,
    current,
    loadingNext,
    onSelect,
}: {
    total: number;
    current: number;
    loadingNext: boolean;
    onSelect: (i: number) => void;
}) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => onSelect(idx)}
                    className={`rounded-full transition-all duration-300 focus:outline-none ${
                        idx === current
                            ? "w-4 h-1.5 bg-white"
                            : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Élément ${idx + 1}`}
                />
            ))}
            {loadingNext && (
                <Icon icon="line-md:loading-twotone-loop" className="w-3 h-3 text-white/40 ml-0.5" />
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sponsoring() {
    const router = useRouter();

    const [boosts, setBoosts] = useState<Boost[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingNext, setLoadingNext] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const fetchingRef = useRef(false);
    const dragDirectionRef = useRef<"left" | "right" | null>(null);

    const fetchPage = useCallback(async (p: number) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        if (p === 1) setLoading(true); else setLoadingNext(true);
        try {
            const res = await getActiveBoosts({ page: p, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                // Ne garder que les boosts avec une route frontale connue et une entité résolue
                const navigable = (res.data.data ?? []).filter(
                    b => ENTITY_ROUTES[b.entityType] && b.entity,
                );
                setBoosts(navigable);
                setTotalPages(res.data.totalPages ?? 1);
                setPage(p);
                setCurrentIndex(0);
            }
        } catch { /* silent */ }
        finally {
            if (p === 1) setLoading(false); else setLoadingNext(false);
            fetchingRef.current = false;
        }
    }, []);

    useEffect(() => { fetchPage(1); }, [fetchPage]);

    const goNext = useCallback(() => {
        const next = currentIndex + 1;
        if (next < boosts.length) {
            dragDirectionRef.current = "left";
            setCurrentIndex(next);
        } else if (page < totalPages && !fetchingRef.current) {
            dragDirectionRef.current = "left";
            fetchPage(page + 1);
        }
    }, [currentIndex, boosts.length, page, totalPages, fetchPage]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            dragDirectionRef.current = "right";
            setCurrentIndex(i => i - 1);
        }
    }, [currentIndex]);

    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -60) goNext();
        else if (info.offset.x > 60) goPrev();
    }, [goNext, goPrev]);

    const handleNavigate = useCallback((boost: Boost) => {
        const route = getRoute(boost.entityType, boost.entityId);
        if (route) router.push(route);
    }, [router]);

    const current = boosts[currentIndex];
    const entity = current?.entity;

    if (dismissed) return null;
    if (!loading && boosts.length === 0) return null;

    const isLastItem = currentIndex === boosts.length - 1 && page >= totalPages;

    return (
        <AnimatePresence>
            <motion.div
                key="sponsoring"
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 120, opacity: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 260 }}
                className="fixed bottom-[72px] left-0 right-0 z-40 px-3 pointer-events-none"
            >
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className="pointer-events-auto bg-zinc-900/97 dark:bg-zinc-950/97 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/8 overflow-hidden select-none"
                >
                    {/* Accent line top */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

                    {/* ── Skeleton ── */}
                    {loading && (
                        <div className="flex items-center gap-3 p-3">
                            <div className="w-[72px] h-[72px] rounded-xl bg-white/10 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex gap-2">
                                    <div className="h-4 w-4/5 bg-white/10 rounded-full animate-pulse" />
                                    <div className="w-7 h-7 bg-white/10 rounded-full animate-pulse ml-auto shrink-0" />
                                </div>
                                <div className="h-3 w-1/3 bg-white/10 rounded-full animate-pulse" />
                                <div className="h-3 w-2/4 bg-white/10 rounded-full animate-pulse" />
                                <div className="h-8 w-full bg-white/10 rounded-xl animate-pulse" />
                            </div>
                        </div>
                    )}

                    {/* ── Card content ── */}
                    {!loading && current && entity && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.id}
                                initial={{ opacity: 0, x: dragDirectionRef.current === "left" ? 40 : -40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: dragDirectionRef.current === "left" ? -40 : 40 }}
                                transition={{ duration: 0.18 }}
                            >
                                {/* Top row: image + info + close */}
                                <div className="flex items-start gap-3 p-3 pb-2">
                                    <EntityImage entity={entity} onClick={() => handleNavigate(current)} />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        {/* Badge + close */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {entity.badge && BADGE_LABELS[entity.badge] && (
                                                    <EntityBadge label={BADGE_LABELS[entity.badge]} />
                                                )}
                                                <span className="text-[9px] text-white/40 font-medium">Sponsorisée</span>
                                            </div>
                                            <button
                                                onClick={() => setDismissed(true)}
                                                className="w-6 h-6 rounded-full bg-white/12 hover:bg-white/22 flex items-center justify-center transition shrink-0 focus:outline-none"
                                                aria-label="Fermer"
                                            >
                                                <Icon icon="solar:close-bold" className="w-3 h-3 text-white/70" />
                                            </button>
                                        </div>

                                        {/* Title */}
                                        <p className="text-sm font-black text-white leading-tight line-clamp-1">
                                            {entity.title}
                                        </p>

                                        {/* Store / provider */}
                                        {entity.storeName && (
                                            <p className="text-[11px] text-white/50 font-medium truncate flex items-center gap-1">
                                                <Icon icon="solar:shop-bold-duotone" className="w-3 h-3 shrink-0 text-white/30" />
                                                {entity.storeName}
                                            </p>
                                        )}

                                        {/* Category */}
                                        {entity.category && (
                                            <p className="text-[10px] text-white/40 truncate">
                                                {entity.category}
                                            </p>
                                        )}

                                        {/* Description excerpt */}
                                        {entity.description && (
                                            <p className="text-[10px] text-white/35 leading-snug line-clamp-1">
                                                {entity.description}
                                            </p>
                                        )}

                                        {/* CTA row */}
                                        <div className="flex items-center gap-2 pt-0.5">
                                            <button
                                                onClick={() => handleNavigate(current)}
                                                className="flex-1 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black rounded-xl transition-all active:scale-95"
                                            >
                                                Voir l&apos;offre
                                            </button>
                                            {entity.price != null && (
                                                <span className="text-xs font-black text-emerald-400 shrink-0 whitespace-nowrap">
                                                    {entity.price.toLocaleString()} F
                                                    {entity.frais ? (
                                                        <span className="text-[9px] font-medium text-white/40 ml-0.5">
                                                            +{entity.frais.toLocaleString()}
                                                        </span>
                                                    ) : null}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation dots + arrows */}
                                {boosts.length > 1 && (
                                    <div className="flex items-center justify-between px-3 pb-2.5">
                                        <button
                                            onClick={goPrev}
                                            disabled={currentIndex === 0}
                                            className="w-6 h-6 rounded-full bg-white/8 hover:bg-white/18 flex items-center justify-center disabled:opacity-20 transition focus:outline-none"
                                            aria-label="Précédent"
                                        >
                                            <Icon icon="solar:alt-arrow-left-bold" className="w-3 h-3 text-white" />
                                        </button>

                                        <NavDots
                                            total={boosts.length}
                                            current={currentIndex}
                                            loadingNext={loadingNext}
                                            onSelect={setCurrentIndex}
                                        />

                                        <button
                                            onClick={goNext}
                                            disabled={isLastItem && !loadingNext}
                                            className="w-6 h-6 rounded-full bg-white/8 hover:bg-white/18 flex items-center justify-center disabled:opacity-20 transition focus:outline-none"
                                            aria-label="Suivant"
                                        >
                                            <Icon icon="solar:alt-arrow-right-bold" className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
