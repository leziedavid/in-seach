"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/utils/langue/hooks";

export default function PortfolioNavbar() {
    const { t, language, setLanguage } = useTranslation();

    const NAV_LINKS = [
        { label: t("portfolio.nav.about"), href: "#hero", icon: "solar:user-bold" },
        { label: t("portfolio.nav.work"), href: "#projects", icon: "solar:folder-bold" },
        { label: t("portfolio.nav.blog"), href: "#", icon: "solar:pen-bold" },
        { label: t("portfolio.nav.gallery"), href: "#", icon: "solar:gallery-bold" },
    ];
    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-fit">
            <nav className="bg-background/80 backdrop-blur-2xl border border-border/50 rounded-full shadow-sm p-1.5 flex items-center gap-1">
                <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <Icon icon="solar:home-2-bold" className="w-4 h-4" />
                </Link>

                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted transition-all text-xs font-bold"
                    >
                        <Icon icon={link.icon} className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                ))}

                <div className="w-px h-4 bg-border/50 mx-2" />
                <button
                    onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-[10px] font-black uppercase"
                >
                    {language === "fr" ? "EN" : "FR"}
                </button>
                <ThemeToggle />
            </nav>
        </div>
    );
}
