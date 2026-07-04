"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useWebPushNotifs } from "@/hooks/useWebPushNotifs";
import { WebPushNotif } from "@/types/interface";

// Même logique de résolution d'URL que public/firebase-messaging-sw.js (notificationclick),
// pour que cliquer une notification ici ou depuis une notification système mène au même endroit.
function resolveNotificationUrl(data?: Record<string, any> | null): string | null {
    if (!data) return null;
    if (data.entityType === "Booking" && data.entityId) return `/bookings/${data.entityId}`;
    if (data.entityType === "Order" && data.entityId) return `/orders/${data.entityId}`;
    if (data.entityType === "Delivery" && data.code) return `/logistics/tracking/${data.code}`;
    return null;
}

interface NotificationBellProps {
    className?: string;
    iconClassName?: string;
}

export default function NotificationBell({ className, iconClassName }: NotificationBellProps) {
    const { notifications, count, markAsRead, refresh } = useWebPushNotifs();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleToggle = () => {
        setOpen((prev) => {
            if (!prev) refresh();
            return !prev;
        });
    };

    const handleClickNotif = (notif: WebPushNotif) => {
        const url = resolveNotificationUrl(notif.data);
        markAsRead(notif.id);
        setOpen(false);
        if (url) router.push(url);
    };

    return (
        <div className={`relative ${className ?? ""}`}>
            <button
                onClick={handleToggle}
                className="relative bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 flex items-center justify-center"
                aria-label="Notifications"
            >
                <Icon icon="solar:bell-bing-bold-duotone" className={iconClassName ?? "text-white w-5 h-5"} />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900">
                        {count > 9 ? "9+" : count}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Click-catcher invisible pour fermer au clic extérieur */}
                        <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            transition={{ type: "spring", damping: 24, stiffness: 300 }}
                            className="absolute right-0 top-full mt-3 z-[200] w-[85vw] max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                                <h3 className="font-black text-sm text-foreground">Notifications</h3>
                                {count > 0 && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {count} non lue{count > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="px-5 py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                        <Icon icon="solar:bell-off-bold-duotone" className="w-8 h-8 opacity-40" />
                                        Aucune nouvelle notification
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleClickNotif(notif)}
                                            className="w-full text-left px-5 py-3.5 flex items-start gap-3 border-b border-border/20 last:border-0 bg-primary/5 hover:bg-primary/10 transition-colors"
                                        >
                                            <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-primary" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-foreground truncate">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>
                                                <p className="text-[10px] text-muted-foreground/70 mt-1 font-bold uppercase tracking-wide">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
