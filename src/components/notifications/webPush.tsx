"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationService } from "@/services/notification.service";
import { shouldDisplayNotification } from "@/lib/notificationDedup";
import Image from "next/image";

interface WebPushNotification { id: string; title: string; body: string; icon?: string; timestamp: number; }

const WebPushToast = ({ notification, onClose }: { notification: WebPushNotification; onClose: (id: string) => void; }) => {
    return (
        <motion.div
            layout
            initial={{ y: -80, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
            className="pointer-events-auto relative w-full overflow-hidden"
            style={{
                borderRadius: 14,
                background: "rgba(235, 235, 240, 0.88)",
                border: "0.5px solid rgba(255,255,255,0.8)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.7)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
            }}
        >
            <div className="flex items-start gap-3 px-4 py-3">
                {/* App icon — style iOS arrondi */}
                <div className="relative shrink-0 w-12 h-12 rounded-[12px] overflow-hidden shadow-sm mt-0.5">
                    <Image
                        src={notification.icon || "/icons/pwa/apple-touch-icon.png"}
                        alt="App"
                        fill
                        className="object-cover" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Titre + horodatage */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-zinc-800 truncate leading-tight">
                            {notification.title}
                        </span>
                        <span className="text-[11px] text-zinc-400 shrink-0 font-normal">
                            maintenant
                        </span>
                    </div>
                    {/* Corps */}
                    <p className="text-[13px] text-zinc-600 leading-snug line-clamp-2 font-normal">
                        {notification.body}
                    </p>
                </div>

                {/* Bouton close */}
                <button
                    onClick={() => onClose(notification.id)}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 transition-colors"
                    style={{ background: "rgba(0,0,0,0.12)" }}
                    aria-label="Fermer"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="#3a3a3c" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                </button>
            </div>
            {/* Barre de durée discrète */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 3,
                    background: "#1D4ED8",
                    opacity: 0.3,
                    borderRadius: "0 0 0 14px",
                }}
            />
        </motion.div>
    );
};

export const WebPushManager = () => {
    const [notifications, setNotifications] = useState<WebPushNotification[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Notification système native (via le service worker), même quand l'app est au premier plan :
    // c'est ce qui la fait ressembler à WhatsApp/Messenger (bandeau OS) plutôt qu'à un simple toast
    // interne au site. Bonus : le son de notification est géré par l'OS, donc il joue même sur
    // mobile — contrairement à un <audio> déclenché en JS, bloqué par les restrictions d'autoplay.
    const showNativeNotification = useCallback(async (title: string, body: string, icon: string, data?: any) => {
        if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return false;
        if (!("serviceWorker" in navigator)) return false;
        try {
            // pushOptions (envois admin riches — voir PushNotificationModal/backend WebPush.ts) est
            // transporté en JSON stringifié dans data (contrainte FCM). Absent pour les notifications
            // classiques (booking/order/chat...), qui gardent le rendu d'avant cette extension.
            let pushOptions: Record<string, any> = {};
            try {
                if (data?.pushOptions) pushOptions = JSON.parse(data.pushOptions);
            } catch {
                // JSON invalide : on ignore silencieusement, la notif garde son rendu par défaut.
            }

            const registration = await navigator.serviceWorker.ready;
            // `image`/`renotify`/`vibrate`/`timestamp` sont des NotificationOptions standard côté
            // navigateur mais absents du lib.dom.d.ts de TypeScript — cast ciblé, sans `any`.
            const options: NotificationOptions & { image?: string; renotify?: boolean; timestamp?: number; vibrate?: number[] } = {
                body,
                icon: pushOptions.icon || icon,
                badge: pushOptions.badge || icon,
                image: pushOptions.image,
                tag: pushOptions.tag,
                lang: pushOptions.lang,
                dir: pushOptions.dir,
                vibrate: pushOptions.vibrate,
                requireInteraction: pushOptions.requireInteraction,
                renotify: pushOptions.renotify,
                timestamp: pushOptions.timestamp,
                data,
                silent: pushOptions.silent ?? false,
            };
            await registration.showNotification(title, options);
            return true;
        } catch (err) {
            console.error("[WebPushManager] Failed to show native notification:", err);
            return false;
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const unsubscribe = notificationService.onForegroundMessage(async (payload) => {
            if (payload.notification) {
                const title = payload.notification.title || "Nouvelle notification";
                const body = payload.notification.body || "";
                // Même évènement potentiellement déjà affiché via le WebSocket (voir SocketProvider.tsx) : dédup par contenu
                if (!shouldDisplayNotification(`${title}|${body}`)) return;

                const icon = payload.notification.image || "/icons/pwa/icon-192.png";
                const shownNatively = await showNativeNotification(title, body, icon, payload.data);

                // Repli sur le toast interne uniquement si la notification système n'a pas pu s'afficher
                // (permission non accordée / pas de service worker) — évite le doublon toast + bandeau OS.
                if (!shownNatively) {
                    const n: WebPushNotification = {
                        id: Math.random().toString(36).substr(2, 9),
                        title,
                        body,
                        icon,
                        timestamp: Date.now(),
                    };
                    setNotifications(prev => [n, ...prev].slice(0, 3));
                    setTimeout(() => removeNotification(n.id), 6000);
                }
            }
        });
        return () => unsubscribe();
    }, [showNativeNotification, removeNotification]);

    if (!mounted) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-[360px] px-4 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map(n => (
                    <WebPushToast key={n.id} notification={n} onClose={removeNotification} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default WebPushManager;
