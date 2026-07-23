"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface SensitiveMediaProps {
    /** Le(s) <Image /> à protéger (ex: fill + object-cover). */
    children: React.ReactNode;
    /** true = contenu visible, false = flouté. */
    revealed: boolean;
    /** Bascule l'autorisation d'affichage (partagée pour tout le produit). */
    onToggle: () => void;
    /**
     * "full"    = grande zone (carousel détail, lightbox) : icône + texte + bouton.
     * "compact" = petite zone (carte produit) : icône œil seule.
     * "static"  = flou seul, sans overlay cliquable (ex: miniatures qui gardent
     *             leur propre onClick de sélection).
     */
    variant?: "full" | "compact" | "static";
}

export default function SensitiveMedia({ children, revealed, onToggle, variant = "compact" }: SensitiveMediaProps) {
    const isStatic = variant === "static";

    return (
        <div className="absolute inset-0 z-10">
            <div className={`w-full h-full transition-all duration-500 ${revealed ? "" : "blur-2xl scale-110"}`}>
                {children}
            </div>

            {!revealed && !isStatic && (
                <div
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer bg-black/20 ${variant === "full" ? "px-6 text-center" : ""}`}
                >
                    <Icon
                        icon="solar:eye-closed-bold-duotone"
                        className={variant === "full" ? "w-10 h-10 text-white drop-shadow-lg" : "w-6 h-6 text-white drop-shadow-lg"}
                    />
                    {variant === "full" && (
                        <>
                            <p className="text-white font-black text-base md:text-lg drop-shadow-lg">
                                Ce contenu contient des éléments sensibles
                            </p>
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-black text-sm shadow-lg transition-all active:scale-95"
                            >
                                Afficher quand même
                            </button>
                        </>
                    )}
                </div>
            )}

            {revealed && !isStatic && (
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    title="Masquer le contenu sensible"
                    className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                    <Icon icon="solar:eye-bold-duotone" className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
