"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { DeliveryInfo } from "@/hooks/useDeliveryInfo";
import DeliveryAddressFields from "@/components/delivery/forms/DeliveryAddressFields";

interface DeliveryInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    initial: DeliveryInfo | null;
    saving: boolean;
    onSave: (data: Partial<DeliveryInfo>) => Promise<boolean>;
}

export default function DeliveryInfoModal({ isOpen, onClose, initial, saving, onSave }: DeliveryInfoModalProps) {
    const [mounted, setMounted] = useState(false);
    const [form, setForm] = useState<Partial<DeliveryInfo>>({});

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen && initial) {
            setForm({
                fullName: initial.fullName,
                usePersonalPhone: initial.usePersonalPhone,
                deliveryPhone: initial.deliveryPhone,
                address: initial.address,
                city: initial.city,
                district: initial.district,
                landmark: initial.landmark,
                instructions: initial.instructions,
            });
        }
    }, [isOpen, initial]);

    if (!mounted) return null;

    const set = (key: keyof DeliveryInfo, value: any) =>
        setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        const ok = await onSave(form);
        if (ok) onClose();
    };

    const canSubmit = !!(form.fullName?.trim() && form.address?.trim() && form.city?.trim() &&
        (form.usePersonalPhone || form.deliveryPhone?.trim()));

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
                    />
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[2001] pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.97 }} animate={{ scale: 1 }} transition={{ delay: 0.05 }}
                            onClick={e => e.stopPropagation()}
                            className="pointer-events-auto bg-[#FBFAF6] text-[#0F2944] w-full md:max-w-lg md:rounded-3xl rounded-t-3xl md:shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EEF1F4] bg-[#FBFAF6]/95 backdrop-blur-md sticky top-0">
                                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2EFE7] hover:bg-[#E8E2D6] transition-all active:scale-90">
                                    <Icon icon="solar:alt-arrow-left-bold-duotone" width={18} />
                                </button>
                                <div className="flex-1">
                                    <h2 className="text-base font-black">Informations de livraison</h2>
                                    <p className="text-[11px] text-muted-foreground">Renseignez où livrer votre commande</p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <DeliveryAddressFields form={form} onChange={set} />
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-[#EEF1F4] bg-[#FBFAF6]">
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving || !canSubmit}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <Icon icon="line-md:loading-twotone-loop" width={20} />
                                    ) : (
                                        <>
                                            <Icon icon="solar:check-circle-bold-duotone" width={20} />
                                            Enregistrer les informations
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
