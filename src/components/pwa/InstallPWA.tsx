"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import IOSInstallGuide from "./IOSInstallGuide";

export default function InstallPWA() {
    const { deferredPrompt, isInstalled, platform, installApp } = usePWA();
    const [show, setShow] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    // Portail vers document.body : ce composant est monté à l'intérieur du motion.div de
    // PageTransition, qui applique un `transform` Framer Motion — celui-ci crée un nouveau
    // contexte d'empilement pour tout ce qu'il contient, donc son z-[100] ne peut plus
    // l'emporter sur des éléments fixes portés directement sur document.body (SearchInput,
    // etc.), quelle que soit sa valeur. Même contournement que FullScreenOverlayPortal.tsx.
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        // Check if we should show the prompt
        const lastPrompt = localStorage.getItem("pwa-prompt-last-shown");
        const now = Date.now();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

        const shouldShowForPlatform = platform === "ios" || deferredPrompt;

        // Le rappel ne concerne que l'installation : une fois l'app installée (isInstalled),
        // il n'y a plus rien à installer et le rappel disparaît définitivement pour cette session.
        if (!isInstalled && shouldShowForPlatform) {
            if (!lastPrompt || now - parseInt(lastPrompt) > sevenDaysInMs) {
                // Delay slightly for better UX, but not too much
                const timer = setTimeout(() => {
                    setShow(true);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [deferredPrompt, isInstalled, platform]);

    const handleLater = () => {
        localStorage.setItem("pwa-prompt-last-shown", Date.now().toString());
        setShow(false);
    };

    const handleInstall = () => {
        if (platform === "ios") {
            setShowIOSGuide(true);
            return;
        }
        installApp();
        setShow(false);
    };

    if (!mounted) return null;

    return createPortal(
        <>
            <AnimatePresence>
                {show && (
                    <motion.div initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                        }
                    }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2 } }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[100] p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/50 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                <Icon icon="solar:download-square-bold-duotone" className="w-10 h-10" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-foreground">Installer l'application</h3>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Installez l'application pour accéder plus rapidement à nos services et rester connecté à tout moment.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full pt-2">
                                <Button variant="outline" onClick={handleLater} className="flex-1 rounded-2xl font-bold py-6">
                                    Plus tard
                                </Button>
                                <Button onClick={handleInstall} className="flex-1 rounded-2xl font-black py-6 shadow-lg shadow-primary/20">
                                    Installer
                                </Button>
                            </div>
                        </div>

                        <Button variant="ghost" size="icon-xs" onClick={handleLater} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500">
                            <Icon icon="solar:close-bold" className="w-5 h-5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {platform === "ios" && (
                <IOSInstallGuide
                    open={showIOSGuide}
                    onClose={() => { setShowIOSGuide(false); setShow(false); }}
                    startAt="wizard"
                />
            )}
        </>,
        document.body
    );
}
