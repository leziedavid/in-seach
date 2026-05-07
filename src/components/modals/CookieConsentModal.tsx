'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export const CookieConsentModal = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if consent was already given
        const consent = localStorage.getItem('cookieConsent');

        if (!consent) {
            // Show after a delay for premium feel
            const timer = setTimeout(() => setIsVisible(true), 2500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'granted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        // We still hide it but maybe with a persistent refusal
        localStorage.setItem('cookieConsent', 'refused');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-6 sm:p-0">
                    {/* Backdrop */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsVisible(false)} className="absolute inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-sm" />

                    {/* Compact iOS Style Modal */}
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }} exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } }} className="relative w-full max-w-[340px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/50 dark:border-zinc-800/50 overflow-hidden"  >
                        <div className="p-8 flex flex-col items-center text-center">

                            {/* Cookie Icon */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative bg-secondary/10 p-5 rounded-[1.5rem] text-secondary">
                                    <Icon icon="solar:cookie-bold-duotone" width={36} />
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                                Respect de la vie privée
                            </h3>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 px-2 font-bold leading-relaxed">
                                Nous utilisons des cookies pour optimiser votre expérience, analyser le trafic et sécuriser vos transactions sur <span className="text-secondary">Djamko</span>.
                                Consultez notre <Link href="/cookies" className="text-primary hover:underline underline-offset-4">Politique Cookies</Link>.
                            </p>

                            {/* Buttons */}
                            <div className="flex w-full flex-col gap-2">
                                <button onClick={handleAccept} className="w-full py-3.5 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-[0.95] hover:opacity-90">
                                    Accepter tout
                                </button>
                                <button onClick={handleDecline} className="w-full py-3.5 px-4 bg-muted/50 text-muted-foreground hover:text-foreground rounded-2xl font-bold text-xs transition-all active:scale-[0.95]">
                                    Continuer sans accepter
                                </button>
                            </div>

                            <div className="mt-6 flex items-center gap-1.5 text-[8px] text-zinc-400 font-black uppercase tracking-widest opacity-60">
                                <Icon icon="solar:shield-check-bold" width={10} />
                                <span>Confidentialité & Sécurité</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
