"use client";

import React from "react";
import { useTranslation } from "@/utils/langue/hooks";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageToggle({ className = "" }: { className?: string }) {
    const { language, setLanguage } = useTranslation();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const toggleLanguage = () => {
        setLanguage(language === "fr" ? "en" : "fr");
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-primary/10 hover:bg-primary/20 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-95 group overflow-hidden border border-primary/20 dark:border-white/10 ${className}`}
            title={language === "fr" ? "Switch to English" : "Passer en Français"}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={language}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                >
                    <span className="text-[10px] font-black text-primary dark:text-white uppercase tracking-tighter">
                        {language === "fr" ? "EN" : "FR"}
                    </span>
                </motion.div>
            </AnimatePresence>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}
