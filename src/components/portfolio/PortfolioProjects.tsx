"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useTranslation } from "@/utils/langue/hooks";
import PortfolioSectionHeading from "./PortfolioSectionHeading";

const PROJECTS = [
    {
        title: "Tarafé",
        category: "Fashion E-commerce · Full-Stack",
        description: "Plateforme e-commerce de mode africaine. Conception, développement front-end et architecture technique de bout en bout, en tant que chef de projet.",
        image: "/tarafe-logo.png",
        link: "https://tarafe.com/"
    },
    {
        title: "Djamko",
        category: "SaaS Ecosystem · Full-Stack",
        description: "Écosystème SaaS multi-services regroupant marketplace, restauration, logistique, services à la demande et dépannage gaz sous une même plateforme.",
        image: "/icons/pwa/icon-512.png",
        link: "https://www.djamko.com/"
    },
    {
        title: "eAgri",
        category: "AgriTech · Backend Java",
        description: "Plateforme digitale agricole connectant agriculteurs, grossistes, fournisseurs et transporteurs en Côte d'Ivoire. Backend en Java / Spring Boot.",
        image: "/eagri-logo.svg",
        link: "https://eagri.ci/"
    },
    {
        title: "AgriDash",
        category: "AgriTech · Microservice Laravel/Docker",
        description: "Moteur de gestion de toute la chaîne du programme eAgri, de l'enrôlement à la création des comptes. Microservice Laravel déployé sous Docker, avec Fusion & Scission d'entités, Administration, Consultation, Contrôle & Supervision et Statistiques en temps réel.",
        image: "/agriDash.png",
        link: null
    },
    {
        title: "Peoogo",
        category: "AgriTech Marketplace · Full-Stack",
        description: "Marketplace agricole mettant en relation producteurs, acheteurs et transporteurs, avec gestion des commandes et de la logistique de bout en bout.",
        image: "/peoogo-logo.svg",
        link: "https://peoogo.com/"
    },
    {
        title: "Chaucot Dubost In",
        category: "ERP Konosys · Full-Stack",
        description: "Développement des fonctionnalités de l'ERP Konosys, en lien avec les équipes métier pour faire évoluer les modules existants.",
        image: "/cdi_black_h.png",
        link: "https://www.e-charlemagne.com/fr/accueil"
    }
] as const;

export default function PortfolioProjects() {
    const { t } = useTranslation();

    return (
        <section id="projects" className="py-10 px-6 max-w-5xl mx-auto border-t border-border/40">
            <PortfolioSectionHeading eyebrow={t("portfolio.projects.eyebrow")} title={t("portfolio.projects.title")} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {PROJECTS.map((project) => {
                    const CardTag = project.link ? "a" : "div";
                    return (
                        <CardTag
                            key={project.title}
                            {...(project.link
                                ? { href: project.link, target: "_blank", rel: "noopener noreferrer" }
                                : {})}
                            className={`group flex flex-col gap-2 ${!project.link ? "cursor-default" : ""}`}
                        >
                            <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all group-hover:shadow-xl group-hover:border-primary/40 bg-muted/30">
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className="object-contain p-6 transition-transform group-hover:scale-105" />
                                {project.link ? (
                                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icon icon="solar:arrow-right-up-bold" className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                ) : (
                                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-background/90 border border-border/50 text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                                        Interne
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight">{project.title}</h3>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{project.category}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed font-medium mt-1.5 line-clamp-3">{project.description}</p>
                            </div>
                        </CardTag>
                    );
                })}
            </div>
        </section>
    );
}
