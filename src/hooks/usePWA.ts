"use client";

import { useState, useEffect } from "react";

export function usePWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

    useEffect(() => {
        // Detect if already installed
        if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
        }

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

        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
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
