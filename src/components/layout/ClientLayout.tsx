"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ComingSoon from "@/components/home/ComingSoon";
import PageTransition from "@/components/ui/PageTransition";
import { NotificationPermissionModal } from "@/components/modals/NotificationPermissionModal";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

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
                </ComingSoon>
            )}
        </div>
    );
}
