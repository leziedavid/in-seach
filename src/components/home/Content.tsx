"use client";

import { Icon } from "@iconify/react";
import AppTabs from "./AppTabs";
import Image from "next/image";

export default function Content() {


    const steps = [
        { icon: <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5 text-primary" />, title: "Recherchez", desc: "Trouvez l'expert idéal" },
        { icon: <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5 text-primary" />, title: "Choisissez", desc: "Consultez les devis" },
        { icon: <Icon icon="solar:lock-bold-duotone" className="w-5 h-5 text-primary" />, title: "Réservez", desc: "Paiement sécurisé" },
    ];

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-12">


            {/* IMAGE ANIMÉE */}
            <div className="flex justify-center items-center w-full mb-4 md:mb-6">
                <Image src="/homepage-hero-animation-lf.avif" alt="Recherche intelligente" width={140} height={10} className="w-140 h-full object-contain" priority unoptimized />
            </div>

            <AppTabs />

            {/* Workflow Badge */}
            <div className={`mb-6 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2 transition-all duration-500`}>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] uppercase font-black tracking-[0.2em] text-primary">Comment ça marche ?</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center p-6 bg-card/40 backdrop-blur-sm rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-card shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {step.icon}
                        </div>
                        <h4 className="font-bold text-foreground mb-1 text-center">{step.title}</h4>
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest text-center">{step.desc}</p>
                    </div>
                ))}
            </div>



        </div>
    );
}