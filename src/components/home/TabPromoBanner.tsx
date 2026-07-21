"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useDismissiblePromo } from "@/hooks/useDismissiblePromo";

export type PromoTone = "primary" | "blue" | "amber" | "emerald" | "fuchsia" | "orange" | "rose";

// Dégradés pleins par ton — classes complètes (pas de template Tailwind dynamique,
// qui casserait le purge en prod). Mêmes noms de ton que GuideIllustration.tsx pour
// rester cohérent visuellement avec le reste de l'app.
const TONE_GRADIENTS: Record<PromoTone, string> = {
    primary: "from-primary via-primary to-secondary",
    blue: "from-blue-500 via-blue-600 to-blue-700",
    amber: "from-amber-400 via-amber-500 to-amber-600",
    emerald: "from-emerald-500 via-emerald-600 to-emerald-700",
    fuchsia: "from-fuchsia-500 via-fuchsia-600 to-fuchsia-700",
    orange: "from-orange-500 via-orange-600 to-orange-700",
    rose: "from-rose-500 via-rose-600 to-rose-700",
};

export interface TabPromo {
    tabId: string;
    active: boolean;
    badge: string;
    icon: string;
    tone: PromoTone;
    title: string;
    description: string;
    onAction?: () => void;
}

interface TabPromoBannerProps {
    promo: TabPromo;
}

export default function TabPromoBanner({ promo }: TabPromoBannerProps) {
    const { dismissed, dismiss } = useDismissiblePromo(promo.tabId);

    if (!promo.active || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -12 }}
                transition={{ type: "spring", stiffness: 150, damping: 18 }}
                className="relative w-[calc(100%-2rem)] mx-4 md:mx-auto max-w-xl mt-4"
            >
                {/* Bouton de fermeture rouge flottant — même style que Info.tsx / LiveEntryButton.tsx */}
                <motion.button
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.25, type: "spring" }}
                    onClick={dismiss}
                    aria-label="Fermer"
                    className="absolute -top-2.5 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-white dark:border-zinc-900 transition-all active:scale-90 hover:scale-110"
                >
                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                </motion.button>

                <button
                    type="button"
                    onClick={promo.onAction}
                    disabled={!promo.onAction}
                    className={`group relative flex items-center gap-3 w-full px-4 py-4 md:py-5 rounded-3xl overflow-hidden text-left bg-gradient-to-br ${TONE_GRADIENTS[promo.tone]} shadow-xl active:scale-[0.98] transition-transform duration-150 ${promo.onAction ? "cursor-pointer" : "cursor-default"}`}
                >
                    {/* Halos de fond, comme LiveEntryButton.tsx */}
                    <span className="absolute -left-3 -top-3 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                    <span className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />

                    {/* Ruban "Nouveau!" — couleur fixe contrastant avec le dégradé de la carte, quel que soit le ton */}
                    <span className="absolute top-3 right-3 rotate-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-md">
                        {promo.badge}
                    </span>

                    {/* Texte */}
                    <div className="flex-1 min-w-0 z-10 pr-16">
                        <p className="text-white font-black text-sm md:text-base leading-tight truncate">{promo.title}</p>
                        <p className="text-white/80 text-xs md:text-sm mt-1 leading-snug line-clamp-2">{promo.description}</p>
                    </div>

                    {/* Icône + anneau pulsant + bouton "play" */}
                    <span className="relative z-10 flex items-center gap-2 shrink-0">
                        <span className="relative flex items-center justify-center">
                            <span className="absolute w-12 h-12 rounded-full bg-white/20 animate-ping-slow" />
                            <span className="relative w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                                <Icon icon={promo.icon} className="w-6 h-6 text-white" />
                            </span>
                        </span>
                        {promo.onAction && (
                            <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                                <Icon icon="solar:play-bold" className="w-4 h-4 text-white ml-0.5" />
                            </span>
                        )}
                    </span>
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
