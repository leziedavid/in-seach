"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { Product, productConditionLabels, StoreUserInfo } from "@/types/interface";
import { createPortal } from "react-dom";
import { useCart } from "@/components/providers/CartProvider";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUserId } from "@/lib/auth";
import { createChatConversation, getPublicStoreInfo, getStoreUserInfo } from "@/api/api";
import TextDisplayBox from "@/components/home/TextDisplayBox";
import Link from "next/link"


interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export default function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {

    const [mounted, setMounted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [achatType, setAchatType] = useState<'UNITE' | 'GROS'>('UNITE');
    const { addToCart } = useCart();
    const { addNotification } = useNotification();
    const router = useRouter();

    const [storeInfo, setStoreInfo] = useState<StoreUserInfo | null>(null)
    const [newStoreName, setNewStoreName] = useState("")

    const slugify = (name: string) => {
        return name
            .trim()
            .replace(/\s+/g, "-")        // remplace les espaces par -
            .replace(/[^\w\-]+/g, "")    // supprime les caractères spéciaux
    }


    const imagesList = product?.images && product.images.length > 0 ? product.images : (product?.imageUrl ? [product.imageUrl] : []);
    useEffect(() => { setMounted(true); }, []);

    const fetchPublicStoreData = useCallback(async () => {
        try {
            const res = await getPublicStoreInfo(product?.user?.storeName || "")
            if (res.statusCode === 200 && res.data) {
                setStoreInfo(res.data)
            }
        } catch (error) {
            console.error("Error fetching public store info:", error)
        }
    }, [product?.user?.storeName])

    useEffect(() => {
        if (isOpen && product?.user?.storeName) {
            fetchPublicStoreData()
        }
        if (isOpen && product) {
            setAchatType('UNITE');
        }
    }, [fetchPublicStoreData, isOpen, product?.user?.storeName, product])

    if (!product || !mounted) return null;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
    };

    const handleAddToCart = () => {
        addToCart(product, 1, achatType);
        addNotification(`"${product.name}" ajouté au panier${achatType === 'GROS' ? ' (Gros)' : ''}`, "success");
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
                        <motion.div className="bg-card shadow-2xl overflow-hidden flex flex-col md:w-[90%] md:max-w-4xl md:max-h-[85vh] md:rounded-3xl rounded-t-[2.5rem] w-full h-[85vh] md:h-auto pb-safe pointer-events-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >

                            {/* Handle for Mobile */}
                            <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden"><div className="w-12 h-1.5 bg-muted rounded-full" /></div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="grid md:grid-cols-2 gap-0 md:gap-6">
                                    {/* Image Section / Carousel */}
                                    <div className="bg-muted/20 md:h-full">
                                        <div className="relative aspect-square w-full overflow-hidden group bg-muted/40">
                                            <AnimatePresence mode="wait">
                                                {imagesList.length > 0 ? (
                                                    <motion.div key={currentImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0" >
                                                        {/* Blurred Ambient Background */}
                                                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-cover blur-3xl opacity-40 scale-110" alt="" aria-hidden="true" />
                                                        {/* Main Content Image */}
                                                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-contain relative z-10 p-4" alt={`${product.name} - ${currentImageIndex + 1}`} />
                                                    </motion.div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                        <Icon icon="solar:box-bold-duotone" width={80} />
                                                    </div>
                                                )}
                                            </AnimatePresence>

                                            <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white transition hover:bg-black/40 z-30">
                                                <Icon icon="solar:alt-arrow-left-bold-duotone" width={24} />
                                            </button>

                                            {imagesList.length > 1 && (
                                                <>
                                                    <div className="absolute inset-y-0 left-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <button onClick={prevImage} className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition">
                                                            <Icon icon="solar:alt-arrow-left-bold" width={20} />
                                                        </button>
                                                    </div>
                                                    <div className="absolute inset-y-0 right-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <button onClick={nextImage} className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition">
                                                            <Icon icon="solar:alt-arrow-right-bold" width={20} />
                                                        </button>
                                                    </div>

                                                    {/* Vertical Dots for consistency */}
                                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-2 z-30">
                                                        {imagesList.slice(0, 8).map((_, idx) => (
                                                            <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }} className={`w-1.5 rounded-full transition-all duration-500 ${currentImageIndex === idx ? "bg-primary h-8 ring-4 ring-primary/20" : "bg-white/30 hover:bg-white/60 h-1.5"}`} />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details Section */}
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                                                        {product.category?.name || "Produit"}
                                                    </span>
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase rounded-full">En Stock</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                                        <Icon icon="solar:heart-bold-duotone" width={20} />
                                                    </button>
                                                    <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                                        <Icon icon="solar:share-bold-duotone" width={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-black text-card-foreground leading-tight">{product.name}</h2>
                                                <div className="flex flex-col gap-2 mt-2">
                                                    {product.typeVente === 'GROS' && (
                                                        <div className="flex gap-4 w-full mb-2">
                                                            <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${achatType === 'UNITE' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                                                                <input type="radio" name="achatType" value="UNITE" checked={achatType === 'UNITE'} onChange={() => setAchatType('UNITE')} className="hidden" />
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${achatType === 'UNITE' ? 'border-primary' : 'border-muted-foreground'}`}>
                                                                    {achatType === 'UNITE' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                                </div>
                                                                <span className="text-sm font-bold text-foreground">À l'unité</span>
                                                            </label>
                                                            <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${achatType === 'GROS' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                                                                <input type="radio" name="achatType" value="GROS" checked={achatType === 'GROS'} onChange={() => setAchatType('GROS')} className="hidden" />
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${achatType === 'GROS' ? 'border-primary' : 'border-muted-foreground'}`}>
                                                                    {achatType === 'GROS' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                                </div>
                                                                <span className="text-sm font-bold text-foreground">En gros</span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    {achatType === 'GROS' && product.prixVenteGros ? (
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-2xl font-black text-primary">{product.prixVenteGros.toLocaleString()} <span className="text-sm">FCFA</span></p>
                                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg">PRIX DE GROS</span>
                                                        </div>
                                                    ) : (
                                                        product.pricePromo ? (
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-2xl font-black text-primary">{product.pricePromo.toLocaleString()} <span className="text-sm">FCFA</span></p>
                                                                <p className="text-sm font-bold text-muted-foreground/60 line-through decoration-red-500/30">{product.price.toLocaleString()} FCFA</p>
                                                                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-lg">-{product.discountPercent}%</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-2xl font-black text-primary">{product.price.toLocaleString()} <span className="text-sm">FCFA</span></p>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {product.user && (
                                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
                                                    <Link href={`/shop/${slugify(storeInfo?.storeName || "boutique")}`}>
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden cursor-pointer group">
                                                            {storeInfo?.storeLogo ? (
                                                                <Image src={storeInfo.storeLogo} alt={storeInfo.storeName || "Boutique"} fill className="object-cover" unoptimized />
                                                            ) : (
                                                                <Icon icon="solar:shop-bold-duotone" className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                                                            )}
                                                            <div className="absolute bottom-0 right-0 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
                                                                <Icon icon="solar:eye-bold" className="w-3 h-3 text-primary group-hover:scale-110 transition" />
                                                            </div>
                                                        </div>
                                                    </Link>

                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Boutique</p>
                                                        <p className="text-sm font-black leading-none">{storeInfo?.storeName || "Officielle"}</p>
                                                    </div>

                                                </div>
                                            )}
                                        </div>

                                        <TextDisplayBox text={product.description || "Aucune description disponible."} expandable={true} isHtml={true} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-muted/50 rounded-xl">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">État</p>
                                                <p className="text-xs font-black">{productConditionLabels[product.etat] || product.etat}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-xl">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Référence</p>
                                                <p className="text-xs font-black truncate uppercase">{product.sku || product.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                                <button onClick={handleNegotiate} disabled={isNegotiating} className="flex-1 py-4 px-6 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2">
                                    {isNegotiating ? (
                                        <Icon icon="line-md:loading-twotone-loop" width={20} />
                                    ) : (
                                        <Icon icon="solar:chat-round-dots-bold-duotone" width={20} className="text-primary" />
                                    )}
                                    Discuter
                                </button>
                                <button onClick={handleAddToCart} className="flex-[2] py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
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
