"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { Order, OrderItem } from "@/types/interface";
import { createPortal } from "react-dom";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    PENDING: { label: "En attente", color: "text-amber-600", bg: "bg-amber-500/10", icon: "solar:refresh-bold-duotone" },
    PROCESSING: { label: "En cours", color: "text-orange-600", bg: "bg-orange-500/10", icon: "solar:play-bold-duotone" },
    VALIDATED: { label: "Validé", color: "text-blue-600", bg: "bg-blue-500/10", icon: "solar:check-read-bold-duotone" },
    PAID: { label: "Payé", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: "solar:check-circle-bold-duotone" },
    SHIPPED: { label: "Expédié", color: "text-purple-600", bg: "bg-purple-500/10", icon: "solar:delivery-bold-duotone" },
    DELIVERED: { label: "Livré", color: "text-indigo-600", bg: "bg-indigo-500/10", icon: "solar:box-bold-duotone" },
    CANCELLED: { label: "Annulé", color: "text-red-600", bg: "bg-red-500/10", icon: "solar:close-circle-bold-duotone" },
};

export default function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!order || !mounted) return null;

    const status = statusConfig[order.status] || statusConfig.PENDING;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[1000]" />
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none">
                        <motion.div className="bg-card shadow-2xl overflow-hidden flex flex-col md:w-[90%] md:max-w-2xl md:max-h-[85vh] md:rounded-3xl rounded-t-[2.5rem] w-full h-[85vh] md:h-auto pb-safe pointer-events-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >
                            <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden"><div className="w-12 h-1.5 bg-muted rounded-full" /></div>
                            <div className="sticky top-0 z-50 px-6 py-4 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md">
                                <button onClick={onClose} className="p-2 md:p-3 bg-muted rounded-full transition hover:bg-accent"><Icon icon="solar:alt-arrow-left-bold-duotone" width={20} /></button>
                                <div className="flex-1 text-center"><h2 className="text-lg font-black">Détail de la commande</h2></div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Header Info */}
                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Commande</p>
                                        <p className="text-sm font-black text-primary">#{order.code.toUpperCase()}</p>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} ${status.color} text-[10px] font-black backdrop-blur-sm shadow-sm`}>
                                        <Icon icon={status.icon} width={14} />
                                        <span>{status.label}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-muted/50 rounded-xl"><p className="text-[10px] font-black uppercase text-muted-foreground">Date</p><p className="text-sm font-black">{new Date(order.createdAt).toLocaleDateString()}</p></div>
                                    <div className="p-3 bg-muted/50 rounded-xl"><p className="text-[10px] font-black uppercase text-muted-foreground">Total</p><p className="text-sm font-black text-primary">{order.totalAmount.toLocaleString()} FCFA</p></div>
                                </div>

                                {/* Items List */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground px-1">Articles ({order.items?.length || 0})</h3>
                                    <div className="space-y-2">
                                        {order.items?.map((item: OrderItem) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/50">
                                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/10">
                                                    {item.product?.imageUrl ? (
                                                        <Image src={item.product.imageUrl} fill className="object-cover" alt={item.product.name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Icon icon="solar:box-bold-duotone" width={24} /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-card-foreground truncate">{item.product?.name || "Produit inconnu"}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <p className="text-[11px] font-medium text-muted-foreground">Qté: {item.quantity}</p>
                                                        <p className="text-xs font-black text-primary">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 p-6 bg-card border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Total de la commande</span>
                                    <span className="text-xl font-black text-primary">{order.totalAmount.toLocaleString()} FCFA</span>
                                </div>
                                <button onClick={onClose} className="w-full py-4 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm">Fermer</button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
