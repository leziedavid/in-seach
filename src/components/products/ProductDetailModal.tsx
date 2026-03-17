"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { Product } from "@/types/interface";
import { createPortal } from "react-dom";
import { useCart } from "@/components/providers/CartProvider";
import { useNotification } from "@/components/toast/NotificationProvider";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUserId } from "@/lib/auth";
import { createChatConversation } from "@/api/api";

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export default function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const { addToCart } = useCart();
    const { addNotification } = useNotification();
    const router = useRouter();
    const [isNegotiating, setIsNegotiating] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!product || !mounted) return null;

    const handleAddToCart = () => {
        addToCart(product);
        addNotification(`"${product.name}" ajouté au panier`, "success");
    };

    const handleNegotiate = async () => {
        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour négocier", "error");
            router.push("/login");
            return;
        }

        const currentUserId = getUserId();
        const ownerId = product.user?.id || product.userId;
        if (currentUserId === ownerId) {
            addNotification("Vous ne pouvez pas négocier votre propre produit", "warning");
            return;
        }

        setIsNegotiating(true);
        try {
            // Create or get conversation
            const participant2Id = product.user?.id || product.userId;

            if (!participant2Id) {
                addNotification("Impossible d'identifier le propriétaire du produit.", "error");
                return;
            }

            const res = await createChatConversation({
                participant2Id: participant2Id,
            });

            if (res.statusCode === 200 || res.statusCode === 201) {
                // Redirect to chat with product info for auto-message
                const initialMessage = `Bonjour, je suis intéressé par votre produit "${product.name}" (Prix: ${product.price.toLocaleString()} FCFA). Pouvons-nous en discuter ?`;

                // Store initial message in sessionStorage for the chat page to pick up
                sessionStorage.setItem("pending_negotiation", JSON.stringify({
                    conversationId: res.data.id,
                    message: initialMessage,
                    productId: product.id
                }));

                router.push("/chat-ia");
            } else {
                addNotification("Erreur lors de la création de la conversation", "error");
            }
        } catch (error) {
            console.error("Negotiation error:", error);
            addNotification("Une erreur est survenue", "error");
        } finally {
            setIsNegotiating(false);
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
                        <motion.div className="bg-card shadow-2xl overflow-hidden flex flex-col md:w-[90%] md:max-w-3xl md:max-h-[85vh] md:rounded-3xl rounded-t-[2.5rem] w-full h-[85vh] md:h-auto pb-safe pointer-events-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >
                            <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden"><div className="w-12 h-1.5 bg-muted rounded-full" /></div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="grid md:grid-cols-2 gap-0 md:gap-6">
                                    {/* Image Section */}
                                    <div className="relative aspect-square md:aspect-auto md:h-full bg-muted min-h-[300px]">
                                        {product.imageUrl ? (
                                            <Image src={product.imageUrl} fill className="object-cover" alt={product.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                <Icon icon="solar:box-bold-duotone" width={80} />
                                            </div>
                                        )}
                                        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white transition hover:bg-black/40">
                                            <Icon icon="solar:alt-arrow-left-bold-duotone" width={24} />
                                        </button>
                                    </div>

                                    {/* Details Section */}
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                                                    {product.category?.name || "Général"}
                                                </span>
                                                {product.stock > 0 ? (
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase rounded-full">En stock</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-500/10 text-red-600 text-[10px] font-black uppercase rounded-full">Rupture</span>
                                                )}
                                            </div>

                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-black text-card-foreground leading-tight">{product.name}</h2>
                                                <p className="text-2xl font-black text-primary mt-2">{product.price.toLocaleString()} FCFA</p>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                    <Icon icon="solar:user-bold-duotone" width={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Vendeur</p>
                                                    <p className="text-sm font-black">{product.user?.fullName || "Boutique Officielle"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black uppercase text-muted-foreground px-1">Description</h3>
                                            <div className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/50" dangerouslySetInnerHTML={{ __html: product.description || "Aucune description disponible pour ce produit." }}>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-muted/50 rounded-xl">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Référence</p>
                                                <p className="text-xs font-black truncate">{product.sku || product.id.slice(0, 8).toUpperCase()}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-xl">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Localisation</p>
                                                <p className="text-xs font-black">Abidjan, CI</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                                <button
                                    onClick={handleNegotiate}
                                    disabled={isNegotiating}
                                    className="flex-1 py-4 px-6 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    {isNegotiating ? (
                                        <Icon icon="line-md:loading-twotone-loop" width={20} />
                                    ) : (
                                        <Icon icon="solar:chat-round-dots-bold-duotone" width={20} />
                                    )}
                                    Négocier
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-[2] py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Icon icon="solar:cart-large-bold-duotone" width={20} />
                                    Ajouter au panier
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
