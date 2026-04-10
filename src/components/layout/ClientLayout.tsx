"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ComingSoon from "@/components/home/ComingSoon";
import PageTransition from "@/components/ui/PageTransition";
import { NotificationPermissionModal } from "@/components/notifications/NotificationPermissionModal";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if the current route is an admin route
    const isAdminRoute = pathname?.startsWith("/admin");

    return (
        <div className="min-h-screen premium-bg relative overflow-x-hidden">
            <NotificationPermissionModal />
            {isAdminRoute ? (
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
