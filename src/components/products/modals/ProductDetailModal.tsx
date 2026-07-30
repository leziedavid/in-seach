"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Product } from "@/types/interface";
import { createPortal } from "react-dom";
import ReportButton from "@/components/shared/ReportButton";
import { Share } from "@/components/shared/Share";
import { isSensitiveProduct } from "@/utils/sensitiveProduct";
import SupplierQuoteRequestModal from "@/components/fournisseur/modals/SupplierQuoteRequestModal";
import { useProductDetail } from "@/components/products/detail/useProductDetail";
import ProductImageGallery from "@/components/products/detail/ProductImageGallery";
import ProductSellerCard from "@/components/products/detail/ProductSellerCard";
import SimilarProducts from "@/components/products/detail/SimilarProducts";
import { CategoryChip, PriceBlock, DetailAccordions, ProductFooter } from "@/components/products/detail/ProductDetailShared";

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export default function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    // Sections repliables — un seul panneau ouvert à la fois (AccordionSection), toutes
    // fermées au chargement. Les infos essentielles (prix, mode d'achat, vendeur) restent
    // toujours visibles, hors accordéon.
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { if (isOpen) setActiveAccordion(null); }, [isOpen, product?.id]);

    const {
        product: displayProduct, imagesList, storeInfo,
        achatType, setAchatType, isNegotiating, isRevealed, setIsRevealed,
        displayPrice, originalPrice, discount,
        handleAddToCart, handleNegotiate,
    } = useProductDetail(isOpen ? product?.id : undefined, product);

    if (!displayProduct || !mounted) return null;

    const isSupplierProduct = displayProduct.productType === 'SUPPLIER';
    const isSensitive = isSensitiveProduct(displayProduct);
    const toggleAccordion = (id: string) => setActiveAccordion(prev => prev === id ? null : id);

    return [createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]" />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none">

                        <motion.div
                            initial={{ scale: 0.97, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.05, type: "spring", damping: 25 }}
                            className="bg-[#FBFAF6] dark:bg-zinc-900 text-[#0F2944] dark:text-white overflow-hidden flex flex-col w-full h-dvh rounded-none md:w-[92%] md:max-w-4xl md:max-h-[88vh] md:rounded-3xl md:shadow-[0_8px_48px_rgba(15,41,68,0.16)] md:h-auto pointer-events-auto">

                            {/* ══ DESKTOP HEADER ══ */}
                            <div className="hidden md:flex h-14 shrink-0 items-center justify-between px-5 bg-[#FBFAF6]/95 dark:bg-zinc-900/95 border-b border-[#EEF1F4] dark:border-zinc-800">
                                <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-accent transition">
                                    <Icon icon="solar:alt-arrow-left-bold-duotone" width={18} />
                                </button>
                                <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-black truncate max-w-[50%]">{displayProduct.name}</h2>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                        <Icon icon="solar:heart-bold-duotone" width={18} />
                                    </button>
                                    <button onClick={() => setIsShareOpen(true)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                        <Icon icon="solar:share-bold-duotone" width={18} />
                                    </button>
                                    <ReportButton entityType="PRODUCT" entityId={displayProduct.id} />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {/* ══ DESKTOP LAYOUT (grille 2 colonnes) ══ */}
                                <div className="hidden md:grid md:grid-cols-2 gap-0">
                                    <div className="flex flex-col bg-muted/20">
                                        <ProductImageGallery
                                            images={imagesList} alt={displayProduct.name}
                                            isSensitive={isSensitive} isRevealed={isRevealed} onToggleReveal={() => setIsRevealed(r => !r)}
                                            discount={discount} showThumbnails heightClassName="" className="h-[420px]"
                                        />
                                    </div>
                                    <div className="p-6 overflow-y-auto space-y-5 max-h-[calc(88vh-56px-84px)]">
                                        <CategoryChip category={displayProduct.category?.name} inStock={displayProduct.stock > 0} />
                                        <h2 className="text-2xl font-black leading-tight">{displayProduct.name}</h2>
                                        <PriceBlock achatType={achatType} setAchatType={setAchatType} typeVente={displayProduct.typeVente} displayPrice={displayPrice} originalPrice={originalPrice} prixVenteGros={displayProduct.prixVenteGros} />
                                        {displayProduct.user && <ProductSellerCard storeInfo={storeInfo} />}
                                        <DetailAccordions
                                            activeAccordion={activeAccordion} onToggle={toggleAccordion}
                                            description={displayProduct.description} product={displayProduct}
                                        />
                                    </div>
                                </div>

                                {/* ══ MOBILE LAYOUT (plein écran, scroll) ══ */}
                                <div className="md:hidden flex flex-col">
                                    <div className="relative">
                                        <ProductImageGallery
                                            images={imagesList} alt={displayProduct.name}
                                            isSensitive={isSensitive} isRevealed={isRevealed} onToggleReveal={() => setIsRevealed(r => !r)}
                                            discount={discount} onBack={onClose} heightClassName="h-[42vh]"
                                        />
                                        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                                            <button className="w-9 h-9 bg-black/20 backdrop-blur-md rounded-full text-white flex items-center justify-center">
                                                <Icon icon="solar:heart-bold-duotone" width={18} />
                                            </button>
                                            <button onClick={() => setIsShareOpen(true)} className="w-9 h-9 bg-black/20 backdrop-blur-md rounded-full text-white flex items-center justify-center">
                                                <Icon icon="solar:share-bold-duotone" width={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-white dark:bg-zinc-900 px-4 pt-5 pb-4 space-y-4">
                                        <CategoryChip category={displayProduct.category?.name} inStock={displayProduct.stock > 0} />
                                        <h1 className="text-xl font-black leading-snug tracking-tight">{displayProduct.name}</h1>
                                        <PriceBlock achatType={achatType} setAchatType={setAchatType} typeVente={displayProduct.typeVente} displayPrice={displayPrice} originalPrice={originalPrice} prixVenteGros={displayProduct.prixVenteGros} />

                                        {displayProduct.user && <ProductSellerCard storeInfo={storeInfo} />}

                                        <DetailAccordions
                                            activeAccordion={activeAccordion} onToggle={toggleAccordion}
                                            description={displayProduct.description} product={displayProduct}
                                        />

                                        <div className="pt-2">
                                            <SimilarProducts productId={displayProduct.id} />
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <ReportButton entityType="PRODUCT" entityId={displayProduct.id} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ══ FOOTER ══ */}
                            <ProductFooter
                                displayPrice={displayPrice}
                                isSupplierProduct={isSupplierProduct}
                                isNegotiating={isNegotiating}
                                onNegotiate={handleNegotiate}
                                onAddToCart={handleAddToCart}
                                onRequestQuote={() => setIsQuoteModalOpen(true)}
                            />
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    ), createPortal(
        <Share
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            url={`${process.env.NEXT_PUBLIC_BASE_URL}/produit/${displayProduct.id || ""}`}
            title={displayProduct.name}
            description={displayProduct.description || undefined}
            image={displayProduct.imageUrl || undefined}
            price={displayProduct.pricePromo || displayProduct.price}
            storeName={storeInfo?.storeName || ''}
            storeLogo={displayProduct.user?.storeLogo || displayProduct.user?.avatar}
        />,
        document.body
    ), isSupplierProduct && (
        <SupplierQuoteRequestModal
            key="supplier-quote-modal"
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            product={displayProduct}
        />
    )];
}
