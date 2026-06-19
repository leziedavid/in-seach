"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "@/utils/langue/hooks";

const EXPERIENCES = [
    {
        company: "Mobisoft",
        role: "Ingénieur logiciel",
        type: "Temps plein",
        period: "juin 2024 - aujourd'hui",
        location: "Abidjan, Côte d'Ivoire · Sur site",
        objective: "Concevoir et développer le backend de eAgri.ci, plateforme digitale agricole connectant agriculteurs, grossistes, fournisseurs et transporteurs en Côte d'Ivoire.",
        skills: ["Java", "PHP", "Spring Boot", "MySQL"],
    },
    {
        company: "Tarafé SAS",
        role: "Développeur Web et Mobile",
        type: "Freelance",
        period: "2023 - aujourd'hui",
        location: "Abidjan, Côte d'Ivoire · À distance",
        objective: "Chef de projet, concepteur et responsable du développement de la plateforme e-commerce de mode africaine, du front-end à l'architecture technique.",
        skills: ["Développement front-end", "Applications web", "Next.js"],
    },
    {
        company: "SLT",
        role: "Développeur applications mobiles",
        type: "Freelance",
        period: "déc. 2023 - nov. 2025",
        location: "Abidjan, Côte d'Ivoire · Hybride",
        objective: "Mettre en place une application mobile développée en Flutter avec une base de données MongoDB pour digitaliser les services de l'entreprise.",
        skills: ["Développement de logiciels", "MongoDB", "Flutter"],
    },
    {
        company: "Société JP Consulting",
        role: "Responsable de projet informatique",
        type: "Temps plein",
        period: "janv. 2023 - nov. 2025",
        location: "Abidjan, Côte d'Ivoire · Sur site",
        objective: "Piloter le développement front-end des outils internes et applications métier de l'entreprise sur la stack Laravel.",
        skills: ["Développement front-end", "Laravel"],
    },
    {
        company: "Chaucot Dubost In",
        role: "Développeur Web et Mobile",
        type: "Temps plein",
        period: "oct. 2022 - nov. 2025",
        location: "Abidjan, Côte d'Ivoire · Sur site",
        objective: "Charger du développement des fonctionnalités de l'ERP Konosys, en lien avec les équipes métier pour faire évoluer les modules existants.",
        skills: ["Développement front-end", "Applications web", "ERP Konosys"],
    },
    {
        company: "InovTech Solutions",
        role: "Full-Stack Developer",
        type: "Temps plein",
        period: "2018 - 2020",
        location: "Abidjan, Côte d'Ivoire",
        objective: "Développement d'applications de gestion d'entreprise sur mesure.",
        skills: ["Full-Stack", "Gestion d'entreprise"],
    }
];

export default function PortfolioExperience() {
    const { t } = useTranslation();

    return (
        <section id="experience" className="py-20 px-6 max-w-5xl mx-auto border-t border-border/40">
            <h2 className="text-4xl font-black mb-12 tracking-tight">{t("portfolio.experience.title")}</h2>

            <div className="flex flex-col gap-4">
                {EXPERIENCES.map((exp) => (
                    <div key={`${exp.company}-${exp.role}`} className="flex flex-col gap-2 bg-muted/30 rounded-xl p-4 md:p-5 border border-border/40">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="text-base font-black tracking-tight leading-tight">{exp.role}</h3>
                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{exp.period}</span>
                        </div>
                        <p className="text-xs text-primary font-bold uppercase tracking-wide">
                            {exp.company} · {exp.type}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">{exp.location}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium">
                            {exp.objective}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {exp.skills.map((skill) => (
                                <span key={skill} className="px-2 py-0.5 bg-background rounded-full text-[10px] font-bold border border-border/50 text-muted-foreground">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
