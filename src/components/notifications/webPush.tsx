"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { notificationService } from "@/services/notification.service";
import Image from "next/image";

/* ================= TYPES ================= */
interface WebPushNotification { id: string; title: string; body: string; icon?: string; timestamp: number; }

/* ================= COMPONENT: TOAST ================= */
const WebPushToast = ({ notification, onClose }: { notification: WebPushNotification; onClose: (id: string) => void; }) => {
    return (
        <motion.div layout initial={{ x: 400, opacity: 0, scale: 0.9 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: 400, opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="group pointer-events-auto relative flex w-full max-w-[380px] overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/80">
            {/* Glassmorphism gradient effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="flex w-full items-start gap-4">
                {/* App Icon */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#b07b5e]/20 to-[#b07b5e]/40 p-0.5 shadow-inner">
                    <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-white dark:bg-zinc-800">
                        <Image src={notification.icon || "/favicon.png"} alt="Logo" fill className="object-cover p-1.5" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 pr-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#b07b5e]">
                            Notification
                        </span>
                        <span className="text-[9px] font-medium text-zinc-400">
                            À l'instant
                        </span>
                    </div>
                    <h3 className="line-clamp-1 text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                        {notification.title}
                    </h3>
                    <p className="line-clamp-2 text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {notification.body}
                    </p>
                </div>

                {/* Close Button */}
                <button onClick={() => onClose(notification.id)} className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 opacity-0 transition-all hover:bg-zinc-200 hover:text-zinc-600 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300">
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Progress bar (auto-dismiss) */}
            <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 6, ease: "linear" }} className="absolute bottom-0 left-0 h-0.5 bg-[#b07b5e]/40" />
        </motion.div>
    );
};

/* ================= COMPONENT: LISTENER / MANAGER ================= */
export const WebPushManager = () => {
    const [notifications, setNotifications] = useState<WebPushNotification[]>([]);

    // Play sound helper
    const playNotificationSound = useCallback(() => {
        try {
            // Using a clean, professional notification sound from an optimized source
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.4;

            // Handle browser restriction: play only if user has interacted or fallback gracefully
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio autoplay prevented or failed:", error);
                });
            }
        } catch (e) {
            console.error("Error playing notification sound:", e);
        }
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Subscribe to FCM foreground messages
        const unsubscribe = notificationService.onForegroundMessage((payload) => {
            console.log("WebPushManager: Received message", payload);

            if (payload.notification) {
                const newNotification: WebPushNotification = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: payload.notification.title || "Nouvelle notification",
                    body: payload.notification.body || "",
                    icon: payload.notification.image || "/favicon.png",
                    timestamp: Date.now()
                };

                setNotifications(prev => [newNotification, ...prev].slice(0, 3)); // Keep last 3
                playNotificationSound();

                // Auto remove after 6 seconds
                setTimeout(() => {
                    removeNotification(newNotification.id);
                }, 6000);
            }
        });

        return () => unsubscribe();
    }, [playNotificationSound, removeNotification]);

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 w-full max-w-[400px] pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map(notification => (
                    <WebPushToast key={notification.id} notification={notification} onClose={removeNotification} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default WebPushManager;
