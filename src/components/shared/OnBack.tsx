"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface OnBackProps {
    /** Nom de la page affiché à côté de la flèche retour. */
    label: string;
    /** Appelé au clic sur la flèche — ramène l'utilisateur en arrière (menu d'accueil du rôle par défaut). */
    onBack: () => void;
    subtitle?: string;
    className?: string;
}

/**
 * En-tête "retour" partagé par les pages du tableau de bord AKWABA (remplace SectionHeader
 * quand la page est atteinte via une navigation explicite, pas un accueil de rôle).
 */
export default function OnBack({ label, onBack, subtitle, className }: OnBackProps) {
    return (
        <div className={cn("w-full max-w-full", className)}>
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-90 transition-all shrink-0"
                    aria-label="Retour"
                >
                    <Icon icon="solar:alt-arrow-left-bold" width={22} className="text-foreground" />
                </button>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-brand-secondary dark:text-white uppercase truncate">
                    {label}
                </h1>
            </div>

            {subtitle && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic font-medium mt-3 ml-1">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
