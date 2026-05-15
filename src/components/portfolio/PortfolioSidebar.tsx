"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Link from "next/link";

const SECTIONS = [
    { label: "Introduction", href: "#hero", icon: "solar:user-bold" },
    { label: "Work Experience", href: "#experience", icon: "solar:case-minimalistic-bold" },
    { label: "Technical skills", href: "#expertise", icon: "solar:code-bold" },
    { label: "Projects", href: "#projects", icon: "solar:folder-bold" },
];

export default function PortfolioSidebar() {
    return (
        <aside className="hidden lg:flex flex-col fixed left-12 top-1/2 -translate-y-1/2 z-50 gap-8">
            <div className="flex flex-col gap-6 border-l border-border/40 pl-6">
                {SECTIONS.map((section) => (
                    <Link 
                        key={section.href} 
                        href={section.href}
                        className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <div className="w-1 h-1 bg-border group-hover:bg-primary transition-colors" />
                        <span className="text-xs font-medium tracking-tight uppercase">{section.label}</span>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
