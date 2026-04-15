"use client";

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const NotificationPermissionModal = () => {
    const { permission, subscribe } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Afficher si la permission n'est pas encore demandée
        // OU si on est sur la page akwaba et que ce n'est pas accordé
        const isAkwaba = pathname === '/akwaba';
        const hasRefusedTemporarily = sessionStorage.getItem('notificationRefusal') === 'true';

        if (permission === 'default' || (isAkwaba && permission !== 'granted')) {
            // Ignorer le refus temporaire si on est sur akwaba
            if (isAkwaba || !hasRefusedTemporarily) {
                const timer = setTimeout(() => setIsVisible(true), 2000);
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop / Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDecline}
                        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, y: "15%", scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            transition: {
                                type: "spring",
                                damping: 25,
                                stiffness: 350
                            }
                        }}
                        exit={{ 
                            opacity: 0, 
                            y: "15%", 
                            scale: 0.95,
                            transition: {
                                duration: 0.2,
                                ease: "easeInOut"
                            }
                        }}
                        className="relative w-full max-w-[400px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-white/40 dark:border-zinc-800/40 overflow-hidden"
                    >
                        <div className="p-8 pt-10">
                            {/* Close Button Top Right */}
                            <button 
                                onClick={handleDecline}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors text-zinc-400"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                {/* Icon with Glow */}
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                                    <div className="relative bg-gradient-to-br from-amber-400 to-orange-600 p-5 rounded-[1.75rem] text-white shadow-xl shadow-amber-500/20">
                                        <Bell className="w-8 h-8" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
                                    Ne manquez rien
                                </h3>
                                
                                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-9 px-2 font-medium leading-relaxed">
                                    Activez les alertes en temps réel pour vos réservations, commandes et livraisons.
                                </p>

                                <div className="w-full space-y-3">
                                    <button
                                        onClick={handleAccept}
                                        className="w-full py-4 px-6 bg-[#1c2035] dark:bg-white text-white dark:text-[#1c2035] rounded-2xl font-black text-sm tracking-tight transition-all active:scale-[0.97] hover:shadow-xl hover:shadow-zinc-500/10"
                                    >
                                        Autoriser les notifications
                                    </button>
                                    
                                    <button
                                        onClick={handleDecline}
                                        className="w-full py-3.5 px-6 bg-transparent text-zinc-500 dark:text-zinc-400 rounded-2xl font-bold text-xs tracking-tight hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                                    >
                                        Pas maintenant
                                    </button>
                                </div>

                                <div className="mt-8 flex items-center justify-center gap-2 text-[9px] text-zinc-400 font-bold uppercase tracking-[0.15em] opacity-60">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Sécurisé & Réglable par la suite</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
