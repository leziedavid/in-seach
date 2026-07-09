"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import ProductCard from "@/components/products/cards/ProductCard"
import InfiniteScroll from "@/components/ui/InfiniteScroll"
import BoostedContentTabs from "@/components/boost/BoostedContentTabs"
import { Product } from "@/types/interface"

interface ProductsManagementContentProps {
    loading: boolean;
    products: Product[];
    total: number;
    search: string;
    setSearch: (v: string) => void;
    setIsVoiceModalOpen: (v: boolean) => void;
    hasMore: boolean;
    setPage: (fn: (prev: number) => number) => void;
    openEditModal: (product: Product) => void;
    handleDeleteProduct: (id: string) => void;
    handleToggleStatus: (product: Product, value: boolean) => void;
    openLiveModal: (product?: Product) => void;
    storeName: string;
}

export default function ProductsManagementContent({ loading, products, total, search, setSearch, setIsVoiceModalOpen, hasMore, setPage, openEditModal, handleDeleteProduct, handleToggleStatus, openLiveModal, storeName, }: ProductsManagementContentProps) {

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const myProducts = (
        <>
            <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4 border-b border-border pb-4">
                <h3 className="text-lg font-black text-foreground">
                    {loading && products.length === 0 ? 'Chargement...' : products.length === 0 ? 'Ma Boutique' : `Mes Produits (${total})`}
                </h3>
                {/* Toggle grid / liste */}
                <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`} title="Vue liste">
                        <Icon icon="solar:list-bold-duotone" className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Vue grille">
                        <Icon icon="solar:widget-bold-duotone" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex w-full bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm focus-within:border-primary transition-all mb-4">
                <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                <input type="text" placeholder="Rechercher dans mes produits..." className="flex-1 bg-transparent text-foreground outline-none text-sm placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
                <button type="button" onClick={() => setIsVoiceModalOpen(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-90" title="Recherche vocale" >
                    <Icon icon="solar:microphone-bold-duotone" className="w-5 h-5" />
                </button>
            </div>
            <InfiniteScroll
                items={products}
                hasMore={hasMore}
                isLoading={loading}
                loadMore={() => setPage(prev => prev + 1)}
                skeletonType="product"
                skeletonCount={3}
                gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "flex flex-col gap-2"}
                renderItem={(product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={openEditModal}
                        onDelete={handleDeleteProduct}
                        onStatusChange={handleToggleStatus}
                        onCreateLive={(p) => openLiveModal(p)}
                        storeNames={storeName}
                        viewMode={viewMode}
                    />
                )}
                className="w-full"
            />
        </>
    );

    return (
        <BoostedContentTabs entityType="PRODUCT" entityLabel="produit" entityLabelPlural="Produits" iconMine="solar:bag-heart-bold-duotone">
            {myProducts}
        </BoostedContentTabs>
    );
}
