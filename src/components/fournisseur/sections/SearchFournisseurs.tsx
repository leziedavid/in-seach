"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StoreUserInfo } from "@/types/interface";
import { getAllStores } from "@/api/api";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import { createStoreSlug } from "@/utils/storeSlug";

type Fournisseur = StoreUserInfo & { productCount: number; id: string };

const ITEMS_PER_PAGE = 12;

export default function SearchFournisseurs() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const fetchFournisseurs = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const res = await getAllStores({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                storeName: query || undefined,
                productType: "SUPPLIER",
            });

            if (res.statusCode === 200 && res.data) {
                const newItems = res.data.data as Fournisseur[];
                setFournisseurs(prev => isNewSearch ? newItems : [...prev, ...newItems]);
                setHasMore(pageNum < res.data.totalPages);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching fournisseurs:", error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        setPage(1);
        fetchFournisseurs(1, true);
    }, [query, fetchFournisseurs]);

    useEffect(() => {
        if (page > 1) fetchFournisseurs(page, false);
    }, [page, fetchFournisseurs]);

    const goToFournisseur = (storeName?: string) => {
        if (!storeName) return;
        router.push(`/fournisseur/${createStoreSlug(storeName)}`);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Search Input */}
            <form onSubmit={e => e.preventDefault()} className="flex flex-row items-stretch justify-center gap-2 w-full max-w-2xl mb-4 relative">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="mdi:warehouse" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input value={query} type="text" placeholder="Rechercher un fournisseur ou grossiste..."
                        className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 placeholder:text-muted-foreground"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery("")} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </form>

            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center leading-tight"> </h3>
                    {fournisseurs.length > 0 && (
                        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    )}
                </div>

                {loading && fournisseurs.length === 0 ? (
                    <Loader
                        title="Recherche de fournisseurs..."
                        description="Nous recherchons les fournisseurs et grossistes correspondant à vos critères."
                        icon="mdi:warehouse"
                    />
                ) : !loading && fournisseurs.length === 0 ? (
                    <NotFound
                        title="Aucun fournisseur trouvé"
                        description="Aucun fournisseur ou grossiste ne correspond à votre recherche."
                        icon="mdi:warehouse"
                    />
                ) : (
                    <InfiniteScroll
                        items={fournisseurs}
                        loadMore={() => setPage(prev => prev + 1)}
                        hasMore={hasMore}
                        isLoading={loading}
                        skeletonCount={6}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                        renderItem={(fournisseur: Fournisseur) => (
                            <div key={fournisseur.id} onClick={() => goToFournisseur(fournisseur.storeName)}
                                className={`group rounded-2xl transition-all duration-300 cursor-pointer bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 overflow-hidden p-3 md:p-4 flex ${viewMode === 'grid' ? "flex-col items-center text-center" : "flex-row items-center gap-4 text-left"}`}>
                                <div className={`relative shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden ring-1 ring-border/40 ${viewMode === 'grid' ? "w-16 h-16 mb-3" : "w-16 h-16 md:w-20 md:h-20"}`}>
                                    {fournisseur.storeLogo ? (
                                        <Image src={fournisseur.storeLogo} alt={fournisseur.storeName || "Fournisseur"} fill className="object-cover" unoptimized />
                                    ) : (
                                        <Icon icon="mdi:warehouse" className="w-8 h-8 text-primary" />
                                    )}
                                </div>
                                <div className={`flex flex-col flex-1 min-w-0 ${viewMode === 'grid' ? "w-full items-center" : ""}`}>
                                    <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Fournisseur / Grossiste</span>
                                    <h3 className="font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate text-sm md:text-base w-full">
                                        {fournisseur.storeName}
                                    </h3>
                                    {fournisseur.fullName && (
                                        <p className="text-[10px] md:text-xs text-muted-foreground truncate w-full">{fournisseur.fullName}</p>
                                    )}
                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                        {fournisseur.productCount} produit{fournisseur.productCount > 1 ? "s" : ""} au catalogue
                                    </p>
                                </div>
                            </div>
                        )}
                        className="w-full"
                    />
                )}
            </div>
        </div>
    );
}
