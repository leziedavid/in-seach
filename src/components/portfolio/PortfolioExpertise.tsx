"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "@/utils/langue/hooks";
import PortfolioSectionHeading from "./PortfolioSectionHeading";

const SKILL_GROUPS = [
    {
        title: "Langages & Frameworks",
        type: "tags" as const,
        items: [
            { name: "Java", icon: "logos:java" },
            { name: "Spring Boot", icon: "logos:spring-icon" },
            { name: "Python", icon: "logos:python" },
            { name: "Flask", icon: "logos:flask" },
            { name: "NestJS", icon: "logos:nestjs" },
            { name: "Next.js", icon: "logos:nextjs-icon" },
            { name: "React.js", icon: "logos:react" },
            { name: "Node.js", icon: "logos:nodejs-icon" },
            { name: "TypeScript", icon: "logos:typescript-icon" },
            { name: "Laravel", icon: "logos:laravel" },
            { name: "PHP", icon: "logos:php" },
        ],
    },
    {
        title: "Développement Mobile",
        type: "tags" as const,
        items: [
            { name: "Flutter", icon: "logos:flutter" },
            { name: "React Native", icon: "logos:react" },
        ],
    },
    {
        title: "Intelligence Artificielle & Vibe Coding",
        type: "list" as const,
        items: [
            "Développement d'applications assisté par IA (Vibe Coding)",
            "Intégration de modèles d'IA générative (LLM)",
            "Intégration de SDK d'IA (OpenAI, Gemini, Claude et autres)",
            "Orchestration de plusieurs modèles d'IA au sein d'une même plateforme",
            "Conception d'agents IA et d'assistants intelligents",
            "Développement de fonctionnalités basées sur le traitement du langage naturel (NLP)",
            "Intégration d'API d'IA dans des applications web et mobiles",
        ],
    },
    {
        title: "Bases de données",
        type: "tags" as const,
        items: [
            { name: "PostgreSQL", icon: "logos:postgresql" },
            { name: "MySQL", icon: "logos:mysql" },
            { name: "MongoDB", icon: "logos:mongodb-icon" },
            { name: "Redis", icon: "logos:redis" },
        ],
    },
    {
        title: "Cloud, DevOps & Outils",
        type: "tags" as const,
        items: [
            { name: "Docker", icon: "logos:docker-icon" },
            { name: "Git", icon: "logos:git-icon" },
            { name: "ERP Konosys", icon: "mdi:office-building-cog-outline" },
        ],
    },
    {
        title: "Architecture & Intégrations",
        type: "list" as const,
        items: [
            "Architecture microservices",
            "Conception et intégration d'API REST",
            "Intégration de passerelles de paiement (Wave, Orange Money, MTN, Moov, Stripe, PayPal…)",
            "Intégration de services tiers (SMS, notifications, géolocalisation, authentification)",
            "Développement de plateformes SaaS modernes",
        ],
    },
];

export default function PortfolioExpertise() {
    const { t } = useTranslation();

    return (
        <section id="expertise" className="py-10 px-6 max-w-5xl mx-auto border-t border-border/40">
            <PortfolioSectionHeading eyebrow={t("portfolio.skills.eyebrow")} title={t("portfolio.skills.title")} />

            <div className="flex flex-col gap-10">
                {SKILL_GROUPS.map((group) => (
                    <div key={group.title}>
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-5">{group.title}</h3>

                        {group.type === "tags" ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                                {group.items.map((skill) => (
                                    <div key={skill.name} className="flex items-center gap-3 group">
                                        <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center p-2 group-hover:bg-primary/5 transition-colors">
                                            <Icon icon={skill.icon} className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">{skill.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {group.items.map((item) => (
                                    <div key={item} className="glow-card flex items-start gap-2.5 bg-muted/30 rounded-xl p-3.5 border border-border/40">
                                        <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-xs text-muted-foreground leading-relaxed font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
