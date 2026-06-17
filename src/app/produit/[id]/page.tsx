"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { Product, productConditionLabels, StoreUserInfo } from "@/types/interface";
import { useCart } from "@/components/providers/CartProvider";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated, getUserId } from "@/lib/auth";
import { createChatConversation, getPublicStoreInfo, getProductById } from "@/api/api";
import ReportButton from "@/components/shared/ReportButton";
import TextDisplayBox from "@/components/home/TextDisplayBox";
import Link from "next/link";

export default function ProductDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [achatType, setAchatType] = useState<'UNITE' | 'GROS'>('UNITE');
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [storeInfo, setStoreInfo] = useState<StoreUserInfo | null>(null);
    const touchStartX = useRef<number>(0);

    const { addToCart } = useCart();
    const { addNotification } = useNotification();
    const router = useRouter();

    const slugify = (name: string) =>
        name.trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");

    const resolveImages = (p: Product | null) => {
        if (!p) return [];
        if (p.files && p.files.length > 0) return p.files.map(f => f.fileUrl).filter(Boolean);
        if (p.images && p.images.length > 0) return p.images;
        if (p.imageUrl) return [p.imageUrl];
        return [];
    };

    const imagesList = resolveImages(product);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getProductById(id);
            if (res.statusCode === 200 && res.data) setProduct(res.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [id]);

    const fetchPublicStoreData = useCallback(async (storeName: string) => {
        try {
            const res = await getPublicStoreInfo(storeName);
            if (res.statusCode === 200 && res.data) setStoreInfo(res.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchProduct(); }, [fetchProduct]);

    useEffect(() => {
        const storeName = product?.user?.storeName;
        if (storeName) fetchPublicStoreData(storeName);
    }, [product?.user?.storeName, fetchPublicStoreData]);

    // ── Navigation images ────────────────────────────────────────────────
    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex(p => (p + 1) % imagesList.length);
    };
    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex(p => (p - 1 + imagesList.length) % imagesList.length);
    };

    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextImage() : prevImage();
    };

    // ── Actions ──────────────────────────────────────────────────────────
    const handleAddToCart = () => {
        if (!product) return;
        addToCart(product, 1, achatType);
        addNotification(`"${product.name}" ajouté au panier${achatType === 'GROS' ? ' (Gros)' : ''}`, "success");
    };

    const handleBuyNow = () => {
        if (!product) return;
        addToCart(product, 1, achatType);
        router.push('/cart');
    };

    const handleNegotiate = async () => {
        if (!product) return;
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
            if (!participant2Id) { addNotification("Impossible d'identifier le propriétaire.", "error"); return; }
            const res = await createChatConversation({ participant2Id });
            if (res.statusCode === 200 || res.statusCode === 201) {
                const initialMessage = `Bonjour, je suis intéressé par votre produit "${product.name}" (Prix: ${product.price.toLocaleString()} FCFA). Pouvons-nous en discuter ?`;
                sessionStorage.setItem("pending_negotiation", JSON.stringify({ conversationId: res.data.id, message: initialMessage, productId: product.id }));
                router.push("/chat-ia");
            } else {
                addNotification("Erreur lors de la création de la conversation", "error");
            }
        } catch { addNotification("Une erreur est survenue", "error"); }
        finally { setIsNegotiating(false); }
    };

    // ── Skeleton ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-dvh bg-[#FBFAF6] dark:bg-zinc-900">
                <div className="h-14 border-b border-[#EEF1F4] dark:border-zinc-800 flex items-center px-5 gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-40 rounded-full bg-muted animate-pulse mx-auto" />
                </div>
                <div className="md:grid md:grid-cols-2">
                    <div className="h-[46vh] md:h-[420px] bg-muted animate-pulse" />
                    <div className="p-6 space-y-4">
                        <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
                        <div className="h-6 w-3/4 rounded-full bg-muted animate-pulse" />
                        <div className="h-8 w-32 rounded-full bg-muted animate-pulse" />
                        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
                        <div className="grid grid-cols-2 gap-2">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-dvh bg-[#FBFAF6] dark:bg-zinc-900 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Icon icon="solar:box-bold-duotone" width={64} className="opacity-30" />
                <p className="font-black text-lg">Produit introuvable</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-sm">
                    Retour
                </button>
            </div>
        );
    }

    const displayPrice = achatType === 'GROS' && product.prixVenteGros
        ? product.prixVenteGros
        : product.pricePromo ?? product.price;
    const originalPrice = achatType === 'GROS' ? null : (product.pricePromo ? product.price : null);
    const discount = achatType !== 'GROS' ? product.discountPercent : null;

    // ── IMAGE CAROUSEL ────────────────────────────────────────────────────
    const ImageCarousel = ({ className = "" }: { className?: string }) => (
        <div
            className={`relative overflow-hidden bg-muted/20 ${className}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <AnimatePresence mode="wait">
                {imagesList.length > 0 ? (
                    <motion.div key={currentImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-cover blur-3xl opacity-30 scale-110" alt="" aria-hidden />
                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-contain z-10 p-3 cursor-zoom-in" alt={`${product.name} - ${currentImageIndex + 1}`} onClick={() => setLightboxOpen(true)} />
                    </motion.div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                        <Icon icon="solar:box-bold-duotone" width={80} />
                    </div>
                )}
            </AnimatePresence>
            {discount && (
                <div className="absolute top-3 left-14 z-20 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow md:left-3">
                    -{discount}%
                </div>
            )}
            {imagesList.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                        <Icon icon="solar:alt-arrow-left-bold" width={16} />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                        <Icon icon="solar:alt-arrow-right-bold" width={16} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                        {imagesList.slice(0, 8).map((_, idx) => (
                            <button key={idx} onClick={e => { e.stopPropagation(); setCurrentImageIndex(idx); }} className={`rounded-full transition-all duration-300 ${currentImageIndex === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40"}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    // ── SELLER CARD ───────────────────────────────────────────────────────
    const SellerCard = () => (
        <Link href={`/shop/${slugify(storeInfo?.storeName || "boutique")}`}>
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-3 hover:border-primary/30 transition">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden shrink-0 ring-2 ring-primary/20">
                        {storeInfo?.storeLogo ? (
                            <Image src={storeInfo.storeLogo} alt={storeInfo.storeName || "Boutique"} fill className="object-cover" unoptimized />
                        ) : (
                            <Icon icon="solar:shop-bold-duotone" className="w-7 h-7 text-primary" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Boutique</p>
                        <p className="text-sm font-black truncate">{storeInfo?.storeName || "Officielle"}</p>
                    </div>
                    <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                {storeInfo?.productCount !== undefined && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-2">
                        <span className="flex items-center gap-1">
                            <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                            <strong className="text-foreground">{storeInfo.productCount}</strong> articles
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );

    // ── PRICE SECTION ─────────────────────────────────────────────────────
    const PriceSection = () => (
        <div className="space-y-3">
            {product.typeVente === 'GROS' && (
                <div className="flex gap-2">
                    {(['UNITE', 'GROS'] as const).map(t => (
                        <label key={t} className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-all flex-1 ${achatType === t ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                            <input type="radio" name="achatType" value={t} checked={achatType === t} onChange={() => setAchatType(t)} className="hidden" />
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${achatType === t ? 'border-primary' : 'border-muted-foreground'}`}>
                                {achatType === t && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="text-xs font-bold">{t === 'UNITE' ? "À l'unité" : "En gros"}</span>
                        </label>
                    ))}
                </div>
            )}
            <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-black text-emerald-600 leading-none">
                    {displayPrice.toLocaleString()} <span className="text-base">FCFA</span>
                </span>
                {originalPrice && (
                    <span className="text-base font-bold text-muted-foreground/60 line-through leading-none">
                        {originalPrice.toLocaleString()} FCFA
                    </span>
                )}
                {achatType === 'GROS' && product.prixVenteGros && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg">PRIX GROS</span>
                )}
            </div>
        </div>
    );

    // ── SPECS ─────────────────────────────────────────────────────────────
    const Specs = () => (
        <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">État</p>
                <p className="text-xs font-black">{productConditionLabels[product.etat] || product.etat}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Référence</p>
                <p className="text-xs font-black truncate uppercase">{product.sku || product.id.slice(0, 8)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Catégorie</p>
                <p className="text-xs font-black truncate">{product.category?.name || "—"}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Stock</p>
                <p className={`text-xs font-black ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {product.stock > 0 ? `${product.stock} dispo` : "Épuisé"}
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-[#FBFAF6] dark:bg-zinc-900 text-[#0F2944] dark:text-white flex flex-col">

            {/* ══════════════════════ HEADER ══════════════════════ */}
            <div className="sticky top-0 z-50 h-14 shrink-0 flex items-center justify-between px-5 bg-[#FBFAF6]/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-[#EEF1F4] dark:border-zinc-800">
                <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-accent transition">
                    <Icon icon="solar:alt-arrow-left-bold-duotone" width={18} />
                </button>
                <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-black truncate max-w-[55%]">{product.name}</h2>
                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                        <Icon icon="solar:heart-bold-duotone" width={18} />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                        <Icon icon="solar:share-bold-duotone" width={18} />
                    </button>
                    <ReportButton entityType="PRODUCT" entityId={product.id} />
                </div>
            </div>

            {/* ══════════════════════ BODY ══════════════════════ */}
            <div className="flex-1">

                {/* ── DESKTOP LAYOUT (grid 2 cols) ── */}
                <div className="hidden md:grid md:grid-cols-2 gap-0">
                    {/* Left: image */}
                    <div className="flex flex-col bg-muted/20 sticky top-14 self-start">
                        <div className="relative w-full overflow-hidden" style={{ height: 460 }}>
                            <AnimatePresence mode="wait">
                                {imagesList.length > 0 ? (
                                    <motion.div key={currentImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-cover blur-3xl opacity-30 scale-110" alt="" aria-hidden />
                                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-contain z-10 p-4 cursor-zoom-in" alt={product.name} onClick={() => setLightboxOpen(true)} />
                                    </motion.div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                                        <Icon icon="solar:box-bold-duotone" width={80} />
                                    </div>
                                )}
                            </AnimatePresence>
                            {discount && (
                                <div className="absolute top-3 left-3 z-20 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">-{discount}%</div>
                            )}
                            {imagesList.length > 1 && (
                                <>
                                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                                        <Icon icon="solar:alt-arrow-left-bold" width={16} />
                                    </button>
                                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                                        <Icon icon="solar:alt-arrow-right-bold" width={16} />
                                    </button>
                                </>
                            )}
                        </div>
                        {/* Miniatures */}
                        {imagesList.length > 1 && (
                            <div className="flex gap-2 p-3 flex-wrap">
                                {imagesList.slice(0, 6).map((img, idx) => (
                                    <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 relative ${currentImageIndex === idx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}>
                                        <Image src={img} fill unoptimized className="object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: details */}
                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                                {product.category?.name || "Produit"}
                            </span>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${product.stock > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                                {product.stock > 0 ? "En Stock" : "Épuisé"}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black leading-tight">{product.name}</h1>
                        <PriceSection />
                        {product.user && <SellerCard />}
                        <TextDisplayBox text={product.description || "Aucune description disponible."} expandable isHtml />
                        <Specs />
                        <div className="flex justify-end">
                            <ReportButton entityType="PRODUCT" entityId={product.id} />
                        </div>
                    </div>
                </div>

                {/* ── MOBILE LAYOUT ── */}
                <div className="md:hidden flex flex-col">
                    {/* Floating top actions */}
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                        <button className="w-9 h-9 bg-black/20 backdrop-blur-md rounded-full text-white flex items-center justify-center">
                            <Icon icon="solar:heart-bold-duotone" width={18} />
                        </button>
                        <button className="w-9 h-9 bg-black/20 backdrop-blur-md rounded-full text-white flex items-center justify-center">
                            <Icon icon="solar:share-bold-duotone" width={18} />
                        </button>
                    </div>

                    {/* Image carousel */}
                    <div className="relative w-full" style={{ height: "46vh" }}>
                        <ImageCarousel className="h-full" />
                    </div>

                    {/* Content */}
                    <div className="px-4 pt-4 pb-32 space-y-4">
                        <div className="space-y-1">
                            <PriceSection />
                            <h1 className="text-lg font-black leading-snug text-[#0F2944] dark:text-white">{product.name}</h1>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                                {product.category?.name || "Produit"}
                            </span>
                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${product.stock > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                                {product.stock > 0 ? "En Stock" : "Épuisé"}
                            </span>
                        </div>

                        {/* Seller */}
                        {product.user && (
                            <Link href={`/shop/${slugify(storeInfo?.storeName || "boutique")}`}>
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
                                    <div className="w-11 h-11 rounded-full bg-primary/10 relative overflow-hidden shrink-0 ring-2 ring-primary/10">
                                        {storeInfo?.storeLogo ? (
                                            <Image src={storeInfo.storeLogo} alt="" fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon icon="solar:shop-bold-duotone" className="w-6 h-6 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black truncate">{storeInfo?.storeName || "Boutique officielle"}</p>
                                        {storeInfo?.productCount !== undefined && (
                                            <p className="text-[11px] text-muted-foreground">{storeInfo.productCount} articles</p>
                                        )}
                                    </div>
                                    <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-muted-foreground shrink-0" />
                                </div>
                            </Link>
                        )}

                        {/* Contact vendeur */}
                        <button onClick={handleNegotiate} disabled={isNegotiating}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted hover:bg-accent border border-border font-black text-sm transition active:scale-95">
                            {isNegotiating
                                ? <Icon icon="line-md:loading-twotone-loop" width={18} />
                                : <Icon icon="solar:chat-round-dots-bold-duotone" width={18} className="text-primary" />}
                            Contacter le vendeur
                        </button>

                        {/* Description */}
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-muted-foreground">Description</p>
                            <TextDisplayBox text={product.description || "Aucune description disponible."} expandable isHtml />
                        </div>

                        {/* Specs */}
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-muted-foreground">Détails</p>
                            <Specs />
                        </div>

                        <div className="flex justify-end pb-2">
                            <ReportButton entityType="PRODUCT" entityId={product.id} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════ FOOTER ACTIONS ══════════════════════ */}
            <div className="sticky bottom-0 z-50 shrink-0 px-4 py-3 bg-[#FBFAF6]/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-[#EEF1F4] dark:border-zinc-800">
                {/* Desktop */}
                <div className="hidden md:flex gap-3">
                    <button onClick={handleNegotiate} disabled={isNegotiating}
                        className="py-3 px-5 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center gap-2">
                        {isNegotiating ? <Icon icon="line-md:loading-twotone-loop" width={18} /> : <Icon icon="solar:chat-round-dots-bold-duotone" width={18} className="text-primary" />}
                        Discuter
                    </button>
                    <button onClick={handleBuyNow}
                        className="py-3 px-5 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center gap-2 border border-border">
                        <Icon icon="solar:bag-bold-duotone" width={18} className="text-primary" />
                        Acheter
                    </button>
                    <button onClick={handleAddToCart}
                        className="flex-1 py-3 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                        <Icon icon="solar:cart-large-bold-duotone" width={18} />
                        Ajouter au panier
                    </button>
                </div>
                {/* Mobile */}
                <div className="flex md:hidden gap-2">
                    <button onClick={handleNegotiate} disabled={isNegotiating}
                        className="py-3.5 px-4 bg-muted hover:bg-accent border border-border rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center gap-2">
                        {isNegotiating ? <Icon icon="line-md:loading-twotone-loop" width={18} /> : <Icon icon="solar:chat-round-dots-bold-duotone" width={18} className="text-primary" />}
                    </button>
                    <button onClick={handleAddToCart}
                        className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                        <Icon icon="solar:cart-large-bold-duotone" width={18} />
                        Ajouter au panier
                    </button>
                </div>
            </div>

            {/* ══════════════════════ LIGHTBOX ══════════════════════ */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-black/95 flex items-center justify-center"
                        onClick={() => setLightboxOpen(false)}>
                        <button
                            onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                            <Icon icon="solar:close-bold" width={20} />
                        </button>
                        {imagesList.length > 1 && (
                            <>
                                <button onClick={e => { e.stopPropagation(); prevImage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                                    <Icon icon="solar:alt-arrow-left-bold" width={20} />
                                </button>
                                <button onClick={e => { e.stopPropagation(); nextImage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                                    <Icon icon="solar:alt-arrow-right-bold" width={20} />
                                </button>
                            </>
                        )}
                        <motion.div key={currentImageIndex} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full h-full max-w-3xl max-h-[90vh] mx-4">
                            <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-contain" alt={product.name} />
                        </motion.div>
                        {imagesList.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {imagesList.slice(0, 8).map((_, idx) => (
                                    <button key={idx} onClick={e => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                        className={`rounded-full transition-all ${currentImageIndex === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/30"}`} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
