import { Icon } from "@iconify/react";

/**
 * Illustrations "maison" façon unDraw (formes douces + icône duotone), recolorables
 * par section — plutôt que d'importer des SVG unDraw externes (bloqués par la CSP
 * img-src actuelle et visuellement en rupture avec le système d'icônes Solar déjà
 * utilisé partout dans l'app). Même composition pour toutes les sections = identité
 * visuelle cohérente ; le "tone" change la couleur = une illustration différente
 * par section, sur la palette Djamko.
 */
const TONE_STYLES = {
    primary: { blob: "bg-primary/20", bg: "bg-primary/10", icon: "text-primary", ring: "ring-primary/20" },
    secondary: { blob: "bg-secondary/20", bg: "bg-secondary/10", icon: "text-secondary", ring: "ring-secondary/20" },
    orange: { blob: "bg-orange-500/20", bg: "bg-orange-500/10", icon: "text-orange-600 dark:text-orange-400", ring: "ring-orange-500/20" },
    purple: { blob: "bg-purple-500/20", bg: "bg-purple-500/10", icon: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/20" },
    cyan: { blob: "bg-cyan-500/20", bg: "bg-cyan-500/10", icon: "text-cyan-600 dark:text-cyan-400", ring: "ring-cyan-500/20" },
    emerald: { blob: "bg-emerald-500/20", bg: "bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/20" },
    blue: { blob: "bg-blue-500/20", bg: "bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/20" },
    rose: { blob: "bg-rose-500/20", bg: "bg-rose-500/10", icon: "text-rose-600 dark:text-rose-400", ring: "ring-rose-500/20" },
    indigo: { blob: "bg-indigo-500/20", bg: "bg-indigo-500/10", icon: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500/20" },
    amber: { blob: "bg-amber-500/20", bg: "bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/20" },
    fuchsia: { blob: "bg-fuchsia-500/20", bg: "bg-fuchsia-500/10", icon: "text-fuchsia-600 dark:text-fuchsia-400", ring: "ring-fuchsia-500/20" },
} as const;

export type GuideTone = keyof typeof TONE_STYLES;

interface GuideIllustrationProps {
    icon: string;
    accentIcon?: string;
    tone: GuideTone;
    className?: string;
}

export default function GuideIllustration({ icon, accentIcon, tone, className }: GuideIllustrationProps) {
    const t = TONE_STYLES[tone] ?? TONE_STYLES.primary;

    return (
        <div className={`relative w-full aspect-square max-w-[260px] mx-auto flex items-center justify-center ${className ?? ""}`}>
            <div className={`absolute inset-6 rounded-[3rem] ${t.blob} blur-2xl`} />
            <div className={`absolute inset-0 rounded-[3rem] ${t.bg} border border-border/40 flex items-center justify-center overflow-hidden`}>
                <Icon icon={icon} className={`w-24 h-24 md:w-28 md:h-28 ${t.icon}`} />
            </div>
            {accentIcon && (
                <div className={`absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-card shadow-lg ring-4 ${t.ring} flex items-center justify-center`}>
                    <Icon icon={accentIcon} className={`w-6 h-6 ${t.icon}`} />
                </div>
            )}
        </div>
    );
}
