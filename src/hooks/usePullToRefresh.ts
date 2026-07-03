"use client";

import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
    /** Conteneur scrollable à surveiller (doit être en scrollTop 0 pour amorcer le tirage) */
    containerRef: React.RefObject<HTMLElement | null>;
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
 * N'agit que si le geste démarre alors que le conteneur est déjà tout en haut ;
 * un scroll normal (ou un swipe vers le haut) n'est jamais intercepté.
 */
export function usePullToRefresh({ containerRef, onRefresh, enabled, threshold = 72 }: UsePullToRefreshOptions) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const startY = useRef(0);
    const tracking = useRef(false);
    const refreshingRef = useRef(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !enabled) return;

        const onTouchStart = (e: TouchEvent) => {
            if (refreshingRef.current || el.scrollTop > 0) {
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
            if (delta <= 0 || el.scrollTop > 0) {
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

        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", finishPull, { passive: true });
        el.addEventListener("touchcancel", finishPull, { passive: true });

        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", finishPull);
            el.removeEventListener("touchcancel", finishPull);
        };
    }, [containerRef, enabled, onRefresh, threshold]);

    return { pullDistance, isPulling, isRefreshing };
}
