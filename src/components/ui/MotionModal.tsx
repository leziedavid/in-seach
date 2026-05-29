"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop desktop uniquement */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]"
                    />

                    {/* Wrapper positionnement */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none"
                    >
                        {/* Panneau modal — pleine page mobile, carte desktop */}
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.06, type: "spring", damping: 28 }}
                            className={[
                                "pointer-events-auto",
                                "bg-[#FBFAF6] text-[#0F2944]",
                                /* mobile : pleine page, aucun backdrop visible */
                                "w-full h-dvh rounded-none",
                                /* desktop : carte centrée avec backdrop */
                                "md:h-auto md:max-h-[88vh] md:w-[90%] md:max-w-2xl md:rounded-3xl md:shadow-[0_8px_48px_rgba(15,41,68,0.16)]",
                                "flex flex-col overflow-hidden",
                            ].join(" ")}
                        >
                            {/* ── Header ── */}
                            <div className="relative flex h-16 shrink-0 items-center justify-between px-4 bg-[#FBFAF6]/95 backdrop-blur-md border-b border-[#EEF1F4]">
                                {/* Bouton retour/fermer — style identique au design La Cabine */}
                                <button
                                    onClick={onClose}
                                    aria-label="Retour"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EFE7] text-[#0F2944] hover:bg-[#E8E2D6] active:scale-90 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m12 19-7-7 7-7" />
                                        <path d="M19 12H5" />
                                    </svg>
                                </button>

                                {/* Titre centré */}
                                {title && (
                                    <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-extrabold tracking-[-0.01em] text-[#0F2944] whitespace-nowrap">
                                        {title}
                                    </h2>
                                )}

                                {/* Espace miroir pour centrer le titre */}
                                <div className="h-10 w-10" aria-hidden />
                            </div>

                            {/* ── Contenu scrollable ── */}
                            <div className="flex-1 overflow-y-auto overscroll-contain">
                                {children}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
