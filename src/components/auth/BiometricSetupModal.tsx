'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useBiometrics } from '@/hooks/useBiometrics';
import { webAuthnListCredentials } from '@/api/api';

const LS_DISMISSED = 'biometricSetupDismissed';

export function BiometricSetupModal() {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [done, setDone] = useState(false);

    const { isAvailable, isEnabled, loading, error, register } = useBiometrics();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        // Afficher uniquement si : PWA installée + biométrie supportée + pas encore activée + pas déjà refusé
        const dismissed = localStorage.getItem(LS_DISMISSED) === 'true';
        if (isAvailable && !isEnabled && !dismissed) {
            // Délai court pour laisser la page se charger avant d'afficher le modal
            const t = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(t);
        }
    }, [mounted, isAvailable, isEnabled]);

    const handleActivate = async () => {
        const ok = await register('Ce téléphone');
        if (ok) {
            setDone(true);
            setTimeout(() => setVisible(false), 1800);
            return;
        }
        // Si register() échoue, vérifier si une credential existe déjà en DB.
        // Cas typique : l'authenticateur est dans le trousseau iCloud mais hasBiometrics
        // n'avait jamais été positionné (bug BaseResponse pré-fix) → synchroniser.
        try {
            const res = await webAuthnListCredentials();
            if (res?.data && res.data.length > 0) {
                localStorage.setItem('hasBiometrics', 'true');
                setDone(true);
                setTimeout(() => setVisible(false), 1800);
            }
        } catch { }
    };

    const handleDismiss = () => {
        localStorage.setItem(LS_DISMISSED, 'true');
        setVisible(false);
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    {/* Modal — slide up depuis le bas sur mobile, centré sur desktop */}
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        className="fixed z-[999] bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm w-full"
                    >
                        <div className="bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden">

                            {/* Indicateur de glissement (mobile) */}
                            <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-10 h-1 rounded-full bg-border" />
                            </div>

                            <div className="px-6 pt-4 pb-7 space-y-5">

                                {done ? (
                                    /* ─── Succès ─── */
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-3 py-4 text-center"
                                    >
                                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <Icon icon="solar:check-circle-bold-duotone" width={32} className="text-green-500" />
                                        </div>
                                        <p className="text-base font-black text-foreground">Biométrie activée !</p>
                                        <p className="text-sm text-muted-foreground">Vous pouvez maintenant vous connecter avec votre empreinte ou Face ID.</p>
                                    </motion.div>
                                ) : (
                                    /* ─── Invitation ─── */
                                    <>
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                    <Icon icon="solar:fingerprint-bold-duotone" width={24} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-foreground leading-tight">Connexion biométrique</p>
                                                    <p className="text-xs text-muted-foreground">Face ID · Touch ID · Empreinte</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleDismiss}
                                                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors mt-0.5"
                                            >
                                                <Icon icon="solar:close-circle-bold-duotone" width={18} />
                                            </button>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Activez la biométrie pour vous connecter en un instant, sans saisir votre code PIN à chaque fois.
                                        </p>

                                        {/* Avantages */}
                                        <div className="space-y-2">
                                            {[
                                                { icon: 'solar:bolt-bold-duotone', label: 'Connexion instantanée' },
                                                { icon: 'solar:shield-check-bold-duotone', label: 'Sécurisé par votre appareil' },
                                                { icon: 'solar:lock-keyhole-bold-duotone', label: 'Aucun mot de passe stocké' },
                                            ].map((item) => (
                                                <div key={item.icon} className="flex items-center gap-2.5">
                                                    <Icon icon={item.icon} width={16} className="text-primary flex-shrink-0" />
                                                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {error && (
                                            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleActivate}
                                                disabled={loading}
                                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                                            >
                                                {loading
                                                    ? <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" />
                                                    : <><Icon icon="solar:fingerprint-bold-duotone" width={16} /> Activer maintenant</>
                                                }
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDismiss}
                                                className="w-full h-9 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Plus tard, ne plus afficher
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body,
    );
}
