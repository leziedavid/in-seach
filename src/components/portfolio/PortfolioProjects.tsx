"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";

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
    return (
        <section id="projects" className="py-20 px-6 max-w-5xl mx-auto border-t border-border/40">
            <h2 className="text-4xl font-black mb-12 tracking-tight">Projets</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {PROJECTS.map((project) => (
                    <a
                        key={project.title}
                        href={project.link}
                        className="group flex flex-col gap-4"
                    >
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/50 shadow-sm transition-all group-hover:shadow-xl">
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight">{project.title}</h3>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{project.category}</p>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
