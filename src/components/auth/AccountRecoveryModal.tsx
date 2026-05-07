
"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { requestRecovery } from '@/api/api';

interface AccountRecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AccountRecoveryModal = ({ isOpen, onClose }: AccountRecoveryModalProps) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) {
            toast.error("Veuillez entrer votre numéro de téléphone");
            return;
        }

        setLoading(true);
        try {
            const res = await requestRecovery(phone);
            if (res.statusCode === 200 || res.statusCode === 201) {
                toast.success("Demande de récupération envoyée avec succès. L'administration vous contactera prochainement.");
                onClose();
            } else {
                toast.error(res.message || "Une erreur est survenue");
            }
        } catch (error) {
            toast.error("Impossible d'envoyer la demande. Vérifiez que le numéro est correct et associé à un compte suspendu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
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
                        className="relative w-full max-w-[340px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/20 dark:border-zinc-800/50 overflow-hidden"
                    >
                        <div className="p-8 flex flex-col items-center text-center">

                            {/* Recovery Icon */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative bg-primary/10 p-5 rounded-2xl text-primary">
                                    <Icon icon="solar:user-speak-bold-duotone" width={36} />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                                Récupération
                            </h3>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 px-2 font-bold leading-relaxed">
                                Votre compte a été suspendu ? Saisissez votre numéro de téléphone pour demander une réactivation.
                            </p>

                            <form onSubmit={handleSubmit} className="w-full space-y-6">
                                <div className="relative group">
                                    <Icon icon="solar:phone-bold-duotone" width={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Numéro de téléphone"
                                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 outline-none focus:border-primary text-sm font-bold transition-all"
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                <div className="flex w-full gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-4 px-4 bg-muted text-muted-foreground hover:text-foreground rounded-2xl font-bold text-xs transition-all active:scale-[0.95]"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-4 px-4 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.95] flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" />
                                        ) : (
                                            "Envoyer"
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Minimal Footer */}
                            <div className="mt-8 flex items-center gap-1.5 text-[8px] text-zinc-400 font-bold uppercase tracking-widest opacity-60">
                                <Icon icon="solar:shield-user-bold" width={10} />
                                <span>Traitement sécurisé</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
