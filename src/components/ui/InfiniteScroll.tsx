"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';

export type SkeletonType = 'product' | 'service' | 'annonce' | 'logistics' | 'default';

interface InfiniteScrollProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    loadMore: () => Promise<void> | void;
    hasMore: boolean;
    isLoading: boolean;
    /** Marge de préchargement en pixels au-dessus/en dessous du viewport (défaut 800) */
    overscanPx?: number;
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

// ─── Helper mesure DOM : détecte le nb de colonnes et la hauteur de ligne ───
function measureGrid(gridEl: HTMLDivElement): { cols: number; rowHeight: number } {
    const children = Array.from(gridEl.children) as HTMLElement[];
    if (children.length < 2) return { cols: 1, rowHeight: 320 };

    let cols = 1;
    const firstTop = children[0].offsetTop;
    for (let i = 1; i < children.length; i++) {
        if (children[i].offsetTop === firstTop) cols++;
        else break;
    }

    let rowHeight = 320;
    for (let i = 1; i < children.length; i++) {
        if (children[i].offsetTop !== firstTop) {
            rowHeight = children[i].offsetTop - firstTop;
            break;
        }
    }

    return { cols: Math.max(1, cols), rowHeight: Math.max(40, rowHeight) };
}

/**
 * Liste virtualisée : dans l'esprit de Facebook/X/Instagram — les données déjà
 * récupérées restent en mémoire (aucune perte, aucun refetch au retour en arrière),
 * seul le DOM est fenêtré autour de la zone visible (+ overscanPx de marge) via
 * deux spacers (haut/bas) qui préservent la hauteur totale scrollable. La fenêtre
 * suit en continu la position de scroll — elle ne dépend plus d'un seuil de nombre
 * d'items, ce qui élimine le bug où les derniers items chargés (souvent toute la
 * dernière page API) restaient invisibles faute d'avoir dépassé ce seuil.
 */
export default function InfiniteScroll<T extends { id: string | number }>({
    items: rawItems = [],
    renderItem,
    loadMore,
    hasMore,
    isLoading,
    overscanPx = 800,
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

    // ── Fenêtre visible (pilotée par le scroll, pas par un compteur d'items) ──
    const [range, setRange] = useState({ start: 0, end: Math.min(items.length, 20) });
    const [measurements, setMeasurements] = useState({ cols: 1, rowHeight: 320 });

    // ── Refs ────────────────────────────────────────────────────────────────
    const gridRef = useRef<HTMLDivElement>(null);
    const topAnchorRef = useRef<HTMLDivElement>(null);
    const bottomSentinelRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef(loadMore);
    const hasMoreRef = useRef(hasMore);
    const isLoadingRef = useRef(isLoading);
    const itemsLengthRef = useRef(items.length);
    const measurementsRef = useRef(measurements);
    const overscanPxRef = useRef(overscanPx);
    // Items déjà rendus au moins une fois : ré-entrer dans la fenêtre (scroll haut/bas)
    // ne rejoue pas l'animation d'apparition — seule la toute première apparition anime.
    const seenIdsRef = useRef<Set<string | number>>(new Set());

    // Assignation directe pendant le rendu (pas via useEffect) : un useLayoutEffect
    // plus bas lit ces refs de façon synchrone, avant qu'un useEffect n'ait la
    // moindre chance de tourner — un miroir en useEffect les verrait toujours périmés.
    loadMoreRef.current = loadMore;
    hasMoreRef.current = hasMore;
    isLoadingRef.current = isLoading;
    itemsLengthRef.current = items.length;
    measurementsRef.current = measurements;
    overscanPxRef.current = overscanPx;

    // ── Skeletons ───────────────────────────────────────────────────────────
    const skeletons = useMemo(() => {
        if (SkeletonComponent) return SkeletonComponent;
        return Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} viewMode={viewMode} />
        ));
    }, [SkeletonComponent, skeletonCount, viewMode]);

    // ── tryLoadMore ──────────────────────────────────────────────────────────
    const tryLoadMore = useCallback(() => {
        if (hasMoreRef.current && !isLoadingRef.current) {
            loadMoreRef.current();
        }
    }, []);

    // ── Recalcule la fenêtre visible à partir de la position de scroll réelle ─
    // `overrideMeasurements` permet d'utiliser une mesure fraîche sans attendre le
    // prochain render (measurementsRef n'est synchronisé qu'après commit + effet).
    const recomputeRange = useCallback((overrideMeasurements?: { cols: number; rowHeight: number }) => {
        const anchor = topAnchorRef.current;
        if (!anchor || typeof window === 'undefined') return;

        const { cols, rowHeight } = overrideMeasurements ?? measurementsRef.current;
        const overscan = overscanPxRef.current;
        const listTop = anchor.getBoundingClientRect().top + window.scrollY;
        const viewTop = window.scrollY;
        const viewBottom = window.scrollY + window.innerHeight;

        const firstRow = Math.max(0, Math.floor((viewTop - listTop - overscan) / rowHeight));
        const lastRow = Math.ceil((viewBottom - listTop + overscan) / rowHeight);

        const start = firstRow * cols;
        const end = Math.min(itemsLengthRef.current, Math.max(start + cols, lastRow * cols));

        setRange(prev => (prev.start === start && prev.end === end) ? prev : { start, end });
    }, []);
    const recomputeRangeRef = useRef(recomputeRange);
    useEffect(() => { recomputeRangeRef.current = recomputeRange; }, [recomputeRange]);

    // ── Mesure cols/rowHeight (grille responsive, bascule grid/list, resize) ──
    const measure = useCallback(() => {
        if (!gridRef.current) return;
        if (gridRef.current.children.length < 2) {
            // Pas assez d'éléments rendus pour mesurer fiablement (état transitoire) —
            // on garde la dernière mesure connue plutôt que de régresser vers le fallback.
            recomputeRangeRef.current();
            return;
        }
        const next = measureGrid(gridRef.current);
        measurementsRef.current = next;
        setMeasurements(prev => (prev.cols === next.cols && prev.rowHeight === next.rowHeight) ? prev : next);
        // Recalcule immédiatement avec la mesure fraîche (pas besoin d'attendre le
        // prochain render pour que measurementsRef se resynchronise).
        recomputeRangeRef.current(next);
    }, []);
    const measureRef = useRef(measure);
    useEffect(() => { measureRef.current = measure; }, [measure]);

    // Mesure initiale + à chaque fois que la grille change de forme (resize, grid/list)
    useLayoutEffect(() => {
        measureRef.current();
    }, [viewMode, gridClassName]);

    // Ré-évalue la fenêtre quand le nombre d'items change (nouvelle page chargée,
    // filtre appliqué...) — permet aussi d'affiner rowHeight une fois que 2+ lignes existent.
    useLayoutEffect(() => {
        measureRef.current();
    }, [items.length]);

    // ── Scroll & resize : throttlés via setTimeout (pas requestAnimationFrame —
    // rAF est suspendu quand l'onglet n'est pas au premier plan/composité, ce qui
    // gèlerait le calcul de la fenêtre ; setTimeout reste fiable dans tous les cas) ──
    useEffect(() => {
        let scheduled = false;
        const onScroll = () => {
            if (scheduled) return;
            scheduled = true;
            setTimeout(() => {
                // Remesure à chaque tick (coût négligeable : quelques offsetTop sur les
                // ~10-20 nœuds déjà rendus) — évite que cols/rowHeight restent figés sur
                // une valeur obtenue pendant un état transitoire (peu d'items rendus, etc.)
                measureRef.current();
                scheduled = false;
            }, 50);
        };
        const onResize = () => {
            measureRef.current();
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        // Premier calcul dès le montage
        measureRef.current();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    // ── Observer BAS : déclenche loadMore quand on approche de la fin du contenu
    // déjà chargé (le spacer bas garantit qu'on n'y arrive qu'une fois les items
    // en mémoire réellement épuisés à l'écran) ─────────────────────────────────
    useEffect(() => {
        const el = bottomSentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) tryLoadMore(); },
            { rootMargin: '400px', threshold: 0 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [tryLoadMore]);

    // ── Quand isLoading passe à false : re-check si on doit charger plus ─────
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

    // ── Items réellement rendus dans le DOM ────────────────────────────────────
    const start = Math.min(range.start, items.length);
    const end = Math.min(range.end, items.length);
    const visibleItems = useMemo(() => items.slice(start, end), [items, start, end]);

    // ── Spacers haut/bas : préservent la hauteur totale scrollable sans avoir
    // à garder les items hors-fenêtre dans le DOM ─────────────────────────────
    const { cols, rowHeight } = measurements;
    const topRows = Math.floor(start / cols);
    const topSpacerPx = topRows * rowHeight;
    const totalRows = Math.ceil(items.length / cols);
    const endRow = Math.ceil(end / cols);
    const bottomSpacerPx = Math.max(0, (totalRows - endRow) * rowHeight);

    return (
        <div className={`w-full ${className}`}>

            {/* Ancre haute : point de référence stable pour calculer la position de
                scroll dans la liste, indépendant des spacers eux-mêmes */}
            <div ref={topAnchorRef} aria-hidden="true" />

            {topSpacerPx > 0 && <div style={{ height: topSpacerPx }} aria-hidden="true" />}

            {/* Grille unique : items fenêtrés + skeletons collés */}
            <div ref={gridRef} className={gridClassName}>
                {visibleItems.map((item, index) => {
                    const firstSeen = seenIdsRef.current.has(item.id);
                    if (!firstSeen) seenIdsRef.current.add(item.id);
                    return (
                        <motion.div
                            key={item.id}
                            layout={false}
                            initial={firstSeen ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(index % 10, 5) * 0.03 }}
                        >
                            {renderItem(item, start + index)}
                        </motion.div>
                    );
                })}

                {isLoading && skeletons}
            </div>

            {bottomSpacerPx > 0 && <div style={{ height: bottomSpacerPx }} aria-hidden="true" />}

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
