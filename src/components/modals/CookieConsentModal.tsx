'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

export const CookieConsentModal = () => {
    const [isVisible, setIsVisible] = useState(false);
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

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-[2px]" 
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } }} 
                        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
                                Vos préférences de confidentialité
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                                Nous utilisons des cookies pour faire fonctionner le site et, avec votre accord, mesurer l'audience et personnaliser les publicités. Choisissez ce que vous acceptez. <Link href="/cookies" className="text-primary hover:underline underline-offset-4 font-medium">Politique cookies</Link> · <Link href="/privacy" className="text-primary hover:underline underline-offset-4 font-medium">Confidentialité</Link>
                            </p>

                            <div className="space-y-3">
                                {/* Essential Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-green-500 shadow-sm">
                                            <Icon icon="solar:lock-keyhole-linear" width={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Cookies essentiels</h4>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Connexion, sécurité, session. Indispensables au fonctionnement du site.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary whitespace-nowrap">
                                            Toujours actif
                                        </span>
                                    </div>
                                </div>

                                {/* Analytics Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm">
                                            <Icon icon="logos:google-analytics" width={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Google Analytics</h4>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Mesure d'audience anonymisée pour comprendre comment vous utilisez le site.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                                        <Switch checked={preferences.analytics} onCheckedChange={() => togglePreference('analytics')} />
                                    </div>
                                </div>

                                {/* Ads Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm">
                                            <Icon icon="logos:google-icon" width={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Google Ads</h4>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Publicités personnalisées via Google AdSense en fonction de votre navigation.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                                        <Switch checked={preferences.ads} onCheckedChange={() => togglePreference('ads')} />
                                    </div>
                                </div>

                                {/* Meta Pixel Cookies */}
                                <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm">
                                            <Icon icon="logos:facebook" width={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Meta Pixel</h4>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Suivi des conversions et publicités personnalisées sur Facebook et Instagram.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                                        <Switch checked={preferences.pixel} onCheckedChange={() => togglePreference('pixel')} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-center gap-3">
                            <button onClick={handleDeclineAll} className="w-full sm:flex-1 py-3.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-[14px] font-bold text-sm transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98]">
                                Tout refuser
                            </button>
                            <button onClick={handleConfirm} className="w-full sm:flex-1 py-3.5 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[14px] font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]">
                                Confirmer
                            </button>
                            <button onClick={handleAcceptAll} className="w-full sm:flex-1 py-3.5 px-4 bg-primary text-white rounded-[14px] font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/25">
                                Tout accepter
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
