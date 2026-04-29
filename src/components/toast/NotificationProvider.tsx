"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";
import NotificationToast, { NotificationType } from "./NotificationToast";

/* ================= CONTEXT TYPE ================= */
interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType, duration?: number) => void;
    addNotification: (message: string, type?: NotificationType, duration?: number) => void;
}
/* ================= CONTEXT ================= */
const NotificationContext = createContext<NotificationContextType>({
    showNotification: () => { },
    addNotification: () => { },
});

/* ================= PROVIDER ================= */
export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notification, setNotification] = useState<{ message: string; type: NotificationType; } | null>(null);

    const showNotification = useCallback((message: string, type: NotificationType = "info", duration = 4000) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, duration + 300);
    }, []);

    const addNotification = showNotification;

    const value = useMemo(() => ({
        showNotification,
        addNotification
    }), [showNotification, addNotification]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {notification && (<NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />)}
        </NotificationContext.Provider>
    );
}

/* ================= HOOK ================= */
export const useNotification = () => useContext(NotificationContext);