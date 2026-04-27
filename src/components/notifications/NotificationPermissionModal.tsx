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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDecline}
                        className="absolute inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-sm"
                    />

                    {/* Compact iOS Style Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            transition: { type: "spring", damping: 25, stiffness: 400 }
                        }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                        className="relative w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/20 dark:border-zinc-800/50 overflow-hidden"
                    >
                        <div className="p-6 pt-8 flex flex-col items-center text-center">
                            
                            {/* Modern Notification Icon */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative bg-primary/10 p-4 rounded-2xl text-primary">
                                    <Icon icon="solar:bell-bing-bold-duotone" width={32} />
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                                Notifications
                            </h3>
                            
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 px-4 font-bold leading-relaxed">
                                Restez informé de vos commandes, livraisons et actualités en temps réel.
                            </p>

                            {/* Buttons on one line */}
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 py-3 px-4 bg-muted text-muted-foreground hover:text-foreground rounded-xl font-bold text-xs transition-all active:scale-[0.95]"
                                >
                                    Refuser
                                </button>
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-black text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.95]"
                                >
                                    Autoriser
                                </button>
                            </div>

                            {/* Minimal Secure Label */}
                            <div className="mt-6 flex items-center gap-1.5 text-[8px] text-zinc-400 font-bold uppercase tracking-widest opacity-60">
                                <Icon icon="solar:shield-check-bold" width={10} />
                                <span>Confidentialité garantie</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

