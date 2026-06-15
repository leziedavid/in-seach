"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { Order, OrderItem, OrderStatus } from "@/types/interface";
import { createPortal } from "react-dom";
import ReturnRequestModal from "@/components/returns/modals/ReturnRequestModal";

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

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
    if (!value?.trim()) return null;
    return (
        <div className="flex items-start gap-2.5">
            <Icon icon={icon} width={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
                <p className="text-xs font-bold text-card-foreground break-words">{value}</p>
            </div>
        </div>
    );
}

export default function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const [returnItem, setReturnItem] = useState<OrderItem | null>(null);

    useEffect(() => { setMounted(true); }, []);

    const canReturn = order?.status === OrderStatus.DELIVERED;

    if (!order || !mounted) return null;

    const { user } = order as any;
    const hasDeliveryInfo = user && (user.deliveryAddress || user.deliveryCity || user.deliveryFullName);
    const effectivePhone = user?.usePersonalPhone ? user?.phone : (user?.deliveryPhone || user?.phone);
    const effectiveName = user?.deliveryFullName || user?.fullName;

    const returnModal = returnItem ? (
        <ReturnRequestModal
            isOpen={!!returnItem}
            onClose={() => setReturnItem(null)}
            orderId={order.id}
            item={returnItem}
            onSuccess={() => setReturnItem(null)}
        />
    ) : null;

    const status = statusConfig[order.status] || statusConfig.PENDING;

    const portal = createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]" />
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none">
                        <motion.div className="bg-[#FBFAF6] text-[#0F2944] overflow-hidden flex flex-col md:w-[90%] md:max-w-2xl md:max-h-[85vh] md:rounded-3xl md:shadow-[0_8px_48px_rgba(15,41,68,0.16)] rounded-none w-full h-dvh md:h-auto pb-safe pointer-events-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >
                            <div className="sticky top-0 z-50 flex h-16 items-center gap-3 px-4 border-b border-[#EEF1F4] bg-[#FBFAF6]/95 backdrop-blur-md">
                                <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EFE7] text-[#0F2944] hover:bg-[#E8E2D6] transition-all active:scale-90"><Icon icon="solar:alt-arrow-left-bold-duotone" width={20} /></button>
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

                                {/* Bloc client + livraison — visible si les données user sont incluses */}
                                {user && (
                                    <div className="rounded-2xl border border-border/60 overflow-hidden">
                                        {/* Infos client */}
                                        <div className="px-4 py-3 bg-muted/20 border-b border-border/40">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5 mb-3">
                                                <Icon icon="solar:user-bold-duotone" width={13} className="text-primary" />
                                                Informations client
                                            </p>
                                            <div className="space-y-2">
                                                <InfoRow icon="solar:user-bold-duotone" label="Nom" value={user.fullName} />
                                                <InfoRow icon="solar:letter-bold-duotone" label="Email" value={user.email} />
                                                <InfoRow icon="solar:phone-bold-duotone" label="Téléphone" value={user.indicatif ? `${user.indicatif} ${user.phone}` : user.phone} />
                                            </div>
                                        </div>

                                        {/* Infos livraison */}
                                        <div className="px-4 py-3">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5 mb-3">
                                                <Icon icon="solar:delivery-bold-duotone" width={13} className="text-primary" />
                                                Informations de livraison
                                            </p>
                                            {hasDeliveryInfo ? (
                                                <div className="space-y-2">
                                                    <InfoRow icon="solar:user-bold-duotone" label="Destinataire" value={effectiveName} />
                                                    <InfoRow icon="solar:phone-bold-duotone" label="Téléphone de livraison" value={effectivePhone} />
                                                    <InfoRow icon="solar:map-point-bold-duotone" label="Adresse" value={user.deliveryAddress} />
                                                    <InfoRow icon="solar:buildings-bold-duotone" label="Ville" value={user.deliveryCity} />
                                                    <InfoRow icon="solar:buildings-2-bold-duotone" label="Commune / Quartier" value={user.deliveryDistrict} />
                                                    <InfoRow icon="solar:flag-bold-duotone" label="Repère" value={user.deliveryLandmark} />
                                                    <InfoRow icon="solar:document-text-bold-duotone" label="Instructions" value={user.deliveryInstructions} />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 py-2">
                                                    <Icon icon="solar:info-circle-bold-duotone" width={15} className="text-muted-foreground shrink-0" />
                                                    <p className="text-xs text-muted-foreground">Aucune adresse de livraison renseignée par le client.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Items List */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase text-muted-foreground px-1">Articles ({order.items?.length || 0})</h3>
                                    <div className="space-y-2">
                                        {order.items?.map((item: OrderItem) => (
                                            <div key={item.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-muted/20 border border-border/50">
                                                <div className="flex items-center gap-3">
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
                                                {canReturn && (
                                                    <button
                                                        onClick={() => setReturnItem(item)}
                                                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/8 text-red-600 hover:bg-red-500/15 transition-all text-[11px] font-black uppercase tracking-wide active:scale-95"
                                                    >
                                                        <Icon icon="solar:refresh-back-bold-duotone" className="w-3.5 h-3.5" />
                                                        Retourner l&apos;article
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 p-6 bg-[#FBFAF6] border-t border-[#EEF1F4]">
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

    return <>{portal}{returnModal}</>;
}
