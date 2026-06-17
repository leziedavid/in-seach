"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

export type NotificationType = "success" | "warning" | "info" | "error";

interface NotificationToastProps {
    message: string;
    type?: NotificationType;
    duration?: number;
    onClose?: () => void;
}

const CONFIG: Record<NotificationType, { icon: string; iconColor: string; pill: string; barColor: string }> = {
    success: {
        icon: "solar:check-circle-bold-duotone",
        iconColor: "text-emerald-600",
        pill: "bg-emerald-500/15",
        barColor: "#00875A",
    },
    warning: {
        icon: "solar:danger-triangle-bold-duotone",
        iconColor: "text-amber-600",
        pill: "bg-amber-500/15",
        barColor: "#B45309",
    },
    info: {
        icon: "solar:info-circle-bold-duotone",
        iconColor: "text-blue-600",
        pill: "bg-blue-500/15",
        barColor: "#1D4ED8",
    },
    error: {
        icon: "solar:close-circle-bold-duotone",
        iconColor: "text-red-600",
        pill: "bg-red-500/15",
        barColor: "#B91C1C",
    },
};

export default function NotificationToast({
    message,
    type = "success",
    duration = 4000,
    onClose,
}: NotificationToastProps) {
    const [visible, setVisible] = useState(true);
    const [progress, setProgress] = useState(100);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

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
    }, [duration]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: -90, opacity: 0, scale: 0.92 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -60, opacity: 0, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-fit max-w-[88vw]"
                    style={{ minWidth: 240 }}
                >
                    {/* Island container */}
                    <div
                        className="relative overflow-hidden rounded-xl px-4 py-3 flex items-center gap-3"
                        style={{
                            background: "rgba(235, 235, 240, 0.88)",
                            border: "0.5px solid rgba(255,255,255,0.8)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
                            backdropFilter: "blur(40px) saturate(180%)",
                            WebkitBackdropFilter: "blur(40px) saturate(180%)",
                        }}
                    >
                        {/* Colored icon bubble */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${cfg.pill}`}>
                            <Icon icon={cfg.icon} className={`w-5 h-5 ${cfg.iconColor}`} />
                        </div>

                        {/* Message */}
                        <p className="text-[13.5px] font-semibold leading-snug flex-1 pr-1" style={{ color: cfg.barColor }}>
                            {message}
                        </p>

                        {/* Dismiss */}
                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-black/[0.15] hover:bg-black/[0.25] transition-colors"
                            aria-label="Fermer"
                        >
                            <Icon icon="solar:close-bold" className="w-3.5 h-3.5 text-zinc-700" />
                        </button>

                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/[0.05]">
                            <div
                                style={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    backgroundColor: cfg.barColor,
                                    opacity: 0.35,
                                    transition: "width 50ms linear",
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
