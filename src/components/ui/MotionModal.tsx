"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[1000]" />
                    {/* Modal Container */}
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001]">
                        <motion.div className=" bg-card shadow-2xl overflow-hidden flex flex-col  md:w-[90%] md:max-w-3xl md:max-h-[88vh] md:rounded-3xl rounded-t-[2.5rem] md:rounded-t-3xl  w-full h-[90vh] md:h-auto pb-safe " initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >
                            {/* Close Button */}
                            <div className="sticky top-0 z-50 flex justify-end p-4 md:p-6 bg-card border-b border-border">
                                <button onClick={onClose} className="p-2 md:p-3 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-all active:scale-90"  >
                                    <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain mt-4">
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
