'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/utils/langue/hooks';
import { storage } from '@/lib/storage';
import { PENDING_ROLE_STORAGE_KEY, PENDING_ROLE_TTL_SEC } from '@/lib/registerRoleOptions';
import { useRegisterRoles, roleLabel, roleDesc } from '@/hooks/useRegisterRoles';
import { RoleStatusBadge } from '@/components/auth/RoleStatusBadge';

interface RoleSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const { roles } = useRegisterRoles();

    const handleSelect = (role: string, active: boolean) => {
        if (!active) return;
        storage.set(PENDING_ROLE_STORAGE_KEY, role, PENDING_ROLE_TTL_SEC);
        onClose();
        router.push('/register');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0F2944]/30 backdrop-blur-sm"
                    />

                    {/* Modal centré, zoom-in */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { type: 'spring', damping: 25, stiffness: 400 },
                        }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#FBFAF6] text-[#0F2944] rounded-3xl sm:rounded-[2rem] shadow-[0_20px_50px_rgba(15,41,68,0.13)] border border-[#EEF1F4] flex flex-col"
                    >
                        <button
                            onClick={onClose}
                            aria-label="Fermer"
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F2EFE7] text-[#0F2944] hover:bg-[#E8E2D6] active:scale-90 transition-all z-10"
                        >
                            <Icon icon="solar:close-circle-bold" width={18} />
                        </button>

                        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm p-4 rounded-2xl text-primary">
                                    <Icon icon="solar:user-id-bold-duotone" width={28} height={28} />
                                </div>
                            </div>

                            <h3 className="text-lg sm:text-xl font-black text-[#0F2944] mb-1.5 tracking-tight">
                                {t('auth.register.role_modal.title')}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#1F3A5F] mb-6 px-1 leading-relaxed">
                                {t('auth.register.role_modal.subtitle')}
                            </p>

                            <div className="w-full grid grid-cols-2 gap-3">
                                {roles.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={!opt.active}
                                        onClick={() => handleSelect(opt.value, opt.active)}
                                        className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${opt.active
                                                ? 'border-[#EEF1F4] bg-[#F2EFE7]/50 hover:border-primary hover:bg-primary/10 active:scale-[0.97] cursor-pointer'
                                                : 'border-[#EEF1F4]/60 bg-[#F2EFE7]/20 opacity-60 grayscale cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="absolute top-2 right-2">
                                            <RoleStatusBadge active={opt.active} />
                                        </div>
                                        <Icon icon={opt.icon} className="text-primary mt-3" width={26} />
                                        <span className="text-xs font-bold uppercase text-[#0F2944]">{roleLabel(opt, t)}</span>
                                        <span className="text-[10px] text-[#1F3A5F]/80 leading-snug">{roleDesc(opt, t)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
