"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/utils/langue/hooks";
import PortfolioSectionHeading from "./PortfolioSectionHeading";

export default function PortfolioContact() {
    const { t } = useTranslation();

    return (
        <section id="contact" className="py-10 px-6 max-w-5xl mx-auto border-t border-border/40">
            <PortfolioSectionHeading eyebrow={t("portfolio.contact.eyebrow")} />

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary px-8 py-16 md:px-16 md:py-20 text-center md:text-left -mt-4">
                <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none text-white">
                            {t("portfolio.contact.title")} <br />
                            <span className="italic text-white/70">{t("portfolio.contact.subtitle")}</span>
                        </h2>
                        <p className="text-lg text-white/80 font-medium max-w-md">
                            {t("portfolio.contact.description")}
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 items-center md:items-end shrink-0">
                        <Button asChild size="lg" className="rounded-full px-8 py-4 text-lg font-black shadow-xl bg-white text-secondary hover:bg-white/90 hover:scale-[1.02] active:scale-95 transition-transform">
                            <a href="mailto:lezie04@gmail.com">
                                {t("portfolio.contact.button")}
                            </a>
                        </Button>
                        <div className="flex gap-4">
                            <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <Icon icon="logos:linkedin-icon" className="w-5 h-5" />
                            </a>
                            <a href="https://github.com/leziedavid" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <Icon icon="logos:github-icon" className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-border/10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50">
                    &copy; 2026 TRA BI LEZIE DAVID
                </p>
            </div>
        </section>
    );
}
