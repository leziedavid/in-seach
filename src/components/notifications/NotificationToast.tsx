"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

export type NotificationType = "success" | "warning" | "info" | "error";

interface NotificationToastProps {
    message: string;
    /** Titre en gras (ex: "Paiement réussi!"). Par défaut, dérivé du type. */
    title?: string;
    type?: NotificationType;
    duration?: number;
    onClose?: () => void;
}

const CONFIG: Record<NotificationType, { icon: string; defaultTitle: string; iconBg: string; barColor: string }> = {
    success: {
        icon: "solar:check-circle-bold-duotone",
        defaultTitle: "Succès",
        iconBg: "bg-emerald-500",
        barColor: "#00875A",
    },
    warning: {
        icon: "solar:danger-triangle-bold-duotone",
        defaultTitle: "Attention",
        iconBg: "bg-amber-500",
        barColor: "#B45309",
    },
    info: {
        icon: "solar:info-circle-bold-duotone",
        defaultTitle: "Information",
        iconBg: "bg-blue-500",
        barColor: "#1D4ED8",
    },
    error: {
        icon: "solar:close-circle-bold-duotone",
        defaultTitle: "Erreur",
        iconBg: "bg-red-500",
        barColor: "#B91C1C",
    },
};

export default function NotificationToast({
    message,
    title,
    type = "success",
    duration = 4000,
    onClose,
}: NotificationToastProps) {
    const [visible, setVisible] = useState(true);
    const [progress, setProgress] = useState(100);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    // Heure figée à l'affichage — comme une vraie notification reçue à cet instant.
    const [time] = useState(() => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));

    const cfg = CONFIG[type];

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onClose?.(), 350);
    };

    useEffect(() => {
        const tick = (now: number) => {
            if (!startRef.current) startRef.current = now;
            const elapsed = now - startRef.current;
            const pct = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(pct);
            if (elapsed < duration) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                handleClose();
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: -90, opacity: 0, scale: 0.92 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -60, opacity: 0, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-sm"
                >
                    <div className="relative">
                        {/* Bouton fermer — flottant au-dessus de la carte, comme une vraie bannière iOS */}
                        <button
                            onClick={handleClose}
                            aria-label="Fermer"
                            className="absolute -top-2.5 -right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-white text-[#0F2944] shadow-[0_2px_10px_rgba(15,41,68,0.2)] border border-[#EEF1F4] hover:bg-[#F2EFE7] active:scale-90 transition-all"
                        >
                            <Icon icon="solar:close-bold" className="w-3.5 h-3.5" />
                        </button>

                        {/* Carte — même fond/ombre que le composant Modal (plus doux, plus fluide) */}
                        <div className="relative overflow-hidden rounded-2xl bg-[#FBFAF6] border border-[#EEF1F4] shadow-[0_8px_32px_rgba(15,41,68,0.16)] px-3.5 py-3 flex items-start gap-2.5">
                            {/* Icône "app" */}
                            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.iconBg} shadow-sm mt-0.5`}>
                                <Icon icon={cfg.icon} className="w-5 h-5 text-white" />
                            </div>

                            {/* Titre + heure, puis message */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-[13.5px] font-bold text-[#0F2944] leading-tight truncate">
                                        {title || cfg.defaultTitle}
                                    </p>
                                    <span className="text-[11px] text-[#1F3A5F]/50 flex-shrink-0">{time}</span>
                                </div>
                                <p className="text-[12.5px] text-[#1F3A5F]/85 leading-snug mt-0.5">
                                    {message}
                                </p>
                            </div>

                            {/* Barre de progression (auto-dismiss) */}
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/[0.05]">
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${progress}%`,
                                        backgroundColor: cfg.barColor,
                                        opacity: 0.3,
                                        transition: "width 50ms linear",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
