"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationService } from "@/services/notification.service";
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
                        className="object-cover"
                    />
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

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.4;
            const p = audio.play();
            if (p !== undefined) p.catch(() => {});
        } catch {}
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const unsubscribe = notificationService.onForegroundMessage((payload) => {
            if (payload.notification) {
                const n: WebPushNotification = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: payload.notification.title || "Nouvelle notification",
                    body: payload.notification.body || "",
                    icon: payload.notification.image || "/favicon.png",
                    timestamp: Date.now(),
                };
                setNotifications(prev => [n, ...prev].slice(0, 3));
                playNotificationSound();
                setTimeout(() => removeNotification(n.id), 6000);
            }
        });
        return () => unsubscribe();
    }, [playNotificationSound, removeNotification]);

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
