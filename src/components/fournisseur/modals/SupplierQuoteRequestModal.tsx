"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { Product } from "@/types/interface";
import { DeliveryInfo, useDeliveryInfo } from "@/hooks/useDeliveryInfo";
import DeliveryAddressFields from "@/components/delivery/forms/DeliveryAddressFields";
import { createSupplierQuote } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";

interface SupplierQuoteRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

export default function SupplierQuoteRequestModal({ isOpen, onClose, product }: SupplierQuoteRequestModalProps) {
    const [mounted, setMounted] = useState(false);
    const [form, setForm] = useState<Partial<DeliveryInfo>>({});
    const [quantity, setQuantity] = useState(1);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { info, fetch: fetchDeliveryInfo } = useDeliveryInfo();
    const { addNotification } = useNotification();

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen) {
            fetchDeliveryInfo();
            setQuantity(1);
            setComment("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && info) {
            setForm({
                fullName: info.fullName,
                usePersonalPhone: info.usePersonalPhone,
                deliveryPhone: info.deliveryPhone,
                address: info.address,
                city: info.city,
                district: info.district,
                landmark: info.landmark,
                instructions: info.instructions,
            });
        }
    }, [isOpen, info]);

    if (!mounted) return null;

    const set = (key: keyof DeliveryInfo, value: any) => setForm(f => ({ ...f, [key]: value }));

    const canSubmit = !!(form.fullName?.trim() && form.address?.trim() && form.city?.trim() &&
        (form.usePersonalPhone ? info?.phone : form.deliveryPhone?.trim()) && quantity > 0 && quantity <= product.stock);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const resolvedPhone = form.usePersonalPhone ? (info?.phone || "") : (form.deliveryPhone || "");
            const res = await createSupplierQuote({
                productId: product.id,
                quantity,
                deliveryFullName: form.fullName || "",
                deliveryPhone: resolvedPhone,
                deliveryAddress: form.address || "",
                deliveryCity: form.city || "",
                deliveryDistrict: form.district || undefined,
                deliveryLandmark: form.landmark || undefined,
                deliveryInstructions: form.instructions || undefined,
                comment: comment.trim() || undefined,
            });
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification("Votre demande a été envoyée au fournisseur", "success");
                onClose();
            } else {
                addNotification(res.message || "Une erreur est survenue", "error");
            }
        } catch {
            addNotification("Une erreur est survenue", "error");
        } finally {
            setSubmitting(false);
        }
    };

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
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-black">Je souhaite être livré</h2>
                                    <p className="text-[11px] text-muted-foreground truncate">{product.name}</p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {/* Quantité */}
                                <div>
                                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                        Quantité souhaitée <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-11 h-11 rounded-2xl border border-border bg-background flex items-center justify-center hover:bg-muted transition active:scale-90">
                                            <Icon icon="solar:minus-circle-bold-duotone" width={20} />
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            max={product.stock}
                                            value={quantity}
                                            onChange={e => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
                                            className="flex-1 text-center py-3 rounded-2xl border border-border bg-background text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                        <button type="button" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                            className="w-11 h-11 rounded-2xl border border-border bg-background flex items-center justify-center hover:bg-muted transition active:scale-90">
                                            <Icon icon="solar:add-circle-bold-duotone" width={20} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">{product.stock} disponible{product.stock > 1 ? "s" : ""}</p>
                                </div>

                                <DeliveryAddressFields form={form} onChange={set} />

                                {/* Commentaire */}
                                <div>
                                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                                        Autre information pertinente (optionnel)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Ex: conditionnement souhaité, date limite, contexte de la demande..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-[#EEF1F4] bg-[#FBFAF6]">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !canSubmit}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Icon icon="line-md:loading-twotone-loop" width={20} />
                                    ) : (
                                        <>
                                            <Icon icon="solar:delivery-bold-duotone" width={20} />
                                            Envoyer ma demande
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
