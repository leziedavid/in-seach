"use client";

import { usePWA } from "@/hooks/usePWA";
import { Icon } from "@iconify/react";
import { useState } from "react";
import IOSInstallGuide from "./IOSInstallGuide";

export default function FooterInstallButton() {
    const { deferredPrompt, isInstalled, platform, installApp } = usePWA();
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    // Si déjà installé, on n'affiche rien
    if (isInstalled) return null;

    // Sur iOS, on ne peut pas déclencher le prompt, on montre une aide
    // Sur les autres, on montre le bouton si le prompt est disponible
    const canInstall = platform === "ios" || deferredPrompt;

    if (!canInstall) return null;

    const handleAction = () => {
        if (platform === "ios") {
            setShowIOSInstructions(true);
        } else {
            installApp();
        }
    };

    return (
        <>
            <button
                onClick={handleAction}
                className="flex items-center gap-2 px-4 py-2 mt-2 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group scale-95 hover:scale-100 active:scale-90"
            >
                <Icon
                    icon="solar:download-square-bold-duotone"
                    className="w-5 h-5 group-hover:bounce"
                />
                <span className="text-xs font-black uppercase tracking-wider">
                    Télécharger l'application
                </span>
            </button>

            <IOSInstallGuide open={showIOSInstructions} onClose={() => setShowIOSInstructions(false)} />
        </>
    );
}
