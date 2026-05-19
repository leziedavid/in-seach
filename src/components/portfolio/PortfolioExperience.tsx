"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "@/utils/langue/hooks";

const EXPERIENCES = [
    {
        company: "Tarafé SAS",
        role: "Chef de projet & Lead Web/Mobile",
        period: "2023 - Present",
        description: "Responsable de la conception globale et du développement de la plateforme e-commerce de mode africaine. Gestion d'équipe et architecture technique.",
    },
    {
        company: "Freelance",
        role: "Senior Full-Stack Developer",
        period: "2020 - 2023",
        description: "Accompagnement de startups dans le développement de MVPs robustes et scalables.",
    },
    {
        company: "InovTech Solutions",
        role: "Full-Stack Developer",
        period: "2018 - 2020",
        description: "Développement d'applications de gestion d'entreprise sur mesure.",
    }
];

export default function PortfolioExperience() {
    const { t } = useTranslation();

    return (
        <section id="experience" className="py-20 px-6 max-w-5xl mx-auto border-t border-border/40">
            <h2 className="text-4xl font-black mb-12 tracking-tight">{t("portfolio.experience.title")}</h2>

            <div className="flex flex-col gap-16">
                {EXPERIENCES.map((exp) => (
                    <div key={exp.company} className="flex flex-col gap-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black uppercase tracking-tight">{exp.company}</h3>
                                <p className="text-primary font-bold text-sm">{exp.role}</p>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground md:text-right">{exp.period}</span>
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed mt-2 max-w-3xl font-medium">
                            {exp.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
