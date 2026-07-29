"use client";

import { useState, useEffect } from "react";

// Extrait pour être réutilisable hors composant (ex: src/lib/visitTracking.ts)
export function isPWAStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

export function usePWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    // Initialisation paresseuse : évalué dès le premier rendu (pas seulement après montage),
    // pour qu'un consumer comme usePullToRefresh({ enabled: isInstalled }) soit correct
    // immédiatement au lieu d'attendre un cycle de useEffect.
    const [isInstalled, setIsInstalled] = useState(() => isPWAStandalone());
    const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

    useEffect(() => {
        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform("ios");
        } else if (/android/.test(userAgent)) {
            setPlatform("android");
        } else {
            setPlatform("desktop");
        }

        // Capture install prompt for non-iOS devices
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        const handleInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", handleInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", handleInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
        }
    };

    return { deferredPrompt, isInstalled, platform, installApp };
}
