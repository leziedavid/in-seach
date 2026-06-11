"use client";

/**
 * Badge flottant "LIVE" style TikTok.
 * À placer dans un conteneur `relative` (ex: le wrapper image de la carte).
 * Positionné en `absolute` top-right par défaut via className.
 *
 * Usage :
 *   <div className="relative ...">
 *     <Image ... />
 *     <LiveButtonInline onClick={...} />
 *   </div>
 */

import { Icon } from "@iconify/react";

interface LiveButtonInlineProps {
    onClick: (e: React.MouseEvent) => void;
    title?: string;
    className?: string;
}

export default function LiveButtonInline({
    onClick,
    title = "Créer un Live",
    className = "absolute top-2 right-2",
}: LiveButtonInlineProps) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
                ${className}
                z-10 flex items-center gap-1 px-2 py-1
                bg-red-600 hover:bg-red-700
                rounded-md
                shadow-lg shadow-red-600/40
                active:scale-95 transition-all duration-150
            `}
        >
            <Icon
                icon="solar:videocamera-bold"
                className="w-3 h-3 text-white shrink-0"
            />
            <span className="text-white font-black text-[10px] tracking-widest uppercase leading-none">
                Live
            </span>
        </button>
    );
}
