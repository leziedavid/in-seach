"use client";

import { usePWA } from "@/hooks/usePWA";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";

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

            {/* Modal d'instructions simplifié pour iOS */}
            <AnimatePresence>
                {showIOSInstructions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                        onClick={() => setShowIOSInstructions(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-card border border-border p-6 rounded-[2.5rem] shadow-2xl max-w-xs w-full text-center space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                                <Icon icon="solar:iphone-bold-duotone" className="w-10 h-10" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Installation iOS</h3>
                            <div className="space-y-3 text-sm text-muted-foreground font-medium">
                                <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl">
                                    <Icon icon="solar:share-bold-duotone" className="w-6 h-6 text-primary" />
                                    <p className="text-left leading-tight">
                                        Appuyez sur le bouton <span className="font-bold text-foreground italic">Partager</span> dans votre navigateur.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl">
                                    <Icon icon="solar:add-square-bold-duotone" className="w-6 h-6 text-primary" />
                                    <p className="text-left leading-tight">
                                        Sélectionnez <span className="font-bold text-foreground italic">Sur l'écran d'accueil</span>.
                                    </p>
                                </div>
                            </div>
                            <Button
                                className="w-full rounded-2xl py-6 font-black uppercase tracking-widest"
                                onClick={() => setShowIOSInstructions(false)}
                            >
                                J'ai compris
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
