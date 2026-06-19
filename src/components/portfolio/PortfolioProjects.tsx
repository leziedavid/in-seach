"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useTranslation } from "@/utils/langue/hooks";

const PROJECTS = [
    {
        title: "Tarafé E-commerce",
        category: "Fashion Platform",
        image: "/project-tarafe.png",
        link: "#"
    },
    {
        title: "Djamko Services",
        category: "SaaS Ecosystem",
        image: "/og-image.png",
        link: "#"
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
                        className="group flex flex-col gap-2"
                    >
                        <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all group-hover:shadow-xl">
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
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
