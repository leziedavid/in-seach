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
                {/* Le footer est désormais toujours visible et fixe (fini le glissement en vue
                    déclenché par le scroll) — le contenu réserve donc en permanence l'espace de
                    sa vraie hauteur (--footer-reserved-height) en bas, sinon le footer fixe
                    recouvrirait la fin du contenu. Le "5rem" mobile reste la clearance pour la
                    pilule de nav de Header.tsx (fixed bottom-4 seulement en mobile — en desktop
                    elle est en haut, md:top-6/md:bottom-auto, donc pas de clearance équivalente
                    à ajouter côté desktop). */}
                <main className="flex-1 flex flex-col pt-[4.5rem] md:pt-20 pb-[calc(5rem+var(--footer-reserved-height,60px))] md:pb-[var(--footer-reserved-height,60px)]">
                    {children}
                </main>
                <Footer />
            </div>

        </div>
    );
}