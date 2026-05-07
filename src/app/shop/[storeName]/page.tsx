"use client"


import { useState, useEffect, useRef, useCallback, use } from "react"
import { getProducts, getProductCategories, getStoreUserInfo, getPublicStoreInfo } from "@/api/api"
import { Product, CategoryProd, StoreUserInfo } from "@/types/interface"
import ProductCard from "@/components/products/cards/ProductCard"
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal"
import InfiniteScroll from "@/components/ui/InfiniteScroll"
import CategoryButton from "@/components/products/sections/CategoryButton"
import { Icon } from "@iconify/react"
import Image from "next/image"

type Props = { params: Promise<{ storeName: string }> }

const ITEMS_PER_PAGE = 10

export default function StorePage(props: Props) {
    const { storeName } = use(props.params)
    const [store, setStore] = useState<any>(null)
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<CategoryProd[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
    const [publicStore, setPublicStore] = useState<(StoreUserInfo) | null>(null)

    // 🔥 fonction pour nettoyer le slug → remettre les espaces

    const cleanStoreName = (slug: string) => {
        return slug?.replace(/-/g, " ").trim()
    }

    const fetchPublicStoreData = useCallback(async () => {
        try {
            const res = await getPublicStoreInfo(storeName)
            if (res.statusCode === 200 && res.data) {
                setPublicStore(res.data)
            }
        } catch (error) {
            console.error("Error fetching public store info:", error)
        }
    }, [storeName])

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
                storeName: cleanStoreName(storeName) || undefined,
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
    }, [search, selectedCategory])

    // Load more when page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) {
            fetchProducts(page, false)
        }
    }, [page, fetchProducts, storeName])

    const handleVoiceResult = (text: string) => {
        setSearch(text)
    }

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1)
        fetchProducts(1, true)
    }, [search, selectedCategory, fetchProducts, storeName])


    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Store Header */}
            <div className="flex flex-col items-center text-center w-full max-w-4xl mb-12 space-y-4">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-card border-4 border-background shadow-xl overflow-hidden mb-2">
                    {publicStore?.storeLogo ? (
                        <Image src={publicStore.storeLogo} alt={publicStore.storeName || "Boutique"} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Icon icon="solar:shop-bold-duotone" className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h1 className="text-2xl md:text-4xl font-black text-foreground uppercase tracking-tight leading-none">
                        {publicStore?.storeName || cleanStoreName(storeName)}
                    </h1>
                    <p className="text-xs md:text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
                        {publicStore?.productCount || 0} Produits
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 px-4 max-w-3xl">
                    <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">
                        {publicStore?.companyName || "Partenaire Tarafé"}
                    </p>
                </div>

            </div>

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

            {/* CATEGORIES SCROLL */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide w-full justify-start md:justify-center">
                <CategoryButton label="Tous" active={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
                {categories.map((cat) => (
                    <CategoryButton key={cat.id} label={cat.name} active={selectedCategory === cat.id} onClick={() => setSelectedCategory(cat.id)} />
                ))}
            </div>

            {/* Results count header */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <div className="flex items-center justify-start md:justify-center w-full px-2 md:px-0 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic">
                        {loading && products.length === 0 ? 'Chargement...' : products.length === 0 ? ' ' : `${total} résultat${total > 1 ? 's' : ''}`}
                    </h3>
                </div>

                <InfiniteScroll
                    items={products}
                    hasMore={hasMore}
                    isLoading={loading}
                    loadMore={() => setPage(prev => prev + 1)}
                    skeletonType="product"
                    skeletonCount={3}
                    renderItem={(product) => (
                        <ProductCard key={product.id} product={product} />
                    )}
                    className="w-full"
                />
            </div>

            <VoiceSearchModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onResult={handleVoiceResult}
            />
        </div>
    )
}