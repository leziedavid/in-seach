"use client";

import { ReactNode, useState } from "react";
import { Icon } from "@iconify/react";
import { BoostEntityType } from "@/types/interface";
import BoostedEntityList from "@/components/boost/BoostedEntityList";

interface BoostedContentTabsProps {
    entityType: BoostEntityType;
    /** Libellé singulier, ex: "produit", "service", "annonce", "service logistique" */
    entityLabel: string;
    /** Libellé pluriel pour les onglets, ex: "Produits", "Services", "Annonces" */
    entityLabelPlural: string;
    iconMine?: string;
    iconBoosted?: string;
    /** Contenu existant — rendu strictement inchangé sous l'onglet "Mes ..." */
    children: ReactNode;
}

/**
 * Wrapper de tabs réutilisable pour ajouter un onglet "Contenus Boostés" à côté
 * d'une liste existante, sans toucher au comportement ni au rendu de celle-ci.
 *
 * Mobile : labels masqués, uniquement icône + style compact (cohérent avec
 * le pattern déjà utilisé dans Commandes.tsx / Header.tsx : `hidden sm:inline`).
 */
export default function BoostedContentTabs({ entityType, entityLabel, entityLabelPlural, iconMine = "solar:widget-2-bold-duotone", iconBoosted = "solar:rocket-bold-duotone", children, }: BoostedContentTabsProps) {

    const [activeTab, setActiveTab] = useState<"mine" | "boosted">("mine");

    return (
        <div className="w-full">
            {/* TABS */}
            <div className="flex bg-muted/50 p-1 rounded-2xl mb-4 w-full max-w-md">
                <button onClick={() => setActiveTab("mine")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "mine" ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <Icon icon={iconMine} width={18} />
                    <span className="hidden sm:inline">Mes {entityLabelPlural}</span>
                </button>
                <button onClick={() => setActiveTab("boosted")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "boosted" ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <Icon icon={iconBoosted} width={18} />
                    <span className="hidden sm:inline">{entityLabelPlural} Boostés</span>
                </button>
            </div>

            {/* Onglet "Mes ..." — comportement existant, totalement inchangé */}
            <div className={activeTab === "mine" ? "block" : "hidden"}>
                {children}
            </div>

            {/* Onglet "Boostés" — monté uniquement quand actif pour éviter un fetch inutile */}
            {activeTab === "boosted" && (
                <BoostedEntityList entityType={entityType} entityLabel={entityLabel} />
            )}
        </div>
    );
}
