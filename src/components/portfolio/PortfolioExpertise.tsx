"use client";

import React from "react";
import { Icon } from "@iconify/react";

const SKILLS = [
    { name: "Java", icon: "logos:java" },
    { name: "Spring Boot", icon: "logos:spring-icon" },
    { name: "Python", icon: "logos:python" },

    { name: "Nest.js", icon: "logos:nestjs" },
    { name: "Next.js", icon: "logos:nextjs-icon" },
    { name: "React.js", icon: "logos:rea@ct" },
    { name: "Node.js", icon: "logos:nodejs-icon" },
    { name: "TypeScript", icon: "logos:typescript-icon" },
    { name: "Flutter", icon: "logos:flutter" },
    { name: "React Native", icon: "logos:react" },
    { name: "PostgreSQL", icon: "logos:postgresql" },
    { name: "MongoDB", icon: "logos:mongodb-icon" },
    { name: "Redis", icon: "logos:redis" },
    { name: "Docker", icon: "logos:docker-icon" },
    { name: "Git", icon: "logos:git-icon" },
];

export default function PortfolioExpertise() {
    return (
        <section id="expertise" className="py-20 px-6 max-w-5xl mx-auto border-t border-border/40">
            <h2 className="text-4xl font-black mb-12 tracking-tight">Compétences techniques</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {SKILLS.map((skill) => (
                    <div key={skill.name} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center p-2 group-hover:bg-primary/5 transition-colors">
                            <Icon icon={skill.icon} className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" />
                        </div>
                        <span className="text-sm font-bold tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">{skill.name}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
