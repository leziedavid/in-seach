"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ComingSoon({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col justify-between bg-background relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none z-0">
                <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(120,120,120,0.05)_0,transparent_40%),radial-gradient(circle_at_80%_60%,rgba(120,120,120,0.05)_0,transparent_40%)]" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                <Header />
                <main className="flex-1 flex flex-col pt-[4.5rem] md:pt-20 pb-20 md:pb-0">
                    {children}
                    {/* Sentinelle de fin de page — observée par Footer.tsx (IntersectionObserver) : le
                        footer ne s'affiche que lorsqu'on scrolle jusqu'ici, seul SearchInput est visible
                        par défaut. Réserve l'espace de SearchInput (+ marge pour les tabs/icônes juste
                        au-dessus) en permanence, et celui du footer (--footer-reserved-height, toujours
                        sa vraie hauteur que le footer soit affiché ou non) pour qu'il ait la place de se
                        révéler sans jamais recouvrir le contenu réel. */}
                    <div id="page-end-sentinel" aria-hidden style={{ height: "calc(var(--footer-reserved-height, 60px) + var(--searchinput-height, 0px) + 3rem)" }} />
                </main>
                <Footer />
            </div>

        </div>
    );
}