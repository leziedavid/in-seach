"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { createReport, CreateReportDto } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { isAuthenticated } from "@/lib/auth";

interface ReportButtonProps {
    entityType: 'USER' | 'SERVICE' | 'ANNONCE' | 'PRODUCT' | 'LOGISTIC_SERVICE' | 'EASY_DELIVERY';
    entityId: string;
    className?: string;
}

const REASONS: { value: CreateReportDto['reason']; label: string }[] = [
    { value: 'SPAM', label: 'Spam ou contenu indésirable' },
    { value: 'INAPPROPRIATE_CONTENT', label: 'Contenu inapproprié' },
    { value: 'FAKE_PROFILE', label: 'Profil ou annonce fictif' },
    { value: 'FRAUD', label: 'Arnaque ou fraude' },
    { value: 'VIOLENCE', label: 'Violence ou menace' },
    { value: 'HARASSMENT', label: 'Harcèlement' },
    { value: 'COPYRIGHT', label: 'Violation des droits d\'auteur' },
    { value: 'OTHER', label: 'Autre' },
];

export default function ReportButton({ entityType, entityId, className }: ReportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState<CreateReportDto['reason'] | ''>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { addNotification } = useNotification();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isAuthenticated()) return null;

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(true);
        setReason('');
        setDescription('');
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) {
            addNotification("Veuillez sélectionner un motif.", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await createReport({
                entityType,
                entityId,
                reason: reason as CreateReportDto['reason'],
                description: description.trim() || undefined,
            });
            if (res.statusCode === 201 || res.statusCode === 200) {
                addNotification("Signalement envoyé. Merci pour votre contribution.", "success");
                handleClose();
            } else {
                addNotification(res.message || "Une erreur est survenue.", "error");
            }
        } catch {
            addNotification("Impossible d'envoyer le signalement.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className={`flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors ${className ?? ''}`}
                title="Signaler"
                type="button"
            >
                <Icon icon="solar:flag-bold-duotone" width={12} />
                <span>Signaler</span>
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleClose}
                                className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]"
                            />

                            {/* Modal wrapper */}
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                                className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none"
                            >
                                <motion.div
                                    initial={{ y: 24, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.06, type: "spring", damping: 28 }}
                                    className={[
                                        "pointer-events-auto",
                                        "bg-[#FBFAF6] text-[#0F2944]",
                                        "w-full h-dvh rounded-none",
                                        "md:h-auto md:max-h-[88vh] md:w-[90%] md:max-w-lg md:rounded-3xl md:shadow-[0_8px_48px_rgba(15,41,68,0.16)]",
                                        "flex flex-col overflow-hidden",
                                    ].join(" ")}
                                >
                                    {/* Header */}
                                    <div className="relative flex h-16 shrink-0 items-center justify-between px-4 bg-[#FBFAF6]/95 backdrop-blur-md border-b border-[#EEF1F4]">
                                        <button
                                            onClick={handleClose}
                                            type="button"
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EFE7] text-[#0F2944] hover:bg-[#E8E2D6] active:scale-90 transition-all"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m12 19-7-7 7-7" />
                                                <path d="M19 12H5" />
                                            </svg>
                                        </button>
                                        <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-extrabold tracking-[-0.01em] text-[#0F2944] whitespace-nowrap flex items-center gap-2">
                                            <Icon icon="solar:flag-bold-duotone" width={18} className="text-red-500" />
                                            Signaler ce contenu
                                        </h2>
                                        <div className="h-10 w-10" aria-hidden />
                                    </div>

                                    {/* Content */}
                                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
                                        <p className="text-[13px] text-[#0F2944]/60 leading-relaxed">
                                            Aidez-nous à maintenir une communauté saine en signalant les contenus problématiques.
                                        </p>

                                        {/* Reason select */}
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold text-[#0F2944] uppercase tracking-wider">
                                                Motif <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value as CreateReportDto['reason'])}
                                                    required
                                                    className="w-full appearance-none bg-white border border-[#EEF1F4] rounded-2xl px-4 py-3 text-[13px] font-medium text-[#0F2944] focus:outline-none focus:ring-2 focus:ring-[#0F2944]/20 cursor-pointer"
                                                >
                                                    <option value="">— Choisir un motif —</option>
                                                    {REASONS.map((r) => (
                                                        <option key={r.value} value={r.value}>{r.label}</option>
                                                    ))}
                                                </select>
                                                <Icon icon="solar:alt-arrow-down-bold-duotone" width={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F2944]/40 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Description textarea */}
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold text-[#0F2944] uppercase tracking-wider">
                                                Description <span className="text-[#0F2944]/40 font-normal normal-case">(optionnel)</span>
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                                                rows={4}
                                                placeholder="Décrivez le problème en quelques mots..."
                                                className="w-full bg-white border border-[#EEF1F4] rounded-2xl px-4 py-3 text-[13px] text-[#0F2944] placeholder-[#0F2944]/30 focus:outline-none focus:ring-2 focus:ring-[#0F2944]/20 resize-none"
                                            />
                                            <p className="text-[10px] text-[#0F2944]/40 text-right">{description.length}/500</p>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !reason}
                                            className="w-full bg-[#0F2944] text-white rounded-2xl py-4 text-[13px] font-extrabold tracking-wide hover:bg-[#0F2944]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" />
                                            ) : (
                                                <Icon icon="solar:flag-bold-duotone" width={16} />
                                            )}
                                            {isSubmitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
                                        </button>
                                    </form>
                                </motion.div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
