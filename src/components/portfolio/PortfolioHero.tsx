"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/utils/langue/hooks";

export default function PortfolioHero() {
    const { t } = useTranslation();

    return (
        <section id="hero" className="pt-48 pb-20 px-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-16">
            {/* Left Column: Avatar & Info */}
            <div className="flex flex-col items-center md:items-start gap-6 shrink-0">
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-border shadow-sm">
                    <Image 
                        src="/david-avatar.png" 
                        alt="TRA BI LEZIE DAVID" 
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Icon icon="solar:map-point-bold" className="text-primary w-4 h-4" />
                        <span>{t("portfolio.hero.location")}</span>
                    </div>

                    <div className="flex gap-2">
                        <div className="px-3 py-1 bg-muted rounded-md text-[10px] font-bold border border-border/50 text-muted-foreground uppercase">{t("portfolio.hero.languages.fr")}</div>
                        <div className="px-3 py-1 bg-muted rounded-md text-[10px] font-bold border border-border/50 text-muted-foreground uppercase">{t("portfolio.hero.languages.en")}</div>
                    </div>
                </div>
            </div>

            {/* Right Column: Title & Bio */}
            <div className="flex flex-col gap-8 flex-1 text-center md:text-left">
                <div className="flex flex-col items-center md:items-start gap-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary border border-primary/10 text-[10px] font-bold uppercase tracking-widest">
                        <Icon icon="solar:calendar-bold" className="w-4 h-4" />
                        <span>{t("portfolio.hero.schedule")}</span>
                        <Icon icon="solar:alt-arrow-right-bold" className="w-3 h-3" />
                    </div>

                    <div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-2">
                            {t("portfolio.hero.title")} <span className="text-foreground/80 font-medium">DAVID</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium tracking-tight">
                            {t("portfolio.hero.subtitle")}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <SocialLink icon="logos:github-icon" label="GitHub" href="https://github.com/leziedavid" />
                        <SocialLink icon="logos:linkedin-icon" label="LinkedIn" href="#" />
                        <SocialLink icon="logos:twitter" label="Twitter" href="#" />
                        <SocialLink icon="solar:letter-bold" label="Email" href="mailto:david@lezie.dev" isIconifyOnly />
                    </div>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    {t("portfolio.hero.bio")}
                </p>
            </div>
        </section>
    );
}

function SocialLink({ icon, label, href, isIconifyOnly = false }: { icon: string; label: string; href: string; isIconifyOnly?: boolean }) {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border/50 rounded-full transition-all group"
        >
            <Icon icon={icon} className={isIconifyOnly ? "w-4 h-4 text-muted-foreground group-hover:text-primary" : "w-4 h-4"} />
            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">{label}</span>
        </a>
    );
}
