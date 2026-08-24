"use client"


import { useState, useEffect, useCallback, use } from "react"
import { useQuery } from "@tanstack/react-query"
import { getProducts, getProductCategories, getPublicStoreInfo } from "@/api/api"
import { Product, CategoryProd, StoreUserInfo } from "@/types/interface"
import ProductCard from "@/components/products/cards/ProductCard"
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal"
import SearchInput from "@/components/shared/SearchInput"
import InfiniteScroll from "@/components/ui/InfiniteScroll"
import { Icon } from "@iconify/react"
import CategoryFilter from "@/components/ui/CategoryFilter"
import Image from "next/image"
import NotFound from "@/components/common/NotFound"
import Loader from "@/components/common/Loader"
import { ReviewSection } from "@/components/shared/ReviewSection"
import { restoreStoreName } from "@/utils/storeSlug"

type Props = { params: Promise<{ storeName: string }> }

const ITEMS_PER_PAGE = 10

export default function FournisseurPage(props: Props) {
    const { storeName } = use(props.params)
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedSubCategory, setSelectedSubCategory] = useState("all")
    const [products, setProducts] = useState<Product[]>([])
    const [page, setPage] = useState(1)
    const [minPrice, setMinPrice] = useState("")
    const [maxPrice, setMaxPrice] = useState("")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
    const [publicStore, setPublicStore] = useState<(StoreUserInfo) | null>(null)
    const [storeLoading, setStoreLoading] = useState(true)

    // Slug d'URL -> nom exploitable par les API existantes (voir src/utils/storeSlug.ts)
    const restoredStoreName = restoreStoreName(storeName)

    const fetchPublicStoreData = useCallback(async () => {
        try {
            const res = await getPublicStoreInfo(restoredStoreName)
            if (res.statusCode === 200 && res.data) {
                setPublicStore(res.data)
            }
        } catch (error) {
            console.error("Error fetching public store info:", error)
        } finally {
            setStoreLoading(false)
        }
    }, [restoredStoreName])

    useEffect(() => {
        fetchPublicStoreData()
    }, [fetchPublicStoreData])

    // Catégories produit — changent rarement ; useQuery les met en cache (staleTime 5 min,
    // voir QueryProvider.tsx) et les partage avec Boutique.tsx (même queryKey), évitant un
    // refetch réseau si l'utilisateur vient de visiter l'un puis l'autre.
    const { data: categoriesRes } = useQuery({
        queryKey: ["product-categories-all"],
        queryFn: () => getProductCategories(),
    })
    const categories: CategoryProd[] = categoriesRes?.statusCode === 200 ? (categoriesRes.data ?? []) : []

    // Load Products — toujours filtré sur le catalogue B2B (productType=SUPPLIER)
    const fetchProducts = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loading) return
        setLoading(true)

        try {
            const res = await getProducts({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: search || undefined,
                categoryId: selectedCategory === "all" ? undefined : selectedCategory,
                subCategoryId: selectedSubCategory === "all" ? undefined : selectedSubCategory,
                storeName: restoredStoreName || undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                productType: "SUPPLIER",
            })

            if (res.statusCode === 200 && res.data) {
                const newProducts = res.data.data
                setProducts(prev => isNewSearch ? newProducts : [...prev, ...newProducts])
                setHasMore(pageNum < res.data.totalPages)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            setHasMore(false)
        } finally {
            setLoading(false)
        }
    }, [search, selectedCategory, selectedSubCategory, restoredStoreName, minPrice, maxPrice])

    // Load more when page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) {
            fetchProducts(page, false)
        }
    }, [page, fetchProducts, restoredStoreName])

    const handleVoiceResult = (text: string) => {
        setSearch(text)
    }

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1)
        fetchProducts(1, true)
    }, [search, selectedCategory, selectedSubCategory, minPrice, maxPrice, fetchProducts, restoredStoreName])


    if (storeLoading) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <Loader title="Chargement du fournisseur..." description="Nous récupérons les informations de ce fournisseur, veuillez patienter." icon="mdi:warehouse" />
            </div>
        )
    }

    if (!publicStore) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <NotFound title="Fournisseur introuvable" description="Ce fournisseur n'existe pas ou n'est plus disponible. Vérifiez l'URL ou explorez d'autres fournisseurs sur la plateforme." icon="mdi:warehouse" />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Fournisseur Header */}
            <div className="flex flex-col items-center text-center w-full max-w-4xl mb-12 space-y-4">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-card border-4 border-background shadow-xl overflow-hidden mb-2">
                    {publicStore?.storeLogo ? (
                        <Image src={publicStore.storeLogo} alt={publicStore.storeName || "Fournisseur"} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Icon icon="mdi:warehouse" className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Fournisseur / Grossiste</span>
                    <h1 className="text-2xl md:text-4xl font-black text-foreground uppercase tracking-tight leading-none">
                        {publicStore?.storeName || restoredStoreName}
                    </h1>
                    <p className="text-xs md:text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
                        {publicStore?.productCount || 0} Produits
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 px-4 max-w-3xl">
                    <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">
                        {publicStore?.companyName || "Partenaire Djamko"}
                    </p>
                </div>
            </div>
            {/* Search Input */}
            <div className="w-full mb-2">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Rechercher un produit"
                    enableVoice
                    onVoiceOpen={() => setIsVoiceModalOpen(true)}
                />
            </div>
            {/* CATEGORIES & SUB-CATEGORIES FILTERS */}
            <div className="w-full max-w-3xl mx-auto mb-6">
                <CategoryFilter
                    categories={[
                        { id: "all", name: "Tous" },
                        ...categories.map(cat => ({
                            id: cat.id,
                            name: cat.name,
                            subCategories: cat.subCategories
                        }))
                    ]}
                    selectedCategoryId={selectedCategory}
                    selectedSubCategoryId={selectedSubCategory}
                    onCategoryChange={(id) => { setSelectedCategory(id); setSelectedSubCategory("all"); }}
                    onSubCategoryChange={setSelectedSubCategory}
                    hasSubCategories={true}
                    variant="cards"
                />
            </div>
            {/* Price range & view toggle */}
            <div className="w-full max-w-3xl mx-auto mb-6 flex flex-col md:flex-row items-center hide-scrollbar overflow-x-auto justify-between gap-4">
                <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-1 shadow-sm shrink-0 h-[36px] hide-scrollbar">
                    <Icon icon="solar:wad-of-money-bold-duotone" className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input type="number" placeholder="Prix min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-16 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground font-medium" />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input type="number" placeholder="Prix max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-16 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground font-medium" />
                </div>

                <div className="flex items-center bg-card border border-border/50 rounded-xl p-1 shadow-sm shrink-0 self-end md:self-auto hide-scrollbar">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Grille">
                        <Icon icon="solar:widget-5-bold-duotone" className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Liste">
                        <Icon icon="solar:list-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {/* Results */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                {!loading && products.length === 0 ? (
                    <NotFound title="Aucun produit disponible" description={search || selectedCategory !== "all" ? "Aucun produit ne correspond à votre recherche." : "Ce fournisseur n'a pas encore de produits disponibles."} icon="mdi:warehouse" />
                ) : (
                    <InfiniteScroll<Product>
                        items={products}
                        hasMore={hasMore}
                        isLoading={loading}
                        loadMore={() => setPage(prev => prev + 1)}
                        skeletonCount={6}
                        viewMode={viewMode}
                        renderItem={(product) => (
                            <ProductCard product={product} viewMode={viewMode} />
                        )}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                    />
                )}
            </div>
            {/* Review Section */}
            {publicStore && publicStore.id && (
                <div className="w-full max-w-4xl mx-auto px-4 mt-12">
                    <ReviewSection labelleServies="Fournisseur" targetUserId={publicStore.id} title={`Avis sur ${publicStore.storeName || 'ce fournisseur'}`} />
                </div>
            )}
            <VoiceSearchModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onResult={handleVoiceResult}
            />
        </div>
    );
}
