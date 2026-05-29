"use client";

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const NotificationPermissionModal = () => {
    const { permission, subscribe } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const isAkwaba = pathname === '/akwaba';
        const hasRefusedTemporarily = sessionStorage.getItem('notificationRefusal') === 'true';

        if (permission === 'default' || (isAkwaba && permission !== 'granted')) {
            if (isAkwaba || !hasRefusedTemporarily) {
                const timer = setTimeout(() => setIsVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [permission, pathname]);

    const handleAccept = async () => {
        await subscribe();
        setIsVisible(false);
    };

    const handleDecline = () => {
        setIsVisible(false);
        sessionStorage.setItem('notificationRefusal', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDecline}
                        className="absolute inset-0 bg-[#0F2944]/30 backdrop-blur-sm"
                    />

                    {/* Spacious Elegant Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: { type: "spring", damping: 25, stiffness: 400 }
                        }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        className="relative w-full max-w-md bg-[#FBFAF6] text-[#0F2944] rounded-3xl sm:rounded-[2rem] shadow-[0_20px_50px_rgba(15,41,68,0.13)] border border-[#EEF1F4] overflow-hidden flex flex-col"
                    >
                        <div className="p-6 sm:p-10 flex flex-col items-center text-center">

                            {/* Modern Notification Icon */}
                            <div className="relative mb-4 sm:mb-6">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] text-primary">
                                    <Icon icon="solar:bell-bing-bold-duotone" className="w-7 h-7 sm:w-9 sm:h-9" />
                                </div>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black text-[#0F2944] mb-2 sm:mb-3 tracking-tight">
                                Notifications
                            </h3>

                            <p className="text-xs sm:text-sm text-[#1F3A5F] mb-6 sm:mb-8 px-1 sm:px-2 leading-relaxed">
                                Restez informé de vos commandes, livraisons et actualités en temps réel pour ne rien manquer.
                            </p>

                            {/* Buttons on one line */}
                            <div className="flex w-full gap-2 sm:gap-3">
                                <button onClick={handleDecline} className="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 bg-[#F2EFE7] text-[#0F2944] rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm transition-all hover:bg-[#E8E2D6] active:scale-[0.98]">
                                    Refuser
                                </button>
                                <button onClick={handleAccept} className="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 bg-primary text-white rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98]">
                                    Autoriser
                                </button>
                            </div>

                            {/* Minimal Secure Label */}
                            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-80">
                                <Icon icon="solar:shield-check-bold" className="w-3 h-3" />
                                <span>Confidentialité garantie</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

