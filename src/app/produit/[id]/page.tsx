"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import ReportButton from "@/components/shared/ReportButton";
import { Share } from "@/components/shared/Share";
import { isSensitiveProduct } from "@/utils/sensitiveProduct";
import SupplierQuoteRequestModal from "@/components/fournisseur/modals/SupplierQuoteRequestModal";
import { useProductDetail } from "@/components/products/detail/useProductDetail";
import ProductImageGallery from "@/components/products/detail/ProductImageGallery";
import ProductSellerCard from "@/components/products/detail/ProductSellerCard";
import SimilarProducts from "@/components/products/detail/SimilarProducts";
import { CategoryChip, PriceBlock, DetailAccordions, ProductFooter, RestaurantAccompagnementSection, RestaurantProductFooter } from "@/components/products/detail/ProductDetailShared";
import NotFound from "@/components/common/NotFound";

export default function ProductDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    const {
        product, loading, imagesList, storeInfo,
        achatType, setAchatType, isNegotiating, isRevealed, setIsRevealed,
        displayPrice, originalPrice, discount,
        handleAddToCart, handleNegotiate,
        includedAccompagnement, extraOptions, selectedExtraIds, toggleExtra,
        quantity, setQuantity,
    } = useProductDetail(id);

    const toggleAccordion = (accId: string) => setActiveAccordion(prev => prev === accId ? null : accId);

    // ── SKELETON ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <div className="md:hidden flex flex-col min-h-dvh">
                    <div className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 bg-background/95 backdrop-blur-md border-b border-border">
                        <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                        <div className="flex gap-2">
                            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                        </div>
                    </div>
                    <div className="h-[42vh] bg-muted animate-pulse" />
                    <div className="p-4 space-y-4 flex-1">
                        <div className="h-8 w-32 rounded-full bg-muted animate-pulse" />
                        <div className="h-5 w-3/4 rounded-full bg-muted animate-pulse" />
                        <div className="h-16 rounded-2xl bg-muted animate-pulse" />
                        <div className="h-20 rounded-3xl bg-muted animate-pulse" />
                        <div className="h-14 rounded-2xl bg-muted animate-pulse" />
                        <div className="h-14 rounded-2xl bg-muted animate-pulse" />
                    </div>
                </div>
                <div className="hidden md:block w-full max-w-4xl mx-auto px-4 py-6">
                    <div className="bg-card overflow-hidden rounded-3xl">
                        <div className="h-14 flex items-center justify-between px-6 border-b border-border">
                            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                            <div className="h-4 w-48 rounded-full bg-muted animate-pulse" />
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="h-[420px] bg-muted animate-pulse" />
                            <div className="p-6 space-y-4">
                                <div className="h-6 w-32 rounded-full bg-muted animate-pulse" />
                                <div className="h-7 w-3/4 rounded-full bg-muted animate-pulse" />
                                <div className="h-10 w-36 rounded-full bg-muted animate-pulse" />
                                <div className="h-20 rounded-3xl bg-muted animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-16">
                <NotFound title="Produit introuvable" description="Ce produit n'existe pas ou n'est plus disponible." icon="solar:box-bold-duotone" />
                <button onClick={() => router.back()} className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-sm">
                    Retour
                </button>
            </div>
        );
    }

    const isSupplierProduct = product.productType === 'SUPPLIER';
    const isRestaurantProduct = product.productType === 'RESTAURANT';
    const isSensitive = isSensitiveProduct(product);

    return (
        <>
            {/* ══ MOBILE ══ */}
            <div className="md:hidden flex flex-col min-h-dvh bg-[#FBFAF6] dark:bg-zinc-900 text-[#0F2944] dark:text-white">
                <div className="relative">
                    <ProductImageGallery
                        images={imagesList} alt={product.name}
                        isSensitive={isSensitive} isRevealed={isRevealed} onToggleReveal={() => setIsRevealed(r => !r)}
                        discount={discount} onBack={() => router.back()} heightClassName="h-[42vh]"
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

                <div className="flex-1 px-4 pt-5 pb-32 space-y-4">
                    <CategoryChip category={product.category?.name} inStock={product.stock > 0} />
                    <h1 className="text-xl font-black leading-snug tracking-tight">{product.name}</h1>
                    <PriceBlock achatType={achatType} setAchatType={setAchatType} typeVente={product.typeVente} displayPrice={displayPrice} originalPrice={originalPrice} prixVenteGros={product.prixVenteGros} />

                    {!isRestaurantProduct && product.user && <ProductSellerCard storeInfo={storeInfo} />}

                    <DetailAccordions activeAccordion={activeAccordion} onToggle={toggleAccordion} description={product.description} product={product} hideEtat={isRestaurantProduct} />

                    {isRestaurantProduct && (
                        <RestaurantAccompagnementSection
                            includedAccompagnement={includedAccompagnement}
                            extraOptions={extraOptions}
                            selectedExtraIds={selectedExtraIds}
                            onToggleExtra={toggleExtra}
                        />
                    )}

                    <div className="pt-2">
                        <SimilarProducts productId={product.id} />
                    </div>

                    <div className="flex justify-end pb-2">
                        <ReportButton entityType="PRODUCT" entityId={product.id} />
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-50">
                    {isRestaurantProduct ? (
                        <RestaurantProductFooter
                            displayPrice={displayPrice}
                            quantity={quantity}
                            onIncrement={() => setQuantity(q => q + 1)}
                            onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
                            onAddToCart={handleAddToCart}
                        />
                    ) : (
                        <ProductFooter
                            displayPrice={displayPrice}
                            isSupplierProduct={isSupplierProduct}
                            isNegotiating={isNegotiating}
                            onNegotiate={handleNegotiate}
                            onAddToCart={handleAddToCart}
                            onRequestQuote={() => setIsQuoteModalOpen(true)}
                        />
                    )}
                </div>
            </div>

            {/* ══ DESKTOP ══ */}
            <div className="hidden md:block w-full max-w-4xl mx-auto px-4 py-6">
                <div className="bg-card overflow-hidden rounded-3xl border border-border/50 shadow-sm">
                    <div className="h-14 flex items-center justify-between px-6 border-b border-border/50">
                        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-accent transition">
                            <Icon icon="solar:alt-arrow-left-bold-duotone" width={18} />
                        </button>
                        <h2 className="text-sm font-black truncate max-w-[50%]">{product.name}</h2>
                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                <Icon icon="solar:heart-bold-duotone" width={18} />
                            </button>
                            <button onClick={() => setIsShareOpen(true)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                <Icon icon="solar:share-bold-duotone" width={18} />
                            </button>
                            <ReportButton entityType="PRODUCT" entityId={product.id} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2">
                        <div className="flex flex-col bg-muted/20">
                            <ProductImageGallery
                                images={imagesList} alt={product.name}
                                isSensitive={isSensitive} isRevealed={isRevealed} onToggleReveal={() => setIsRevealed(r => !r)}
                                discount={discount} showThumbnails heightClassName="" className="h-[420px]"
                            />
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(420px+56px)]">
                            <CategoryChip category={product.category?.name} inStock={product.stock > 0} />
                            <h1 className="text-2xl font-black leading-tight">{product.name}</h1>
                            <PriceBlock achatType={achatType} setAchatType={setAchatType} typeVente={product.typeVente} displayPrice={displayPrice} originalPrice={originalPrice} prixVenteGros={product.prixVenteGros} />
                            {!isRestaurantProduct && product.user && <ProductSellerCard storeInfo={storeInfo} />}
                            <DetailAccordions activeAccordion={activeAccordion} onToggle={toggleAccordion} description={product.description} product={product} hideEtat={isRestaurantProduct} />
                            {isRestaurantProduct && (
                                <RestaurantAccompagnementSection
                                    includedAccompagnement={includedAccompagnement}
                                    extraOptions={extraOptions}
                                    selectedExtraIds={selectedExtraIds}
                                    onToggleExtra={toggleExtra}
                                />
                            )}
                        </div>
                    </div>

                    {isRestaurantProduct ? (
                        <RestaurantProductFooter
                            displayPrice={displayPrice}
                            quantity={quantity}
                            onIncrement={() => setQuantity(q => q + 1)}
                            onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
                            onAddToCart={handleAddToCart}
                        />
                    ) : (
                        <ProductFooter
                            displayPrice={displayPrice}
                            isSupplierProduct={isSupplierProduct}
                            isNegotiating={isNegotiating}
                            onNegotiate={handleNegotiate}
                            onAddToCart={handleAddToCart}
                            onRequestQuote={() => setIsQuoteModalOpen(true)}
                        />
                    )}
                </div>

                <div className="mt-8">
                    <SimilarProducts productId={product.id} />
                </div>
            </div>

            <Share
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                url={`${process.env.NEXT_PUBLIC_BASE_URL}/produit/${product.id || ""}`}
                title={product.name}
                description={product.description || undefined}
                image={product.imageUrl || undefined}
                price={product.pricePromo || product.price}
                storeName={storeInfo?.storeName || ''}
                storeLogo={product.user?.storeLogo || product.user?.avatar}
            />
            {isSupplierProduct && (
                <SupplierQuoteRequestModal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} product={product} />
            )}
        </>
    );
}
