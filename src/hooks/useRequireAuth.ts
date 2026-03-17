"use client";

import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useNotification } from "@/components/toast/NotificationProvider";

/**
 * Hook to handle actions that require authentication.
 * Mimics the behavior found in ProductDetailModal.tsx.
 */
export function useRequireAuth() {
    const router = useRouter();
    const { addNotification } = useNotification();

    /**
     * Executes the provided action if the user is authenticated.
     * Otherwise, shows a notification and redirects to the login page.
     * 
     * @param action - The function to execute if authenticated
     * @param message - Custom notification message (optional)
     */
    const withAuth = (action: () => void, message = "Veuillez vous connecter pour continuer") => {
        if (!isAuthenticated()) {
            addNotification(message, "error");
            // Store current path to redirect back after login if needed
            const currentPath = window.location.pathname + window.location.search;
            router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
            return;
        }
        action();
    };

    return { withAuth };
}
