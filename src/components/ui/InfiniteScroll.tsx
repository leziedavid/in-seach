"use client";

import React, {
    useEffect, useRef, useState, useMemo, useCallback, useLayoutEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type SkeletonType = 'product' | 'service' | 'annonce' | 'logistics' | 'default';

interface InfiniteScrollProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    loadMore: () => Promise<void> | void;
    hasMore: boolean;
    isLoading: boolean;
    /** Nb max d'items réels dans le DOM en même temps (défaut 20) */
    windowSize?: number;
    /** Nb d'items purgés / restaurés par lot (défaut 10) */
    batchSize?: number;
    skeletonType?: SkeletonType;
    skeletonCount?: number;
    SkeletonComponent?: React.ReactNode;
    endMessage?: string;
    className?: string;
    gridClassName?: string;
    viewMode?: 'grid' | 'list';
}

// ─── Skeleton fidèle à ProductCard ───────────────────────────────────────────
const SkeletonCard = ({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) => {
    const isList = viewMode === 'list';
    return (
        <div className={`animate-pulse rounded-xl p-2 md:p-4 bg-muted/20 border border-border/40 w-full flex ${isList ? 'flex-row items-center gap-3 md:gap-4' : 'flex-col'}`}>
            <div className={`relative shrink-0 overflow-hidden rounded-lg md:rounded-2xl bg-muted ${isList ? 'w-24 h-24 md:w-32 md:h-32' : 'w-full aspect-square mb-2 md:mb-3'}`}>
                <div className="absolute top-1 left-1 md:top-2 md:left-2 h-4 w-14 bg-muted-foreground/20 rounded-full" />
                <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 h-3.5 w-10 bg-muted-foreground/20 rounded-md" />
            </div>
            <div className={`flex flex-col flex-1 min-w-0 ${isList ? 'justify-center' : 'px-0.5 w-full'}`}>
                <div className="h-3 bg-muted-foreground/20 rounded-full w-3/4 mb-1.5" />
                <div className="h-3 bg-muted-foreground/10 rounded-full w-1/2 mb-2 md:mb-3" />
                <div className="flex items-center gap-1 mb-2 md:mb-3">
                    <div className="h-2.5 w-2.5 bg-muted-foreground/20 rounded-full" />
                    <div className="h-2.5 w-20 bg-muted-foreground/15 rounded-full" />
                </div>
                <div className="space-y-1 mb-3">
                    <div className="h-4 bg-muted-foreground/20 rounded-md w-1/3" />
                    <div className="h-3 bg-muted-foreground/10 rounded-full w-1/4" />
                </div>
                <div className="flex justify-end w-full">
                    <div className="h-7 md:h-8 w-20 md:w-24 bg-muted-foreground/20 rounded-full" />
                </div>
            </div>
        </div>
    );
};

// ─── Helpers mesure DOM ───────────────────────────────────────────────────────
function measureGrid(gridEl: HTMLDivElement): { cols: number; rowHeight: number } {
    const children = Array.from(gridEl.children) as HTMLElement[];
    if (children.length < 2) return { cols: 2, rowHeight: 320 };

    let cols = 1;
    const firstTop = children[0].offsetTop;
    for (let i = 1; i < children.length; i++) {
        if (children[i].offsetTop === firstTop) cols++;
        else break;
    }

    // Hauteur d'une ligne = offsetTop de la 2ème ligne - offsetTop de la 1ère
    let rowHeight = 320;
    for (let i = 1; i < children.length; i++) {
        if (children[i].offsetTop !== firstTop) {
            rowHeight = children[i].offsetTop - firstTop;
            break;
        }
    }

    return { cols, rowHeight };
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function InfiniteScroll<T extends { id: string | number }>({
    items: rawItems = [],
    renderItem,
    loadMore,
    hasMore,
    isLoading,
    windowSize = 20,
    batchSize = 10,
    skeletonCount = 6,
    SkeletonComponent,
    endMessage = "Fin du catalogue",
    className = "",
    gridClassName = "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6",
    viewMode = 'grid',
}: InfiniteScrollProps<T>) {

    // Déduplique par id : évite les clés React dupliquées quand l'API renvoie
    // deux fois la même entité (chevauchement de pages, etc.)
    const items = useMemo(() => {
        const seen = new Set<string | number>();
        const deduped: T[] = [];
        for (const item of rawItems) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            deduped.push(item);
        }
        return deduped;
    }, [rawItems]);

    // ── Fenêtre glissante ───────────────────────────────────────────────────
    const [startIndex, setStartIndex] = useState(0);
    const startIndexRef = useRef(0); // ref synchrone pour les callbacks
    const [topSpacerPx, setTopSpacerPx] = useState(0);

    const endIndex = useMemo(
        () => Math.min(startIndex + windowSize, items.length),
        [startIndex, windowSize, items.length],
    );
    const visibleItems = useMemo(
        () => items.slice(startIndex, endIndex),
        [items, startIndex, endIndex],
    );

    // ── Refs ────────────────────────────────────────────────────────────────
    const gridRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const bottomSentinelRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef(loadMore);
    const hasMoreRef = useRef(hasMore);
    const isLoadingRef = useRef(isLoading);
    const isPurgingRef = useRef(false);

    // Garder les refs à jour sans recréer les observers
    useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);
    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
    useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

    // ── Skeletons ───────────────────────────────────────────────────────────
    const skeletons = useMemo(() => {
        if (SkeletonComponent) return SkeletonComponent;
        return Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} viewMode={viewMode} />
        ));
    }, [SkeletonComponent, skeletonCount, viewMode]);

    // ── tryLoadMore : déclenche loadMore si les conditions sont réunies ─────
    // Appelé manuellement après chaque purge pour éviter le "stuck"
    const tryLoadMore = useCallback(() => {
        if (hasMoreRef.current && !isLoadingRef.current) {
            loadMoreRef.current();
        }
    }, []);

    // ── PURGE VERS LE BAS ───────────────────────────────────────────────────
    // Règle : on purge batchSize items du haut SEULEMENT quand
    // items.length > startIndex + windowSize + batchSize
    // (on attend d'avoir un lot complet de buffer avant de purger)
    useLayoutEffect(() => {
        if (isPurgingRef.current) return;
        if (!gridRef.current) return;

        const currentStart = startIndexRef.current;
        const threshold = currentStart + windowSize + batchSize;

        if (items.length <= threshold) return;

        isPurgingRef.current = true;

        const { cols, rowHeight } = measureGrid(gridRef.current);
        const purgingRows = Math.ceil(batchSize / cols);
        const addedPx = purgingRows * rowHeight;
        const scrollBefore = window.scrollY;

        const nextStart = currentStart + batchSize;
        startIndexRef.current = nextStart;
        setStartIndex(nextStart);
        setTopSpacerPx(prev => prev + addedPx);

        requestAnimationFrame(() => {
            window.scrollTo({ top: scrollBefore, behavior: 'instant' });
            isPurgingRef.current = false;

            // ⚡ Après la purge, re-check si la sentinelle bas est encore visible
            // pour relancer loadMore si nécessaire (cas où l'observer ne re-fire pas)
            const sentinel = bottomSentinelRef.current;
            if (sentinel) {
                const rect = sentinel.getBoundingClientRect();
                const inView = rect.top < window.innerHeight + 400;
                if (inView) tryLoadMore();
            }
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    // ── Observer BAS : loadMore ─────────────────────────────────────────────
    // Créé UNE SEULE FOIS — utilise les refs pour hasMore/isLoading
    // pour éviter la recréation qui casse le re-fire
    useEffect(() => {
        const el = bottomSentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) tryLoadMore();
            },
            { rootMargin: '400px', threshold: 0 },
        );

        observer.observe(el);
        return () => observer.disconnect();
        // tryLoadMore est stable (useCallback sans deps)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Quand isLoading passe à false : re-check si on doit charger plus ────
    // Couvre le cas où la sentinelle était déjà visible pendant le chargement
    useEffect(() => {
        if (!isLoading) {
            const sentinel = bottomSentinelRef.current;
            if (sentinel) {
                const rect = sentinel.getBoundingClientRect();
                const inView = rect.top < window.innerHeight + 400;
                if (inView && hasMore) tryLoadMore();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    // ── Observer HAUT : restaurer items quand l'user remonte ───────────────
    const restoreTop = useCallback(() => {
        const currentStart = startIndexRef.current;
        if (currentStart === 0) return;
        if (!gridRef.current) return;

        const restoreCount = Math.min(batchSize, currentStart);
        const { cols, rowHeight } = measureGrid(gridRef.current);
        const restoreRows = Math.ceil(restoreCount / cols);
        const removedPx = restoreRows * rowHeight;
        const scrollBefore = window.scrollY;

        const nextStart = currentStart - restoreCount;
        startIndexRef.current = nextStart;
        setStartIndex(nextStart);
        setTopSpacerPx(prev => Math.max(0, prev - removedPx));

        requestAnimationFrame(() => {
            window.scrollTo({ top: scrollBefore + removedPx, behavior: 'instant' });
        });
    }, [batchSize]);

    useEffect(() => {
        const el = topSentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) restoreTop(); },
            { rootMargin: '300px', threshold: 0 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [restoreTop]);

    return (
        <div className={`w-full ${className}`}>

            {/* Spacer haut */}
            {topSpacerPx > 0 && (
                <div style={{ height: topSpacerPx }} aria-hidden="true" />
            )}

            {/* Sentinelle haut */}
            <div ref={topSentinelRef} aria-hidden="true" />

            {/* Grille unique : items + skeletons collés */}
            <div ref={gridRef} className={gridClassName}>
                <AnimatePresence mode="popLayout" initial={false}>
                    {visibleItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            layout="position"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.25, delay: Math.min(index % batchSize, 5) * 0.04 }}
                        >
                            {renderItem(item, startIndex + index)}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Skeletons dans la même grille = zéro espace blanc */}
                {isLoading && skeletons}
            </div>

            {/* Sentinelle bas + fin de catalogue */}
            <div ref={bottomSentinelRef} className="w-full flex flex-col items-center justify-center py-6">
                {!hasMore && items.length > 0 && !isLoading && (
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="h-px w-10 bg-primary/20 group-hover:w-20 transition-all duration-700" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                            {endMessage}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}