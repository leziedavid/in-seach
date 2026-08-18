'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

export const CookieConsentModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    // Portail vers document.body : ce composant est monté à l'intérieur du motion.div de
    // PageTransition, qui applique un `transform` Framer Motion — celui-ci crée un nouveau
    // contexte d'empilement pour tout ce qu'il contient, donc son z-[101] ne peut plus
    // l'emporter sur des éléments fixes portés directement sur document.body (SearchInput,
    // etc.), quelle que soit sa valeur. Même contournement que FullScreenOverlayPortal.tsx.
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const [preferences, setPreferences] = useState({
        analytics: true,
        ads: true,
        pixel: true
    });

    useEffect(() => {
        // Check if consent was already given
        const consent = localStorage.getItem('cookieConsent');

        if (!consent) {
            // Show after a delay for premium feel
            const timer = setTimeout(() => setIsVisible(true), 2500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookieConsent', 'granted');
        localStorage.setItem('cookiePreferences', JSON.stringify({ analytics: true, ads: true, pixel: true }));
        setIsVisible(false);
    };

    const handleConfirm = () => {
        localStorage.setItem('cookieConsent', 'custom');
        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        setIsVisible(false);
    };

    const handleDeclineAll = () => {
        localStorage.setItem('cookieConsent', 'refused');
        localStorage.setItem('cookiePreferences', JSON.stringify({ analytics: false, ads: false, pixel: false }));
        setIsVisible(false);
    };

    const togglePreference = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="absolute inset-0 bg-[#0F2944]/30 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } }} 
                        className="relative w-full max-w-2xl bg-[#FBFAF6] dark:bg-zinc-900 text-[#0F2944] dark:text-white rounded-3xl sm:rounded-[2rem] shadow-[0_20px_50px_rgba(15,41,68,0.13)] border border-[#EEF1F4] dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"
                    >
                        <div className="p-5 sm:p-8 flex-1 overflow-y-auto">
                            <h2 className="text-xl sm:text-2xl font-black text-[#0F2944] dark:text-white mb-2 sm:mb-3 tracking-tight">
                                Vos préférences de confidentialité
                            </h2>
                            <p className="text-xs sm:text-sm text-[#1F3A5F] dark:text-zinc-300 mb-5 sm:mb-8 leading-relaxed">
                                Nous utilisons des cookies pour faire fonctionner le site et, avec votre accord, mesurer l'audience et personnaliser les publicités. Choisissez ce que vous acceptez. <Link href="/cookies" className="text-primary hover:underline underline-offset-4 font-medium">Politique cookies</Link> · <Link href="/privacy" className="text-primary hover:underline underline-offset-4 font-medium">Confidentialité</Link>
                            </p>

                            <div className="space-y-2 sm:space-y-3">
                                {/* Essential Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-colors">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-green-500 shadow-sm">
                                            <Icon icon="solar:lock-keyhole-linear" className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Cookies essentiels</h4>
                                            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Connexion, sécurité, session. Indispensables au fonctionnement du site.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                                        <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-primary/10 text-primary whitespace-nowrap">
                                            Toujours actif
                                        </span>
                                    </div>
                                </div>

                                {/* Analytics Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-colors">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm">
                                            <Icon icon="logos:google-analytics" className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Google Analytics</h4>
                                            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Mesure d'audience anonymisée pour comprendre comment vous utilisez le site.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                                        <Switch checked={preferences.analytics} onCheckedChange={() => togglePreference('analytics')} className="scale-75 sm:scale-100 origin-right" />
                                    </div>
                                </div>

                                {/* Ads Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-colors">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm">
                                            <Icon icon="logos:google-icon" className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Google Ads</h4>
                                            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Publicités personnalisées via Google AdSense en fonction de votre navigation.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                                        <Switch checked={preferences.ads} onCheckedChange={() => togglePreference('ads')} className="scale-75 sm:scale-100 origin-right" />
                                    </div>
                                </div>

                                {/* Meta Pixel Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-colors">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm">
                                            <Icon icon="logos:facebook" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Meta Pixel</h4>
                                            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Suivi des conversions et publicités personnalisées sur Facebook et Instagram.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                                        <Switch checked={preferences.pixel} onCheckedChange={() => togglePreference('pixel')} className="scale-75 sm:scale-100 origin-right" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-3 sm:p-6 bg-[#FBFAF6] dark:bg-zinc-900 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 border-t border-[#EEF1F4] dark:border-zinc-800">
                            <button onClick={handleDeclineAll} className="w-full sm:flex-1 py-2.5 sm:py-3.5 px-4 bg-[#F2EFE7] dark:bg-zinc-800 text-[#0F2944] dark:text-white rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm transition-all hover:bg-[#E8E2D6] dark:hover:bg-zinc-700 active:scale-[0.98]">
                                Tout refuser
                            </button>
                            <button onClick={handleConfirm} className="w-full sm:flex-1 py-2.5 sm:py-3.5 px-4 bg-[#0F2944] dark:bg-zinc-700 text-white rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm transition-all hover:opacity-90 active:scale-[0.98]">
                                Confirmer
                            </button>
                            <button onClick={handleAcceptAll} className="w-full sm:flex-1 py-2.5 sm:py-3.5 px-4 bg-primary text-white rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/25">
                                Tout accepter
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
