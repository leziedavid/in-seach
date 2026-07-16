"use client";

import { Icon } from "@iconify/react";

interface PullToRefreshIndicatorProps {
    pullDistance: number;
    isPulling: boolean;
    isRefreshing: boolean;
    threshold?: number;
    className?: string;
}

/**
 * Indicateur visuel générique pour usePullToRefresh — flèche qui pivote pendant le
 * tirage, spinner pendant le refresh. À placer en tout premier enfant du conteneur
 * scrollable (ou en haut de l'écran si le hook utilise le scroll du document).
 * Pousse le contenu vers le bas via sa hauteur (pas de transform), pour ne jamais
 * désynchroniser un éventuel scroll-snap.
 */
export default function PullToRefreshIndicator({
    pullDistance,
    isPulling,
    isRefreshing,
    threshold = 72,
    className = "",
}: PullToRefreshIndicatorProps) {
    const height = isRefreshing ? 56 : pullDistance;

    return (
        <div
            className={`flex items-center justify-center overflow-hidden ${isPulling ? "" : "transition-[height] duration-300 ease-out"} ${className}`}
            style={{ height }}
        >
            <Icon
                icon={isRefreshing ? "solar:restart-bold-duotone" : "solar:arrow-down-bold-duotone"}
                className={`w-6 h-6 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
                style={{
                    opacity: Math.min(1, height / 50),
                    transform: isRefreshing ? undefined : `rotate(${Math.min(180, (pullDistance / threshold) * 180)}deg)`,
                }}
            />
        </div>
    );
}
