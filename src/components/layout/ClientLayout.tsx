"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ComingSoon from "@/components/home/ComingSoon";
import PageTransition from "@/components/ui/PageTransition";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if the current route is an admin route
    const isAdminRoute = pathname?.startsWith("/admin");

    if (isAdminRoute) {
        return <>{children}</>;
    }

    return (
        <ComingSoon>
            <div className="min-h-screen premium-bg overflow-x-hidden">
                <PageTransition>
                    {children}
                </PageTransition>
            </div>
        </ComingSoon>
    );
}
