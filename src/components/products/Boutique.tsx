"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getProducts, getProductCategories } from "@/api/api"
import { Product, CategoryProd } from "@/types/interface"
import CategoryButton from "./CategoryButton"
import ProductCard from "./ProductCard"
import { Icon } from "@iconify/react"

const ITEMS_PER_PAGE = 6

export default function ProductsPage() {
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<CategoryProd[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)

    const loaderRef = useRef<HTMLDivElement | null>(null)

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
                page: pageNum, limit: ITEMS_PER_PAGE, query: search || undefined,
                categoryId: selectedCategory === "all" ? undefined : selectedCategory
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

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1)
        fetchProducts(1, true)
    }, [search, selectedCategory, fetchProducts])

    // Load more when page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) { fetchProducts(page, false) }
    }, [page, fetchProducts])

    // Infinite Scroll Observer
    useEffect(() => {

        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && hasMore && !loading) { setPage(prev => prev + 1) } },
            { threshold: 0.1 }
        )

        if (loaderRef.current) observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [hasMore, loading])

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">

            {/* Search Input */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-3 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input type="text" placeholder="Quel produit recherchez-vous ?" className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 md:text-sm placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} inputMode="text" style={{ fontSize: '16px' }} suppressHydrationWarning />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors animate-in fade-in zoom-in duration-200"
                            title="Effacer la recherche"
                        >
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                        </button>
                    )}
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
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                <div className="flex items-center justify-start md:justify-center w-full px-2 md:px-0 mb-6">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center">
                        {loading && products.length === 0 ? 'Chargement...' : products.length === 0 ? 'Aucun produit trouvé' : `${total} résultat${total > 1 ? 's' : ''}`}
                    </h3>
                </div>

                {/* PRODUCTS GRID */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Loading State / Trigger */}
                <div ref={loaderRef} className="w-full flex justify-center py-8">
                    {loading && (<Icon icon="eos-icons:loading" className="w-8 h-8 text-primary animate-spin" />)}
                    {!hasMore && products.length > 0 && total > ITEMS_PER_PAGE && (
                        <p className="text-muted-foreground text-sm font-medium italic">
                            Fin des résultats
                        </p>
                    )}
                </div>
            </div>

        </div>
    )
}