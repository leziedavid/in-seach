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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {EXPERIENCES.map((exp) => (
                    <div key={exp.company} className="flex flex-col gap-1.5 bg-muted/30 rounded-xl p-3 md:p-4 border border-border/40">
                        <span className="text-[10px] font-medium text-muted-foreground">{exp.period}</span>
                        <h3 className="text-sm font-black uppercase tracking-tight leading-tight">{exp.company}</h3>
                        <p className="text-xs text-primary font-bold">{exp.role}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium">
                            {exp.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
