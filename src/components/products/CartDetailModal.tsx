"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { useCart } from "@/components/providers/CartProvider";
import { useNotification } from "@/components/toast/NotificationProvider";
import { createPortal } from "react-dom";
import { createOrder } from "@/api/api";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUserId } from "@/lib/auth";

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

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    const handleValidateOrder = async () => {
        if (cart.length === 0) return;

        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour commander", "error");
            onClose();
            router.push("/login");
            return;
        }

        const paymentMethod = paymentType === "LIVRAISON" ? "LIVRAISON" : selectedMobileProvider;

        if (paymentType === "MOBILE_MONEY" && !selectedMobileProvider) {
            addNotification("Veuillez sélectionner un opérateur Mobile Money", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const items = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }));

            const res = await createOrder({
                items,
                paymentMethod: paymentMethod!
            });

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification("Commande validée avec succès !", "success");
                clearCart();
                onClose();
                router.push("/akwaba"); // Redirect to orders page if exists
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
                                <div className="flex-1 text-center"><h2 className="text-lg font-black italic">Mon Panier</h2></div>
                                <div className="p-2 w-10 h-10" /> {/* Spacer */}
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
                                        {cart.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50 group">
                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 shadow-sm border border-border/10">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} fill className="object-cover" alt={item.name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Icon icon="solar:box-bold-duotone" width={32} /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 py-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-black text-sm truncate pr-2 italic">{item.name}</h4>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                                                            <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />
                                                        </button>
                                                    </div>
                                                    <p className="text-primary font-black text-sm mb-2">{item.price.toLocaleString()} FCFA</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center bg-background rounded-lg border border-border/50 p-1">
                                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 text-muted-foreground flex items-center justify-center rounded-md hover:bg-secondary hover:text-white transition-colors" >
                                                                <Icon icon="iconamoon:sign-minus-bold" width={18} />
                                                            </button>
                                                            <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 text-muted-foreground flex items-center justify-center rounded-md hover:bg-secondary hover:text-white transition-colors">
                                                                <Icon icon="iconamoon:sign-plus-bold" width={18} />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs font-black italic">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {cart.length > 0 && !showPaymentSection && (
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
                                            <button onClick={() => setShowPaymentSection(false)} className="text-[10px] font-black uppercase text-primary hover:underline" >
                                                Retour au panier
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <button onClick={() => { setPaymentType("LIVRAISON"); setSelectedMobileProvider(null); }}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${paymentType === "LIVRAISON" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/20 hover:border-primary/50"}`}  >
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
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${paymentType === "MOBILE_MONEY" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/20 hover:border-primary/50"}`}
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
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden" >
                                                    <div className="grid grid-cols-4 gap-3 py-2">
                                                        {MOBILE_PROVIDERS.map((provider) => (
                                                            <button key={provider.id} onClick={() => setSelectedMobileProvider(provider.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 ${selectedMobileProvider === provider.id ? "border-primary bg-primary/10 scale-105 shadow-md" : "border-transparent bg-muted/30 hover:bg-muted/50"}`} >
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

                            <div className="sticky bottom-0 p-6 bg-card border-t border-border">
                                {cart.length > 0 && (
                                    <button disabled={isLoading} onClick={showPaymentSection ? handleValidateOrder : () => setShowPaymentSection(true)} className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 group"  >
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
        </AnimatePresence>,
        document.body
    );
}
