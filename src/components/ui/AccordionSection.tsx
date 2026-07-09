"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

interface AccordionSectionProps {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    children: React.ReactNode;
    badge?: React.ReactNode;
    variant?: "default" | "danger";
    activeSection: string | null;
    onToggle: (id: string) => void;
}

/**
 * Accordéon générique — un seul panneau ouvert à la fois par groupe (activeSection/onToggle
 * partagés entre plusieurs <AccordionSection>). Extrait depuis AccountSettings.tsx pour être
 * réutilisé ailleurs (ex: Store.tsx) sans dupliquer le pattern.
 */
export function AccordionSection({
    id,
    title,
    subtitle,
    icon,
    children,
    badge,
    variant = "default",
    activeSection,
    onToggle,
}: AccordionSectionProps) {
    const isOpen = activeSection === id;
    const isDanger = variant === "danger";

    return (
        <div className={`
            overflow-hidden rounded-2xl border transition-all duration-300
            ${isOpen
                ? (isDanger ? "border-rose-500/30 shadow-lg shadow-rose-500/5 bg-rose-500/5" : "border-primary/30 shadow-lg shadow-primary/5 bg-primary/[0.02]")
                : "border-border/60 hover:border-border bg-card shadow-sm"}
        `}>
            <button
                onClick={() => onToggle(id)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                        ${isOpen
                            ? (isDanger ? "bg-rose-500 text-white" : "bg-primary text-white")
                            : (isDanger ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground")}
                    `}>
                        <Icon icon={icon} className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-black tracking-tight ${isDanger ? "text-rose-900 dark:text-rose-400" : "text-foreground"}`}>
                                {title}
                            </h3>
                            {badge}
                        </div>
                        {subtitle && (
                            <p className={`text-[11px] font-medium transition-colors ${isOpen ? "text-foreground/60" : "text-muted-foreground"}`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                <Icon
                    icon="solar:alt-arrow-down-bold-duotone"
                    className={`w-5 h-5 text-muted-foreground/40 transition-transform duration-500 shrink-0 ${isOpen ? "rotate-180 text-primary" : ""}`}
                />
            </button>

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="px-5 pb-6 pt-2 border-t border-border/40">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AccordionSection;
