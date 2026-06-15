"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { DeliveryInfo } from "@/hooks/useDeliveryInfo";

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
                                {/* Nom du destinataire */}
                                <div>
                                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                        Nom complet du destinataire <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Icon icon="solar:user-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={form.fullName ?? ""}
                                            onChange={e => set("fullName", e.target.value)}
                                            placeholder="Ex: Kouamé Jean-Pierre"
                                            className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Téléphone livraison */}
                                <div>
                                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                        Numéro de téléphone pour la livraison <span className="text-red-500">*</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border bg-muted/30 cursor-pointer mb-2">
                                        <div
                                            onClick={() => set("usePersonalPhone", !form.usePersonalPhone)}
                                            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${form.usePersonalPhone ? "bg-primary" : "bg-muted-foreground/30"}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.usePersonalPhone ? "translate-x-5" : "translate-x-0.5"}`} />
                                        </div>
                                        <span className="text-xs font-bold">Utiliser mon numéro de connexion</span>
                                    </label>
                                    {!form.usePersonalPhone && (
                                        <div className="relative">
                                            <Icon icon="solar:phone-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="tel"
                                                value={form.deliveryPhone ?? ""}
                                                onChange={e => set("deliveryPhone", e.target.value)}
                                                placeholder="Ex: +225 07 00 00 00 00"
                                                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Adresse */}
                                <div>
                                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                        Adresse <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Icon icon="solar:map-point-bold-duotone" width={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                                        <textarea
                                            value={form.address ?? ""}
                                            onChange={e => set("address", e.target.value)}
                                            placeholder="Ex: Rue des Jardins, Imm. Soleil, Apt. 4B"
                                            rows={2}
                                            className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Ville + Commune */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                            Ville <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.city ?? ""}
                                            onChange={e => set("city", e.target.value)}
                                            placeholder="Ex: Abidjan"
                                            className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                            Commune / Quartier
                                        </label>
                                        <input
                                            type="text"
                                            value={form.district ?? ""}
                                            onChange={e => set("district", e.target.value)}
                                            placeholder="Ex: Cocody"
                                            className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Repère */}
                                <div>
                                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                        Repère (optionnel)
                                    </label>
                                    <div className="relative">
                                        <Icon icon="solar:flag-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={form.landmark ?? ""}
                                            onChange={e => set("landmark", e.target.value)}
                                            placeholder="Ex: Près de la pharmacie Sainte-Marie"
                                            className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div>
                                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                        Instructions supplémentaires (optionnel)
                                    </label>
                                    <textarea
                                        value={form.instructions ?? ""}
                                        onChange={e => set("instructions", e.target.value)}
                                        placeholder="Ex: Appeler avant de venir, interphone cassé..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                                    />
                                </div>
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
