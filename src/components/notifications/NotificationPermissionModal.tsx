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
        // On pourrait stocker le refus temporaire dans le sessionStorage
        sessionStorage.setItem('notificationRefusal', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl text-amber-600 dark:text-amber-400">
                            <Bell className="w-6 h-6" />
                        </div>
                        <button 
                            onClick={handleDecline}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                        Ne manquez rien !
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                        Activez les notifications pour recevoir des alertes en temps réel sur vos réservations, commandes et suivis de livraison.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleAccept}
                            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-amber-600/20 active:scale-[0.98]"
                        >
                            Autoriser les notifications
                        </button>
                        <button
                            onClick={handleDecline}
                            className="w-full py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
                        >
                            Plus tard
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Sécurisé & Désactivable à tout moment</span>
                    </div>
                </div>
                
                {/* Visual Accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-600" />
            </motion.div>
        </AnimatePresence>
    );
};
