"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import ComingSoon from "@/components/home/ComingSoon";
import PageTransition from "@/components/ui/PageTransition";
import { NotificationPermissionModal } from "@/components/modals/NotificationPermissionModal";
import { storage } from "@/lib/storage";
import { trackVisit } from "@/lib/visitTracking";
import Sponsoring from "@/components/boost/Sponsoring";
import { useLaunchQueueConsumer } from "@/hooks/useLaunchQueueConsumer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Deep links PWA : route en interne l'URL cible quand l'app installée est relancée
    useLaunchQueueConsumer();

    // [PERF] Nettoie les entrées localStorage expirées au démarrage (1 fois par session)
    useEffect(() => {
        storage.purgeExpired();
    }, []);

    // Enregistre une visite (dédupliquée côté client + serveur) à l'arrivée sur l'accueil
    useEffect(() => {
        if (pathname === "/") {
            trackVisit();
        }
    }, [pathname]);

    // Check if the current route is an admin or portfolio route
    const isIsolatedRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/me");

    return (
        <div className="min-h-screen premium-bg relative overflow-x-hidden">
            <NotificationPermissionModal />
            {isIsolatedRoute ? (
                children
            ) : (
                <ComingSoon>
                    <PageTransition>
                        {children}
                    </PageTransition>
                    {pathname !== "/akwaba" && <Sponsoring />}
                </ComingSoon>
            )}
        </div>
    );
}
