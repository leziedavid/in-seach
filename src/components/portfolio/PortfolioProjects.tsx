"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useTranslation } from "@/utils/langue/hooks";

const PROJECTS = [
    {
        title: "Tarafé",
        category: "Fashion E-commerce · Full-Stack",
        image: "/tarafe-logo.png",
        link: "https://tarafe.com/"
    },
    {
        title: "Djamko",
        category: "SaaS Ecosystem · Full-Stack",
        image: "/icons/pwa/icon-512.png",
        link: "https://www.djamko.com/"
    },
    {
        title: "eAgri",
        category: "AgriTech · Backend Java",
        image: "/eagri-logo.svg",
        link: "https://eagri.ci/"
    },
    {
        title: "Peoogo",
        category: "AgriTech Marketplace · Full-Stack",
        image: "/peoogo-logo.svg",
        link: "https://peoogo.com/"
    }
];

export default function PortfolioProjects() {
    const { t } = useTranslation();

    return (
        <section id="projects" className="py-20 px-6 max-w-5xl mx-auto border-t border-border/40">
            <h2 className="text-4xl font-black mb-12 tracking-tight">{t("portfolio.projects.title")}</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {PROJECTS.map((project) => (
                    <a
                        key={project.title}
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col gap-2"
                    >
                        <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all group-hover:shadow-xl bg-muted/30">
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-contain p-6 transition-transform group-hover:scale-105"
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight">{project.title}</h3>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{project.category}</p>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
