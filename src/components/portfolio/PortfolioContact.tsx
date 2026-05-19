"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/utils/langue/hooks";

export default function PortfolioContact() {
    const { t } = useTranslation();

    return (
        <section id="contact" className="py-32 px-6 max-w-5xl mx-auto border-t border-border/40 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl md:text-4xl font-black tracking-tight uppercase leading-none">
                        {t("portfolio.contact.title")} <br />
                        <span className="text-primary italic">{t("portfolio.contact.subtitle")}</span>
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-md">
                        {t("portfolio.contact.description")}
                    </p>
                </div>

                <div className="flex flex-col gap-6 items-center md:items-end">
                    <Button size="lg" className="rounded-full px-8 py-4 text-lg font-black shadow-xl">
                        {t("portfolio.contact.button")}
                    </Button>
                    <div className="flex gap-4">
                        <a href="#" className="p-3 bg-muted/50 rounded-full hover:bg-muted transition-colors">
                            <Icon icon="logos:linkedin-icon" className="w-5 h-5" />
                        </a>
                        <a href="#" className="p-3 bg-muted/50 rounded-full hover:bg-muted transition-colors">
                            <Icon icon="logos:github-icon" className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="mt-32 pt-12 border-t border-border/10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50">
                    &copy; 2026 TRA BI LEZIE DAVID
                </p>
            </div>
        </section>
    );
}
