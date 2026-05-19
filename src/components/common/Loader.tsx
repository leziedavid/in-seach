"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/utils/langue/hooks";

interface LoaderProps {
    title?: string;
    description?: string;
    icon?: string;
    className?: string;
}

export default function Loader({
    title,
    description,
    icon = "solar:hourglass-line-duotone",
    className = "",
}: LoaderProps) {
    const { t } = useTranslation();
    const finalTitle = title || t("common.loading");
    const finalDescription = description || t("services.search_loading_description");
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`flex flex-col items-center justify-center py-16 px-6 text-center w-full max-w-md mx-auto ${className}`}
        >
            <div className="relative mb-8">
                {/* Pulsing decorative background */}
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.04, 0.14, 0.04] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary blur-3xl rounded-full scale-150"
                />

                {/* Icon container */}
                <div className="relative w-24 h-24 bg-card border-2 border-border/50 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-primary/5">
                    <motion.div
                        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Icon icon={icon} className="w-12 h-12 text-primary/50" />
                    </motion.div>

                    {/* Floating dot — top right */}
                    <motion.div
                        animate={{ y: [0, -10, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-3 -right-1 w-3 h-3 bg-primary rounded-full"
                    />
                    {/* Floating dot — bottom left */}
                    <motion.div
                        animate={{ y: [0, 8, 0], opacity: [0.25, 0.9, 0.25] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                        className="absolute -bottom-1 -left-3 w-2 h-2 bg-secondary rounded-full"
                    />
                    {/* Floating dot — top left */}
                    <motion.div
                        animate={{ y: [0, -6, 0], x: [0, 3, 0], opacity: [0.15, 0.65, 0.15] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                        className="absolute top-1 -left-4 w-2 h-2 bg-primary/60 rounded-full"
                    />
                </div>
            </div>

            <div className="space-y-3 relative z-10 w-full">
                <h3 className="text-xl font-black text-foreground tracking-tight">
                    {finalTitle}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {finalDescription}
                </p>

                {/* Bouncing dots */}
                <div className="flex items-center justify-center gap-2 pt-3">
                    {[0, 0.22, 0.44].map((delay, i) => (
                        <motion.div
                            key={i}
                            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
                            className="w-2 h-2 bg-primary/50 rounded-full"
                        />
                    ))}
                </div>

                {/* Timer */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="flex items-center justify-center gap-2 pt-4"
                >
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/60 border border-border/40">
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Icon
                                icon="solar:clock-circle-bold-duotone"
                                className="w-3.5 h-3.5 text-primary/50 flex-shrink-0"
                            />
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.span
                                key={elapsed}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.18 }}
                                className="text-[11px] font-black text-muted-foreground/60 tabular-nums tracking-[0.15em]"
                            >
                                {mm}:{ss}
                            </motion.span>
                        </AnimatePresence>

                        {elapsed >= 10 && (
                            <motion.span
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider"
                            >
                                en cours...
                            </motion.span>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
