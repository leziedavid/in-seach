"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getProducts, getProductCategories } from "@/api/api"
import { Product, CategoryProd } from "@/types/interface"
import CategoryButton from "@/components/products/sections/CategoryButton"
import ProductCard from "@/components/products/cards/ProductCard"
import { Icon } from "@iconify/react"
import NotFound from "@/components/common/NotFound"
import Loader from "@/components/common/Loader"
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal"

import InfiniteScroll from "@/components/ui/InfiniteScroll"
import CategoryFilter from "@/components/ui/CategoryFilter"

const ITEMS_PER_PAGE = 10

export default function ProductsPage() {

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
    // Ref pour éviter la stale closure sur `loading` dans le useCallback
    const loadingRef = useRef(false)

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
        if (loadingRef.current) return
        loadingRef.current = true
        setLoading(true)

        try {
            const res = await getProducts({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: search || undefined,
                categoryId: selectedCategory === "all" ? undefined : selectedCategory,
                subCategoryId: selectedSubCategory === "all" ? undefined : selectedSubCategory,
                typeVente: typeVente === "ALL" ? undefined : typeVente,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined
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
            loadingRef.current = false
            setLoading(false)
        }
    }, [search, selectedCategory, selectedSubCategory, typeVente, minPrice, maxPrice])

    // Load more when page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) {
            fetchProducts(page, false)
        }
    }, [page, fetchProducts])

    const handleVoiceResult = (text: string) => {
        setSearch(text)
    }

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1)
        fetchProducts(1, true)
    }, [search, selectedCategory, selectedSubCategory, typeVente, minPrice, maxPrice, fetchProducts])

    const activeCategoryData = categories.find(c => c.id === selectedCategory);

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Search Input */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-3 shadow-sm hover:border-secondary transition-colors focus-within:border-secondary">
                    <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input type="text" placeholder="Quel produit recherchez-vous ?" className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button type="button" onClick={() => setSearch("")} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                        </button>
                    )}
                    <button type="button" onClick={() => setIsVoiceModalOpen(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-90">
                        <Icon icon="solar:microphone-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* CATEGORIES & SUB-CATEGORIES FILTERS */}
            <div className="w-full max-w-3xl mx-auto mb-2">
                <CategoryFilter
                    categories={[
                        { id: "all", name: "Tous" },
                        ...categories.map(c => ({
                            id: c.id,
                            name: c.name,
                            subCategories: c.subCategories
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
            <div className="w-full max-w-3xl mx-auto mb-2 flex flex-col md:flex-row items-center justify-between gap-4 hide-scrollbar ">

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
                    <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-1 shadow-sm shrink-0 h-[36px]">
                        <Icon icon="solar:wad-of-money-bold-duotone" className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input type="number" placeholder="Prix min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-16 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground font-medium" />
                        <span className="text-muted-foreground text-xs">-</span>
                        <input type="number" placeholder="Prix max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-16 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground font-medium" />
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-card border border-border/50 rounded-xl p-1 shadow-sm shrink-0 self-end md:self-auto  hide-scrollbar ">
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
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic">
                        {!loading && products.length > 0 ? `${total} résultat${total > 1 ? 's' : ''}` : ''}
                    </h3>
                </div>

                {loading && products.length === 0 ? (
                    <Loader
                        title="Chargement des produits..."
                        description="Nous préparons votre boutique, veuillez patienter."
                        icon="solar:bag-4-bold-duotone"
                    />
                ) : !loading && products.length === 0 ? (
                    <NotFound
                        title="Aucun produit trouvé"
                        description="Aucun produit ne correspond à votre recherche. Essayez d'autres mots-clés ou une autre catégorie."
                        icon="solar:bag-4-bold-duotone"
                    />
                ) : (
                    <InfiniteScroll
                        items={products}
                        hasMore={hasMore}
                        isLoading={loading}
                        loadMore={() => setPage(prev => prev + 1)}
                        skeletonType="product"
                        skeletonCount={3}
                        renderItem={(product) => (
                            <ProductCard key={product.id} product={product} viewMode={viewMode} />
                        )}
                        // className="w-full"
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                    />
                )}
            </div>

            <VoiceSearchModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onResult={handleVoiceResult}
            />
        </div>
    )
}