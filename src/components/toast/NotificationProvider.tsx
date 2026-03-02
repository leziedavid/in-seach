"use client";

import { createContext, useContext, useState, ReactNode } from "react";
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
    const showNotification = (message: string, type: NotificationType = "info", duration = 4000) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, duration + 300);
    };
    const addNotification = showNotification;

    return (
        <NotificationContext.Provider value={{ showNotification, addNotification }}>
            {children}
            {notification && (<NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />)}
        </NotificationContext.Provider>
    );
}

/* ================= HOOK ================= */
export const useNotification = () => useContext(NotificationContext);