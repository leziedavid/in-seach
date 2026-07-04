"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyActiveWebPushNotifs, markWebPushNotifAsRead } from "@/api/api";
import { getUserId } from "@/lib/auth";
import { WebPushNotif } from "@/types/interface";

// Notifications WebPush non lues (PENDING/SENT) de l'utilisateur connecté.
// Pas de canal temps réel dédié côté backend pour l'instant (voir WebPush.createAndSend) :
// on rafraîchit au montage et à chaque ouverture du dropdown (voir refresh()).
export function useWebPushNotifs() {
    const [notifications, setNotifications] = useState<WebPushNotif[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!getUserId()) {
            setLoading(false);
            return;
        }
        try {
            const res = await getMyActiveWebPushNotifs();
            if (res.statusCode === 200 && res.data) {
                setNotifications(res.data.notifications);
                setCount(res.data.count);
            }
        } catch (err) {
            console.error("Error fetching WebPush notifications:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const markAsRead = useCallback(async (id: string) => {
        // Mise à jour optimiste : la notification disparaît immédiatement de la liste active
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setCount((prev) => Math.max(0, prev - 1));
        try {
            await markWebPushNotifAsRead(id);
        } catch (err) {
            console.error("Error marking WebPush notification as read:", err);
        }
    }, []);

    return { notifications, count, loading, markAsRead, refresh };
}
