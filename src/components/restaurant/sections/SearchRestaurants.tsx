"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { getRestaurants, getRestaurantTypes } from "@/api/api";
import { Restaurant, RestaurantType } from "@/types/interface";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import CategoryFilter from "@/components/ui/CategoryFilter";
import NotFound from "@/components/common/NotFound";
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";
import SearchInput from "@/components/shared/SearchInput";

const ITEMS_PER_PAGE = 12;

/**
 * Liste des restaurants — calquée sur SearchFournisseurs.tsx/SearchGarage.tsx (même
 * emplacement dans AppTabs.tsx, même InfiniteScroll). Le filtre par type de cuisine
 * réutilise CategoryFilter en variant "cards" (icônes rondes), alimenté par RestaurantType.
 */
export default function SearchRestaurants() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [types, setTypes] = useState<RestaurantType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState("all");

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    useEffect(() => {
        getRestaurantTypes(true).then(res => { if (res.statusCode === 200 && res.data) setTypes(res.data); });
    }, []);

    const fetchRestaurants = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        setLoading(true);
        try {
            const res = await getRestaurants({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: search || undefined,
                typeId: selectedTypeId === "all" ? undefined : selectedTypeId,
            });
            if (res.statusCode === 200 && res.data) {
                const newItems = res.data.data;
                setRestaurants(prev => isNewSearch ? newItems : [...prev, ...newItems]);
                setHasMore(pageNum < res.data.totalPages);
            } else {
                setHasMore(false);
            }
        } catch {
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [search, selectedTypeId]);

    useEffect(() => {
        setPage(1);
        fetchRestaurants(1, true);
    }, [search, selectedTypeId, fetchRestaurants]);

    useEffect(() => {
        if (page > 1) fetchRestaurants(page, false);
    }, [page, fetchRestaurants]);

    const goToRestaurant = (slug: string) => router.push(`/restaurant/${slug}`);

    const prepTimeLabel = (r: Restaurant) => {
        if (r.preparationTimeMin != null && r.preparationTimeMax != null) return `${r.preparationTimeMin} – ${r.preparationTimeMax} min`;
        if (r.preparationTimeMin != null) return `${r.preparationTimeMin} min`;
        return null;
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Recherche */}
            <div className="w-full mb-4">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    leadingIcon="solar:chef-hat-bold-duotone"
                    placeholder="Rechercher un restaurant..."
                />
            </div>

            {/* Types de cuisine — icônes rondes en scroll horizontal */}
            {types.length > 0 && (
                <div className="w-full max-w-3xl mx-auto mb-6">
                    <CategoryFilter variant="cards" categories={[{ id: "all", name: "Tous" }, ...types.map(t => ({ id: t.id, name: t.name, image: t.icon }))]} selectedCategoryId={selectedTypeId} onCategoryChange={setSelectedTypeId} />
                </div>
            )}

            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">

                {!loading && restaurants.length === 0 ? (
                    <NotFound title="Aucun restaurant trouvé" description={search || selectedTypeId !== "all" ? "Aucun restaurant ne correspond à votre recherche." : "Aucun restaurant n'est disponible pour le moment."} icon="solar:chef-hat-bold-duotone" />
                ) : (
                    <>
                        <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4">
                            <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center leading-tight"> </h3>
                            {restaurants.length > 0 && (
                                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                            )}
                        </div>

                        <InfiniteScroll<Restaurant>
                            items={restaurants}
                            hasMore={hasMore}
                            isLoading={loading}
                            loadMore={() => setPage(prev => prev + 1)}
                            skeletonCount={6}
                            gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                            renderItem={(restaurant) => (
                                <button onClick={() => goToRestaurant(restaurant.slug)} className="group text-left rounded-2xl overflow-hidden border border-border/40 bg-card hover:border-primary/40 hover:shadow-lg transition-all w-full">
                                    <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                                        {restaurant.coverPhoto ? (
                                            <Image src={restaurant.coverPhoto} alt={restaurant.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                                <Icon icon="solar:chef-hat-bold-duotone" className="w-12 h-12 text-primary" />
                                            </div>
                                        )}
                                        {!restaurant.isActive && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white text-xs font-black uppercase tracking-widest">Fermé</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h3 className="font-black text-foreground truncate flex-1">{restaurant.name}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {(restaurant.types || []).map(t => t.name).join(", ") || "Restaurant"}
                                        </p>
                                        {prepTimeLabel(restaurant) && (
                                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                                <Icon icon="solar:scooter-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                                                {prepTimeLabel(restaurant)}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            )}
                        />
                    </>
                )}

            </div>
        </div>
    );
}
