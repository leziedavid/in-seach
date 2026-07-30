"use client"

import { useState, useEffect, useCallback, use } from "react"
import { getProducts, getProductCategories, getRestaurantBySlug } from "@/api/api"
import { Product, CategoryProd, Restaurant } from "@/types/interface"
import ProductCard from "@/components/products/cards/ProductCard"
import InfiniteScroll from "@/components/ui/InfiniteScroll"
import { Icon } from "@iconify/react"
import CategoryFilter from "@/components/ui/CategoryFilter"
import Image from "next/image"
import NotFound from "@/components/common/NotFound"
import Loader from "@/components/common/Loader"
import { ReviewSection } from "@/components/shared/ReviewSection"

type Props = { params: Promise<{ slug: string }> }

const ITEMS_PER_PAGE = 12

export default function RestaurantMenuPage(props: Props) {
    const { slug } = use(props.params)
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [restaurantLoading, setRestaurantLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [categories, setCategories] = useState<CategoryProd[]>([])
    const [items, setItems] = useState<Product[]>([])
    const [page, setPage] = useState(1)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)

    const fetchRestaurant = useCallback(async () => {
        setRestaurantLoading(true)
        try {
            const res = await getRestaurantBySlug(slug)
            if (res.statusCode === 200 && res.data) setRestaurant(res.data)
        } finally {
            setRestaurantLoading(false)
        }
    }, [slug])

    useEffect(() => { fetchRestaurant() }, [fetchRestaurant])

    useEffect(() => {
        getProductCategories(true, 'RESTAURANT').then(res => {
            if (res.statusCode === 200 && res.data) setCategories(res.data)
        })
    }, [])

    const fetchMenu = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (!restaurant) return
        setLoading(true)
        try {
            const res = await getProducts({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: search || undefined,
                categoryId: selectedCategory === "all" ? undefined : selectedCategory,
                productType: 'RESTAURANT',
                restaurantId: restaurant.id,
            })
            if (res.statusCode === 200 && res.data) {
                const newItems = res.data.data
                setItems(prev => isNewSearch ? newItems : [...prev, ...newItems])
                setHasMore(pageNum < res.data.totalPages)
            } else {
                setHasMore(false)
            }
        } catch {
            setHasMore(false)
        } finally {
            setLoading(false)
        }
    }, [restaurant, search, selectedCategory])

    useEffect(() => {
        if (restaurant) {
            setPage(1)
            fetchMenu(1, true)
        }
    }, [restaurant, search, selectedCategory, fetchMenu])

    useEffect(() => {
        if (page > 1) fetchMenu(page, false)
    }, [page, fetchMenu])

    const prepTimeLabel = restaurant?.preparationTimeMin != null && restaurant?.preparationTimeMax != null
        ? `${restaurant.preparationTimeMin} – ${restaurant.preparationTimeMax} min`
        : null

    if (restaurantLoading) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <Loader title="Chargement du restaurant..." description="Nous récupérons les informations de ce restaurant." icon="solar:chef-hat-bold-duotone" />
            </div>
        )
    }

    if (!restaurant) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <NotFound title="Restaurant introuvable" description="Ce restaurant n'existe pas ou n'est plus disponible." icon="solar:chef-hat-bold-duotone" />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Header restaurant */}
            <div className="w-full max-w-4xl mb-8">
                <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden bg-muted mb-[-3rem]">
                    {restaurant.coverPhoto ? (
                        <Image src={restaurant.coverPhoto} alt={restaurant.name} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Icon icon="solar:chef-hat-bold-duotone" className="w-16 h-16 text-primary" />
                        </div>
                    )}
                </div>
                <div className="flex items-end gap-4 px-4">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card border-4 border-background shadow-xl overflow-hidden shrink-0">
                        {restaurant.logo ? (
                            <Image src={restaurant.logo} alt={restaurant.name} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Icon icon="solar:chef-hat-bold-duotone" className="w-8 h-8 text-primary" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 pb-1">
                        <h1 className="text-xl md:text-3xl font-black text-foreground truncate">{restaurant.name}</h1>
                        <p className="text-xs md:text-sm font-bold text-muted-foreground truncate">
                            {(restaurant.types || []).map(t => t.name).join(" • ") || "Restaurant"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 px-4">
                    {prepTimeLabel && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <Icon icon="solar:scooter-bold-duotone" className="w-4 h-4 text-primary" />
                            {prepTimeLabel}
                        </span>
                    )}
                    {restaurant.address && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary" />
                            {restaurant.address}
                        </span>
                    )}
                    {restaurant.phone && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <Icon icon="solar:phone-bold-duotone" className="w-4 h-4 text-primary" />
                            {restaurant.phone}
                        </span>
                    )}
                </div>

                {restaurant.description && (
                    <p className="text-sm text-muted-foreground mt-4 px-4">{restaurant.description}</p>
                )}
            </div>

            {/* Recherche */}
            <div className="flex items-center justify-center w-full max-w-2xl mb-6">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2.5 shadow-sm hover:border-secondary transition-colors focus-within:border-secondary">
                    <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                    <input type="text" placeholder="Rechercher un plat..." className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button type="button" onClick={() => setSearch("")} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Catégories de menu */}
            {categories.length > 0 && (
                <div className="w-full max-w-3xl mx-auto mb-6">
                    <CategoryFilter
                        categories={[{ id: "all", name: "Tout le menu" }, ...categories.map(cat => ({ id: cat.id, name: cat.name }))]}
                        selectedCategoryId={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                    />
                </div>
            )}

            {/* Toggle vue */}
            <div className="w-full max-w-4xl mx-auto mb-4 flex justify-end px-2">
                <div className="flex items-center bg-card border border-border/50 rounded-xl p-1 shadow-sm">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Grille">
                        <Icon icon="solar:widget-5-bold-duotone" className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Liste">
                        <Icon icon="solar:list-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Menu */}
            <div className="w-full max-w-4xl mx-auto px-0 md:px-4">
                {!loading && items.length === 0 ? (
                    <NotFound title="Aucun plat disponible" description={search || selectedCategory !== "all" ? "Aucun plat ne correspond à votre recherche." : "Ce restaurant n'a pas encore de plats au menu."} icon="solar:chef-hat-bold-duotone" />
                ) : (
                    <InfiniteScroll<Product>
                        items={items}
                        hasMore={hasMore}
                        isLoading={loading}
                        loadMore={() => setPage(prev => prev + 1)}
                        skeletonCount={6}
                        viewMode={viewMode}
                        skeletonType="product"
                        renderItem={(product) => (
                            <ProductCard product={product} viewMode={viewMode} />
                        )}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                    />
                )}
            </div>

            {/* Avis — scopés au restaurant précis (un même propriétaire peut en avoir plusieurs) */}
            <div className="w-full max-w-4xl mx-auto px-4 mt-12">
                <ReviewSection
                    labelleServies="Restaurant"
                    targetUserId={restaurant.userId}
                    targetEntityId={restaurant.id}
                    title={`Avis sur ${restaurant.name}`}
                />
            </div>
        </div>
    );
}
