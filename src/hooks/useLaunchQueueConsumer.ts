"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Consomme la Launch Handler API (`window.launchQueue`) : quand la PWA installée
 * est relancée (ex: clic sur un lien https://www.djamko.com/... depuis WhatsApp,
 * SMS, etc. pendant qu'elle tourne déjà), le navigateur transmet l'URL cible ici
 * plutôt que d'ouvrir une nouvelle fenêtre/onglet. On route alors côté client,
 * sans rechargement complet de page.
 *
 * Complète `launch_handler.client_mode: "navigate-existing"` du manifest —
 * ce hook garantit une navigation SPA fluide même quand le navigateur ne
 * déclenche pas de navigation automatique de son côté.
 * Ne fait rien si l'API n'est pas supportée (feature detection).
 */
export function useLaunchQueueConsumer() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === "undefined" || !("launchQueue" in window)) return;

        (window as any).launchQueue.setConsumer((launchParams: { targetURL?: string }) => {
            if (!launchParams?.targetURL) return;

            try {
                const url = new URL(launchParams.targetURL);
                router.push(`${url.pathname}${url.search}${url.hash}`);
            } catch {
                // targetURL invalide — on ignore silencieusement
            }
        });
    }, [router]);
}
