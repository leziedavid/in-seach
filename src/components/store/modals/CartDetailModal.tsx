"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useCart } from "@/components/providers/CartProvider";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { createPortal } from "react-dom";
import { createOrder } from "@/api/api";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useDeliveryInfo, hasMinimalDeliveryInfo } from "@/hooks/useDeliveryInfo";
import DeliveryInfoModal from "@/components/delivery/modals/DeliveryInfoModal";

interface CartDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MOBILE_PROVIDERS = [
    { id: "WAVE", name: "Wave", icon: "simple-icons:wave", color: "bg-blue-500" },
    { id: "ORANGE", name: "Orange", icon: "simple-icons:orange", color: "bg-orange-500" },
    { id: "MTN", name: "MTN", icon: "simple-icons:mtn", color: "bg-yellow-500" },
    { id: "MOOV", name: "Moov", icon: "simple-icons:moov", color: "bg-blue-800" },
];

export default function CartDetailModal({ isOpen, onClose }: CartDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const { cart, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
    const { addNotification } = useNotification();
    const router = useRouter();

    const [showPaymentSection, setShowPaymentSection] = useState(false);
    const [paymentType, setPaymentType] = useState<"LIVRAISON" | "MOBILE_MONEY">("LIVRAISON");
    const [selectedMobileProvider, setSelectedMobileProvider] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);

    const { info: deliveryInfo, loading: deliveryLoading, saving: deliverySaving, fetch: fetchDelivery, save: saveDelivery } = useDeliveryInfo();

    useEffect(() => { setMounted(true); }, []);

    // Charger les infos de livraison quand le modal s'ouvre et que l'utilisateur est connecté
    useEffect(() => {
        if (isOpen && isAuthenticated() && !deliveryInfo) {
            fetchDelivery();
        }
    }, [isOpen]);

    if (!mounted) return null;

    const hasDelivery = hasMinimalDeliveryInfo(deliveryInfo);

    const handleProceedToPayment = () => {
        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour commander", "error");
            onClose();
            router.push("/login");
            return;
        }
        if (!hasDelivery) {
            setShowDeliveryModal(true);
            return;
        }
        setShowPaymentSection(true);
    };

    const handleValidateOrder = async () => {
        if (cart.length === 0) return;

        const paymentMethod = paymentType === "LIVRAISON" ? "LIVRAISON" : selectedMobileProvider;

        if (paymentType === "MOBILE_MONEY" && !selectedMobileProvider) {
            addNotification("Veuillez sélectionner un opérateur Mobile Money", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const items = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                achatType: item.achatType,
                ...(item.accompagnementId && { accompagnementId: item.accompagnementId }),
                ...(item.selectedExtras?.length && { extraAccompagnementIds: item.selectedExtras.map(e => e.id) }),
            }));

            const res = await createOrder({ items, paymentMethod: paymentMethod! });

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification("Commande validée avec succès !", "success");
                clearCart();
                onClose();
                router.push("/akwaba");
            } else {
                addNotification(res.message || "Erreur lors de la validation", "error");
            }
        } catch (error) {
            console.error("Order error:", error);
            addNotification("Une erreur est survenue", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <>
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
                                    <div className="flex-1 text-center"><h2 className="text-lg font-black italic">Mon Panier</h2></div>
                                    <div className="p-2 w-10 h-10" />
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground">
                                                <Icon icon="solar:cart-large-minimalistic-bold-duotone" width={40} />
                                            </div>
                                            <div>
                                                <p className="font-black text-lg">Votre panier est vide</p>
                                                <p className="text-muted-foreground text-sm">Ajoutez des produits pour commander</p>
                                            </div>
                                            <button onClick={onClose} className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-black active:scale-95 transition-all">
                                                Découvrir nos produits
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {cart.map((item) => {
                                                const extrasSum = (item.selectedExtras ?? []).reduce((s, e) => s + e.supplementPrice, 0);
                                                return (
                                                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50 group">
                                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 shadow-sm border border-border/10">
                                                        {item.imageUrl ? (
                                                            <Image
                                                                src={item.imageUrl}
                                                                fill
                                                                className="object-cover"
                                                                alt={item.name}
                                                                unoptimized />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Icon icon="solar:box-bold-duotone" width={32} /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 py-1">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col">
                                                                <h4 className="font-black text-sm pr-2 italic break-words whitespace-normal">
                                                                    {item.name}
                                                                </h4>                                                                {item.achatType === 'GROS' && (
                                                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded w-fit mt-1">Vente en Gros</span>
                                                                )}
                                                            </div>
                                                            <button onClick={() => removeFromCart(item.id, item.achatType, item.accompagnementId, item.selectedExtras)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                                                                <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />
                                                            </button>
                                                        </div>
                                                        <p className="text-primary font-black text-sm mb-1">{(item.price + (item.accompagnementSupplement ?? 0) + extrasSum).toLocaleString()} FCFA</p>
                                                        {item.accompagnementName && (
                                                            <p className="text-[11px] font-bold text-muted-foreground mb-2">
                                                                Accompagnement : {item.accompagnementName}
                                                                {!!item.accompagnementSupplement && ` (+${item.accompagnementSupplement.toLocaleString()} FCFA)`}
                                                            </p>
                                                        )}
                                                        {!!item.selectedExtras?.length && (
                                                            <p className="text-[11px] font-bold text-muted-foreground mb-2">
                                                                {item.selectedExtras.map(e => `+ ${e.name} (+${e.supplementPrice.toLocaleString()} FCFA)`).join(', ')}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center bg-background rounded-lg border border-border/50 p-1">
                                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.achatType, item.accompagnementId, item.selectedExtras)} className="w-7 h-7 text-muted-foreground flex items-center justify-center rounded-md hover:bg-secondary hover:text-white transition-colors">
                                                                    <Icon icon="iconamoon:sign-minus-bold" width={18} />
                                                                </button>
                                                                <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.achatType, item.accompagnementId, item.selectedExtras)} className="w-7 h-7 text-muted-foreground flex items-center justify-center rounded-md hover:bg-secondary hover:text-white transition-colors">
                                                                    <Icon icon="iconamoon:sign-plus-bold" width={18} />
                                                                </button>
                                                            </div>
                                                            <p className="text-xs font-black italic">
                                                                {item.achatType === 'GROS' && item.prixVenteGros ? item.prixVenteGros.toLocaleString() : ((item.price + (item.accompagnementSupplement ?? 0) + extrasSum) * item.quantity).toLocaleString()} FCFA
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Bloc livraison — affiché quand le panier a des articles et avant paiement */}
                                    {cart.length > 0 && !showPaymentSection && (
                                        <>
                                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-muted-foreground font-medium">Sous-total</span>
                                                    <span className="text-sm font-black">{totalAmount.toLocaleString()} FCFA</span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-primary/10 pt-2 mt-2">
                                                    <span className="text-sm font-black italic">Total Général</span>
                                                    <span className="text-lg font-black text-primary">{totalAmount.toLocaleString()} FCFA</span>
                                                </div>
                                            </div>

                                            {/* Carte infos de livraison */}
                                            {isAuthenticated() && (
                                                deliveryLoading ? (
                                                    <div className="flex items-center gap-2 p-4 rounded-2xl bg-muted/30 border border-border animate-pulse">
                                                        <Icon icon="line-md:loading-twotone-loop" width={18} className="text-muted-foreground shrink-0" />
                                                        <span className="text-xs text-muted-foreground">Chargement des informations de livraison…</span>
                                                    </div>
                                                ) : !hasDelivery ? (
                                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border-2 border-dashed border-orange-400/60 bg-orange-500/5" >
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                                                <Icon icon="solar:delivery-bold-duotone" width={20} className="text-orange-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-orange-700 dark:text-orange-400">Adresse de livraison manquante</p>
                                                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Vous devez renseigner votre adresse de livraison avant de pouvoir passer commande.</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setShowDeliveryModal(true)} className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-2" >
                                                            <Icon icon="solar:map-point-add-bold-duotone" width={16} />
                                                            Renseigner mes informations de livraison
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border border-green-500/30 bg-green-500/5" >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                                    <Icon icon="solar:map-point-bold-duotone" width={15} className="text-green-600" />
                                                                </div>
                                                                <span className="text-[11px] font-black uppercase text-green-700 dark:text-green-400 tracking-wide">Livraison</span>
                                                            </div>
                                                            <button onClick={() => setShowDeliveryModal(true)} className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"  >
                                                                <Icon icon="solar:pen-bold-duotone" width={12} />
                                                                Modifier
                                                            </button>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black">{deliveryInfo?.fullName}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Icon icon="solar:phone-bold-duotone" width={12} />
                                                                {deliveryInfo?.phone}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Icon icon="solar:map-point-bold-duotone" width={12} />
                                                                {deliveryInfo?.address}{deliveryInfo?.district ? `, ${deliveryInfo.district}` : ""}
                                                            </p>
                                                            <p className="text-xs font-black text-muted-foreground">{deliveryInfo?.city}</p>
                                                            {deliveryInfo?.landmark && (
                                                                <p className="text-[11px] text-muted-foreground italic">📍 {deliveryInfo.landmark}</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )
                                            )}
                                        </>
                                    )}

                                    {showPaymentSection && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6 pt-2 border-t border-border"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                    <Icon icon="solar:card-2-bold-duotone" width={18} className="text-primary" />
                                                    Mode de paiement
                                                </h3>
                                                <button onClick={() => setShowPaymentSection(false)} className="text-[10px] font-black uppercase text-primary hover:underline">
                                                    Retour au panier
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <button onClick={() => { setPaymentType("LIVRAISON"); setSelectedMobileProvider(null); }}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${paymentType === "LIVRAISON" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/20 hover:border-primary/50"}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentType === "LIVRAISON" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                                            <Icon icon="solar:delivery-bold-duotone" width={24} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black italic">Payer à la livraison</p>
                                                            <p className="text-[10px] text-muted-foreground">Payer une fois votre colis reçu</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentType === "LIVRAISON" ? "border-primary" : "border-muted-foreground/30"}`}>
                                                        {paymentType === "LIVRAISON" && <div className="w-2.5 h-2.5 bg-primary rounded-full transition-all" />}
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => setPaymentType("MOBILE_MONEY")}
                                                    className={`w-full flex items-center opacity-50 cursor-not-allowed pointer-events-none justify-between p-4 rounded-2xl border transition-all duration-300 ${paymentType === "MOBILE_MONEY" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/20 hover:border-primary/50"}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentType === "MOBILE_MONEY" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                                            <Icon icon="solar:smartphone-bold-duotone" width={24} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black italic">Payer par Mobile Money</p>
                                                            <p className="text-[10px] text-muted-foreground">Wave, Orange, MTN, Moov</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentType === "MOBILE_MONEY" ? "border-primary" : "border-muted-foreground/30"}`}>
                                                        {paymentType === "MOBILE_MONEY" && <div className="w-2.5 h-2.5 bg-primary rounded-full transition-all" />}
                                                    </div>
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {paymentType === "MOBILE_MONEY" && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                        <div className="grid grid-cols-4 gap-3 py-2">
                                                            {MOBILE_PROVIDERS.map((provider) => (
                                                                <button key={provider.id} onClick={() => setSelectedMobileProvider(provider.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 ${selectedMobileProvider === provider.id ? "border-primary bg-primary/10 scale-105 shadow-md" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}>
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-white ${provider.color}`}>
                                                                        <Icon icon={provider.icon} width={20} />
                                                                    </div>
                                                                    <span className="text-[9px] font-black uppercase tracking-tighter">{provider.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-2">
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span>Total à payer</span>
                                                    <span className="text-primary text-lg font-black italic">{totalAmount.toLocaleString()} FCFA</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="sticky bottom-0 p-6 bg-[#FBFAF6] border-t border-[#EEF1F4]">
                                    {cart.length > 0 && (
                                        <button
                                            disabled={isLoading || deliveryLoading}
                                            onClick={showPaymentSection ? handleValidateOrder : handleProceedToPayment}
                                            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <Icon icon="line-md:loading-twotone-loop" width={20} />
                                            ) : (
                                                <>
                                                    <Icon icon={showPaymentSection ? "solar:check-circle-bold-duotone" : "solar:wad-of-money-bold-duotone"} width={20} className="group-hover:scale-110 transition-transform" />
                                                    {showPaymentSection ? "Valider la commande" : "Procéder au paiement"}
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {cart.length === 0 && (
                                        <button onClick={onClose} className="w-full py-4 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm">Fermer</button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <DeliveryInfoModal
                isOpen={showDeliveryModal}
                onClose={() => setShowDeliveryModal(false)}
                initial={deliveryInfo}
                saving={deliverySaving}
                onSave={async (data) => {
                    const ok = await saveDelivery(data);
                    if (ok) setShowDeliveryModal(false);
                    return ok;
                }}
            />
        </>,
        document.body
    );
}
