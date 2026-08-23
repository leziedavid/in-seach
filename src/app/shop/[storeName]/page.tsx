"use client"


import { useState, useEffect, useRef, useCallback, use } from "react"
import { getProducts, getProductCategories, getStoreUserInfo, getPublicStoreInfo } from "@/api/api"
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

export default function StorePage(props: Props) {
    const { storeName } = use(props.params)
    const [store, setStore] = useState<any>(null)
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedSubCategory, setSelectedSubCategory] = useState("all")
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<CategoryProd[]>([])
    const [page, setPage] = useState(1)
    const [typeVente, setTypeVente] = useState("ALL")
    const [minPrice, setMinPrice] = useState("")
    const [maxPrice, setMaxPrice] = useState("")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
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


    // Load Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getProductCategories()
                if (res.statusCode === 200 && res.data) {
                    setCategories(res.data)
                }
            } catch (error) {
                console.error("Error fetching product categories:", error)
            }
        }
        fetchCategories()
    }, [])

    // Load Products
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
                typeVente: typeVente === "ALL" ? undefined : typeVente,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
            })

            if (res.statusCode === 200 && res.data) {
                const newProducts = res.data.data
                setProducts(prev => isNewSearch ? newProducts : [...prev, ...newProducts])
                setHasMore(pageNum < res.data.totalPages)
                setTotal(res.data.total)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            setHasMore(false)
        } finally {
            setLoading(false)
        }
    }, [search, selectedCategory, selectedSubCategory, restoredStoreName, typeVente, minPrice, maxPrice])

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
    }, [search, selectedCategory, selectedSubCategory, typeVente, minPrice, maxPrice, fetchProducts, restoredStoreName])


    if (storeLoading) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <Loader
                    title="Chargement de la boutique..."
                    description="Nous récupérons les informations de cette boutique, veuillez patienter."
                    icon="solar:shop-bold-duotone"
                />
            </div>
        )
    }

    if (!publicStore) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <NotFound
                    title="Boutique introuvable"
                    description="Cette boutique n'existe pas ou n'est plus disponible. Vérifiez l'URL ou explorez d'autres boutiques sur la plateforme."
                    icon="solar:shop-bold-duotone"
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Store Header — même UI que /restaurant/[slug] (cover + logo "chapeau" + nom en dessous) */}
            <div className="w-full max-w-4xl mb-8">
                <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden bg-muted mb-[-3rem]">
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Icon icon="solar:shop-bold-duotone" className="w-16 h-16 text-primary" />
                    </div>
                </div>
                <div className="flex items-end gap-4 px-4">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card border-4 border-background shadow-xl overflow-hidden shrink-0">
                        {publicStore?.storeLogo ? (
                            <Image src={publicStore.storeLogo} alt={publicStore.storeName || "Boutique"} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Icon icon="solar:shop-bold-duotone" className="w-8 h-8 text-primary" />
                            </div>
                        )}
                    </div>
                </div>
                {/* Nom de la boutique — en flux normal (pas dans la rangée qui chevauche la cover)
                    pour ne jamais se retrouver masqué derrière la photo de couverture. */}
                <div className="min-w-0 px-4 mt-3">
                    <h1 className="text-xl md:text-3xl font-black text-foreground truncate">{publicStore?.storeName || restoredStoreName}</h1>
                    <p className="text-xs md:text-sm font-bold text-muted-foreground truncate">
                        {publicStore?.productCount || 0} Produits
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 px-4">
                    {publicStore?.companyName && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <Icon icon="solar:buildings-2-bold-duotone" className="w-4 h-4 text-primary" />
                            {publicStore.companyName}
                        </span>
                    )}
                    {publicStore?.phone && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <Icon icon="solar:phone-bold-duotone" className="w-4 h-4 text-primary" />
                            {publicStore.indicatif ? `${publicStore.indicatif} ` : ''}{publicStore.phone}
                        </span>
                    )}
                </div>
            </div>
            {/* Search Input */}
            <div className="w-full mb-2">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Quel produit recherchez-vous ?"
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
                    onCategoryChange={(id) => {
                        setSelectedCategory(id);
                        setSelectedSubCategory("all");
                    }}
                    onSubCategoryChange={setSelectedSubCategory}
                    hasSubCategories={true}
                />
            </div>
            {/* NEW FILTERS & VIEW TOGGLE */}
            <div className="w-full max-w-3xl mx-auto mb-6 flex flex-col md:flex-row items-center hide-scrollbar overflow-x-auto justify-between gap-4">

                <div className="flex w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2 items-center">
                    {/* Type de vente */}
                    <div className="flex items-center bg-card border border-border/50 rounded-xl p-1 shadow-sm shrink-0">
                        <button onClick={() => setTypeVente("ALL")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${typeVente === "ALL" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
                            <Icon icon="solar:shop-bold-duotone" className="w-4 h-4" /> Tous
                        </button>
                        <button onClick={() => setTypeVente("UNITE")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${typeVente === "UNITE" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
                            <Icon icon="solar:box-minimalistic-bold-duotone" className="w-4 h-4" /> Unité
                        </button>
                        <button onClick={() => setTypeVente("GROS")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${typeVente === "GROS" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
                            <Icon icon="solar:boxes-bold-duotone" className="w-4 h-4" /> Gros
                        </button>
                    </div>

                    {/* Price Range */}
                    <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-1 shadow-sm shrink-0 h-[36px] hide-scrollbar">
                        <Icon icon="solar:wad-of-money-bold-duotone" className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input type="number" placeholder="Prix min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-16 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground font-medium" />
                        <span className="text-muted-foreground text-xs">-</span>
                        <input type="number" placeholder="Prix max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-16 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground font-medium" />
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-card border border-border/50 rounded-xl p-1 shadow-sm shrink-0 self-end md:self-auto  hide-scrollbar">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Grille">
                        <Icon icon="solar:widget-5-bold-duotone" className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Liste">
                        <Icon icon="solar:list-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {/* Results count header */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <div className="flex items-center justify-start md:justify-center w-full px-2 md:px-0 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic"> </h3>
                </div>

                {/* ✅ NotFound seulement si vraiment vide ET chargement terminé */}
                {!loading && products.length === 0 ? (
                    <NotFound title="Aucun produit disponible" description={search || selectedCategory !== "all" ? "Aucun produit ne correspond à votre recherche." : "Cette boutique n'a pas encore de produits disponibles."} icon="solar:bag-4-bold-duotone" />
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
                    <ReviewSection
                        labelleServies="Boutique"
                        targetUserId={publicStore.id}
                        title={`Avis sur ${publicStore.storeName || 'la boutique'}`}
                    />
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