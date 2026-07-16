"use client";

import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
    /**
     * Conteneur scrollable à surveiller (doit être en scrollTop 0 pour amorcer le tirage).
     * Optionnel : si omis (ou si `.current` est encore null), le hook se rabat sur le
     * scroll du document — le cas de la grande majorité des écrans de l'app, qui n'ont
     * pas de conteneur scrollable dédié (contrairement à un feed plein écran type LiveFeed).
     * C'est ce qui rend le hook réutilisable par n'importe quel composant/écran : chaque
     * composant qui l'appelle avec son propre `onRefresh` devient de fait "l'écran actif"
     * pendant qu'il est monté — React démonte proprement les listeners en quittant l'écran.
     */
    containerRef?: React.RefObject<HTMLElement | null>;
    /** Appelé une fois le seuil franchi et le doigt relâché. Peut être async. */
    onRefresh: () => Promise<void> | void;
    /** Coupe complètement le geste (ex: hors PWA standalone, ou vue "embedded") */
    enabled: boolean;
    /** Distance de tirage (px) nécessaire pour déclencher le refresh */
    threshold?: number;
}

const REFRESH_HEIGHT = 56;

/**
 * Pull-to-refresh tactile "à la TikTok/Instagram" — sans window.location.reload().
 * N'agit que si le geste démarre alors que le conteneur (ou le document) est déjà tout
 * en haut ; un scroll normal (ou un swipe vers le haut) n'est jamais intercepté.
 */
export function usePullToRefresh({ containerRef, onRefresh, enabled, threshold = 72 }: UsePullToRefreshOptions) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const startY = useRef(0);
    const tracking = useRef(false);
    const refreshingRef = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        const el = containerRef?.current ?? null;
        // Cible d'écoute : le conteneur fourni, ou le document entier (repli générique).
        const target: EventTarget = el ?? window;
        // Position de scroll à surveiller : celle du conteneur, ou celle du document.
        const getScrollTop = () => el ? el.scrollTop : (document.scrollingElement?.scrollTop ?? window.scrollY);

        const onTouchStart = (e: TouchEvent) => {
            if (refreshingRef.current || getScrollTop() > 0) {
                tracking.current = false;
                return;
            }
            startY.current = e.touches[0].clientY;
            tracking.current = true;
            setIsPulling(true);
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!tracking.current) return;
            const delta = e.touches[0].clientY - startY.current;
            if (delta <= 0 || getScrollTop() > 0) {
                tracking.current = false;
                setIsPulling(false);
                setPullDistance(0);
                return;
            }
            // Résistance élastique — le tirage ralentit progressivement
            setPullDistance(Math.min(threshold * 1.6, delta * 0.5));
            if (delta > 4 && e.cancelable) e.preventDefault();
        };

        const finishPull = () => {
            if (!tracking.current) return;
            tracking.current = false;
            setIsPulling(false);

            setPullDistance(current => {
                if (current >= threshold) {
                    refreshingRef.current = true;
                    setIsRefreshing(true);
                    Promise.resolve(onRefresh()).finally(() => {
                        refreshingRef.current = false;
                        setIsRefreshing(false);
                        setPullDistance(0);
                    });
                    return REFRESH_HEIGHT;
                }
                return 0;
            });
        };

        target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
        target.addEventListener("touchmove", onTouchMove as EventListener, { passive: false });
        target.addEventListener("touchend", finishPull, { passive: true });
        target.addEventListener("touchcancel", finishPull, { passive: true });

        return () => {
            target.removeEventListener("touchstart", onTouchStart as EventListener);
            target.removeEventListener("touchmove", onTouchMove as EventListener);
            target.removeEventListener("touchend", finishPull);
            target.removeEventListener("touchcancel", finishPull);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef?.current, enabled, onRefresh, threshold]);

    return { pullDistance, isPulling, isRefreshing };
}
