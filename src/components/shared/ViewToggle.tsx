"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTranslation } from "@/utils/langue/hooks";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    className?: string;
}

export default function ViewToggle({ viewMode, onViewModeChange, className = "" }: ViewToggleProps) {
    const { t } = useTranslation();

    return (
        <div className={`flex items-center bg-muted/30 p-1 rounded-xl border border-border/50 ${className}`}>
            <button onClick={() => onViewModeChange("grid")} className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${viewMode === "grid" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {viewMode === "grid" && (
                    <motion.div layoutId="active-view" className="absolute inset-0 bg-background shadow-sm rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                <Icon icon="solar:widget-2-bold-duotone" className="w-4 h-4 relative z-10" />
                <span className="text-[10px] font-black uppercase tracking-wider relative z-10 hidden sm:block">{t("akwaba.view_toggle.grid")}</span>
            </button>

            <button onClick={() => onViewModeChange("list")} className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${viewMode === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {viewMode === "list" && (
                    <motion.div layoutId="active-view" className="absolute inset-0 bg-background shadow-sm rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                <Icon icon="solar:list-bold-duotone" className="w-4 h-4 relative z-10" />
                <span className="text-[10px] font-black uppercase tracking-wider relative z-10 hidden sm:block">{t("akwaba.view_toggle.list")}</span>
            </button>
        </div>
    );
}
