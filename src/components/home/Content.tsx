"use client";

import { Icon } from "@iconify/react";
import AppTabs from "./AppTabs";
import ThemeImage from "./ThemeImage";

export default function Content() {


    const steps = [
        { icon: <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5 text-primary" />, title: "Explorez", desc: "Trouvez l'expert ou le produit idéal" },
        { icon: <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5 text-primary" />, title: "Sélectionnez", desc: "Comparez les meilleures offres" },
        { icon: <Icon icon="solar:lock-bold-duotone" className="w-5 h-5 text-primary" />, title: "Réservez", desc: "Transaction sécurisée et garantie" },
    ];

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-10">

            {/* IMAGE ANIMÉE DYNAMIQUE */}
            <div className="flex justify-center items-center w-full mb-2 md:mb-3 z-10">
                <ThemeImage lightSrc="/hero.webp" darkSrc="/homepage-hero-animation-lf.avif" alt="Recherche intelligente" width={140} height={10} className="w-full max-w-xl" priority />
            </div>

            <AppTabs />

        </div>
    );
}