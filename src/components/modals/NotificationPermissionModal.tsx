"use client";

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const NotificationPermissionModal = () => {
    const { showModal, dismissModal, subscribe, isPushSupported, lastError } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));
        }
    }, []);

    useEffect(() => {
        if (showModal) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [showModal]);

    const handleAccept = async () => {
        setIsSubscribing(true);
        try {
            const success = await subscribe();
            if (success) {
                toast.success("Notifications activées !");
                setIsVisible(false);
            } else {
                // Avant : en cas d'échec, rien ne s'affichait — la modale restait plantée sans
                // aucun retour. On affiche désormais la vraie raison (voir useNotifications.lastError).
                toast.error(lastError || "Impossible d'activer les notifications.");
            }
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleDecline = () => {
        setIsVisible(false);
        dismissModal();
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
                                    <Icon 
                                        icon={isPushSupported ? "solar:bell-bing-bold-duotone" : "solar:iphone-bold-duotone"} 
                                        className="w-7 h-7 sm:w-9 sm:h-9" 
                                    />
                                </div>
                            </div>

                            {isPushSupported ? (
                                <>
                                    <h3 className="text-xl sm:text-2xl font-black text-[#0F2944] mb-2 sm:mb-3 tracking-tight">
                                        Notifications
                                    </h3>

                                    <p className="text-xs sm:text-sm text-[#1F3A5F] mb-6 sm:mb-8 px-1 sm:px-2 leading-relaxed">
                                        Restez informé de vos commandes, livraisons et actualités en temps réel pour ne rien manquer.
                                    </p>

                                    {/* Buttons on one line */}
                                    <div className="flex w-full gap-2 sm:gap-3">
                                        <button onClick={handleDecline} disabled={isSubscribing} className="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 bg-[#F2EFE7] text-[#0F2944] rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm transition-all hover:bg-[#E8E2D6] active:scale-[0.98] disabled:opacity-50">
                                            Refuser
                                        </button>
                                        <button onClick={handleAccept} disabled={isSubscribing} className="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-4 bg-primary text-white rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
                                            {isSubscribing && <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" />}
                                            Autoriser
                                        </button>
                                    </div>
                                </>
                            ) : isIOS ? (
                                <>
                                    <h3 className="text-xl sm:text-2xl font-black text-[#0F2944] mb-2 sm:mb-3 tracking-tight">
                                        Installer l'application
                                    </h3>

                                    <p className="text-xs sm:text-sm text-[#1F3A5F] mb-4 px-1 sm:px-2 leading-relaxed">
                                        Sur iOS, les notifications nécessitent que l'application soit ajoutée à votre écran d'accueil.
                                    </p>

                                    {/* Interactive instruction steps */}
                                    <div className="w-full text-left bg-[#F2EFE7]/50 rounded-2xl p-4 mb-6 space-y-3 border border-[#EEF1F4]">
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold mt-0.5 shrink-0">1</div>
                                            <div className="text-xs text-[#1F3A5F] font-bold flex items-center gap-1 flex-wrap">
                                                Appuyez sur le bouton Partager 
                                                <Icon icon="solar:share-bold" className="w-4 h-4 inline text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold mt-0.5 shrink-0">2</div>
                                            <div className="text-xs text-[#1F3A5F] font-bold flex items-center gap-1 flex-wrap">
                                                Sélectionnez "Sur l'écran d'accueil"
                                                <Icon icon="solar:add-square-bold" className="w-4 h-4 inline text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold mt-0.5 shrink-0">3</div>
                                            <p className="text-xs text-[#1F3A5F] font-bold">
                                                Lancez l'application depuis votre écran d'accueil pour activer les notifications.
                                            </p>
                                        </div>
                                    </div>

                                    <button onClick={handleDecline} className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 bg-[#F2EFE7] text-[#0F2944] rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm transition-all hover:bg-[#E8E2D6] active:scale-[0.98]">
                                        Fermer
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl sm:text-2xl font-black text-[#0F2944] mb-2 sm:mb-3 tracking-tight">
                                        Notifications non supportées
                                    </h3>

                                    <p className="text-xs sm:text-sm text-[#1F3A5F] mb-6 px-1 sm:px-2 leading-relaxed">
                                        Votre navigateur actuel ne supporte pas les notifications push. Veuillez utiliser Google Chrome ou Safari.
                                    </p>

                                    <button onClick={handleDecline} className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 bg-[#F2EFE7] text-[#0F2944] rounded-xl sm:rounded-[14px] font-bold text-xs sm:text-sm transition-all hover:bg-[#E8E2D6] active:scale-[0.98]">
                                        Fermer
                                    </button>
                                </>
                            )}

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

