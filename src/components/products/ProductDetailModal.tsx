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
    const [isExpanded, setIsExpanded] = useState(false);
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
            const participant2Id = product.user?.id || product.userId;
            if (!participant2Id) {
                addNotification("Impossible d'identifier le propriétaire du produit.", "error");
                return;
            }

            const res = await createChatConversation({
                participant2Id: participant2Id,
            });

            if (res.statusCode === 200 || res.statusCode === 201) {
                const initialMessage = `Bonjour, je suis intéressé par votre produit "${product.name}" (Prix: ${product.price.toLocaleString()} FCFA). Pouvons-nous en discuter ?`;
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
                        <motion.div className="bg-card shadow-2xl overflow-hidden flex flex-col md:w-[90%] md:max-w-2xl md:max-h-[90vh] md:rounded-[2.5rem] rounded-t-[2.5rem] w-full h-[90vh] md:h-auto pb-safe pointer-events-auto border border-border/50" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} >

                            {/* Header Handle for Mobile */}
                            <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden absolute top-0 left-0 right-0 z-20">
                                <div className="w-12 h-1.5 bg-white/30 backdrop-blur-md rounded-full shadow-sm" />
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
                                {/* Hero Image Section */}
                                <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden group">
                                    {product.imageUrl ? (
                                        <Image src={product.imageUrl} fill className="object-cover" alt={product.name} priority />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 bg-muted/50">
                                            <Icon icon="solar:box-bold-duotone" width={80} />
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                                    {/* Floating Controls */}
                                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                                        <button onClick={onClose} className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-2xl text-white transition-all active:scale-90 pointer-events-auto border border-white/30 shadow-xl">
                                            <Icon icon="solar:alt-arrow-left-bold-duotone" width={24} />
                                        </button>
                                        <div className="flex gap-2 pointer-events-auto">
                                            <span className="px-4 py-2 bg-white/20 backdrop-blur-xl text-white text-[10px] font-black uppercase rounded-xl border border-white/30 shadow-xl">
                                                {product.category?.name || "Premium"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Info Floating */}
                                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-white text-2xl font-black drop-shadow-lg leading-tight line-clamp-2">{product.name}</h2>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                                <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">En Stock</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Pricing Card */}
                                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Prix de vente</p>
                                            {product.pricePromo ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-3xl font-black text-primary">{product.pricePromo.toLocaleString()} <span className="text-sm">FCFA</span></p>
                                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-lg animate-pulse">
                                                            -{product.discountPercent}%
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-muted-foreground/60 line-through decoration-red-500/30">{product.price.toLocaleString()} FCFA</p>
                                                </div>
                                            ) : (
                                                <p className="text-3xl font-black text-primary">{product.price.toLocaleString()} <span className="text-sm">FCFA</span></p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white shadow-sm rounded-xl sm:rounded-2xl border border-border w-full max-w-full">

                                            {/* Icon */}
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <Icon icon="solar:shop-bold-duotone" className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0">
                                                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground leading-none mb-0.5 sm:mb-1">
                                                    Boutique
                                                </p>
                                                <p className="text-[11px] sm:text-xs font-black truncate">
                                                    {product.user?.fullName || "Officielle"}
                                                </p>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Description Section with Show More */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <Icon icon="solar:notes-bold-duotone" className="text-primary" />
                                            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Description du produit</h3>
                                        </div>

                                        <div className="relative">
                                            <motion.div animate={{ height: isExpanded ? "auto" : "90px" }} className="overflow-hidden" transition={{ type: "spring", damping: 20, stiffness: 100 }}>
                                                <div className="text-sm text-card-foreground/80 font-sans leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: product.description || "Aucune description détaillée n'est disponible pour l'instant." }} />
                                            </motion.div>

                                            {!isExpanded && (
                                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card via-card/50 to-transparent pointer-events-none" />
                                            )}
                                        </div>

                                        <button onClick={() => setIsExpanded(!isExpanded)} className="group flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest px-1 py-2 hover:opacity-80 transition-all" >
                                            {isExpanded ? "Voir moins" : "Voir plus de détails"}
                                            <Icon icon={isExpanded ? "solar:alt-arrow-up-bold-duotone" : "solar:alt-arrow-down-bold-duotone"} className="transition-transform group-hover:translate-y-0.5" />
                                        </button>
                                    </div>

                                    {/* Specs Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-muted/30 rounded-3xl border border-border/50 group hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon icon="solar:minimalistic-magnifer-bold-duotone" className="text-primary" />
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Référence SKU</p>
                                            </div>
                                            <p className="text-sm font-black text-card-foreground">{product.sku || product.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <div className="p-5 bg-muted/30 rounded-3xl border border-border/50 group hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon icon="solar:map-point-wave-bold-duotone" className="text-primary" />
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Disponibilité</p>
                                            </div>
                                            <p className="text-sm font-black text-card-foreground">Abidjan, CI</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Floating Footer */}
                            <div className="p-6 bg-card/80 backdrop-blur-2xl border-t border-border flex gap-4 shrink-0">
                                <button onClick={handleNegotiate} disabled={isNegotiating} className="p-4 bg-muted hover:bg-primary/10 text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 group border border-border" >
                                    {isNegotiating ? (
                                        <Icon icon="line-md:loading-twotone-loop" width={22} />
                                    ) : (
                                        <Icon icon="solar:chat-round-dots-bold-duotone" width={22} className="text-primary group-hover:scale-110 transition-transform" />
                                    )}
                                    <span className="hidden md:block">Négocier</span>
                                </button>
                                <button onClick={handleAddToCart} className="flex-1 py-4 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-[0_10px_30px_-10px_rgba(var(--primary),0.5)] flex items-center justify-center gap-3" >
                                    <Icon icon="solar:cart-large-bold-duotone" width={22} className="animate-pulse" /> Ajouter au panier
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
