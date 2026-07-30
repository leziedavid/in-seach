"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface NegotiateButtonProps {
    onClick: () => void;
    loading: boolean;
    /** "full" = pleine largeur avec libellé (usage seul) ; "compact" = icône + libellé court, à côté du CTA principal. */
    variant?: "full" | "compact";
    label?: string;
    className?: string;
}

/**
 * Bouton "Discuter" — remplace le bouton gris minimal dupliqué dans modal/page/service/annonce.
 * Design premium : contour primary + fond translucide (se distingue du CTA plein sans lui faire
 * concurrence visuelle), icône dans un halo, retour tactile net.
 */
export default function NegotiateButton({ onClick, loading, variant = "compact", label = "Discuter", className = "" }: NegotiateButtonProps) {
    const isFull = variant === "full";
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`
                relative flex items-center justify-center gap-2.5 font-black text-sm
                border-2 border-primary/25 bg-primary/[0.06] hover:bg-primary/10 hover:border-primary/40
                text-primary rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-60
                ${isFull ? "w-full py-3.5" : "py-3 px-5 shrink-0"}
                ${className}
            `}
        >
            <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary/15">
                {loading ? (
                    <Icon icon="line-md:loading-twotone-loop" width={16} />
                ) : (
                    <Icon icon="solar:chat-round-dots-bold-duotone" width={16} />
                )}
            </span>
            <span>{label}</span>
        </button>
    );
}
