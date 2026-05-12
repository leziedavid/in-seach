"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { LogisticProvider, TransportType } from "@/types/interface";
import { findAllPrestataire } from "@/api/api";
import LogisticProviderCard from "@/components/logistics/cards/LogisticProviderCard";
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";
import CategoryFilter from "@/components/ui/CategoryFilter"

const ITEMS_PER_PAGE = 8;

export default function LogisticProviderList() {
    const [providers, setProviders] = useState<LogisticProvider[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTransport, setFilterTransport] = useState<TransportType | "ALL">("ALL");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    const fetchProviders = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loading && !isNewSearch) return;
        setLoading(true);

        try {
            const params = {
                query: searchTerm || undefined,
                transportType: filterTransport === "ALL" ? undefined : filterTransport,
                page: pageNum,
                limit: ITEMS_PER_PAGE
            };

            const res = await findAllPrestataire(params);

            if (res.statusCode === 200 && res.data) {
                const isPaginated = !Array.isArray(res.data) && res.data.data;
                const data = isPaginated ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                const totalItems = isPaginated ? res.data.total : data.length;
                const totalPageCount = isPaginated ? res.data.totalPages : 1;

                setProviders(prev => {
                    if (isNewSearch) return data;
                    const existingIds = new Set(prev.map(p => p.id));
                    const newItems = data.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...newItems];
                });

                setHasMore(pageNum < totalPageCount);
                setTotal(totalItems);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching logistics providers:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [searchTerm, filterTransport]);

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1);
        fetchProviders(1, true);
    }, [searchTerm, filterTransport, fetchProviders]);

    const handleVoiceResult = (text: string) => {
        setSearchTerm(text);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-1">

            {/* Search Input */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-3 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input type="text" placeholder="Rechercher une compagnie logistique..." className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 md:text-sm placeholder:text-muted-foreground" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} inputMode="text" style={{ fontSize: '16px' }} suppressHydrationWarning />
                    <button type="button" onClick={() => setIsVoiceModalOpen(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-90" title="Recherche vocale" >
                        <Icon icon="solar:microphone-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Transport Filters */}
            <div className="w-full max-w-3xl mx-auto mb-4">
                <CategoryFilter
                    categories={[
                        { id: "ALL", name: "Tous les types" },
                        ...Object.values(TransportType).map(t => ({
                            id: t,
                            name: t.replace(/_/g, ' ')
                        }))
                    ]}
                    selectedCategoryId={filterTransport}
                    onCategoryChange={(id) => setFilterTransport(id as any)}
                    hasSubCategories={false}
                />
            </div>

            {/* Results count header */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center leading-tight">
                        {providers.length > 0 ? `${total} compagnie${total > 1 ? 's' : ''} partenaire${total > 1 ? 's' : ''}` : ''}
                    </h3>
                    {providers.length > 0 && (
                        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    )}
                </div>

                {(loading || isInitialLoading) && providers.length === 0 ? (
                    <Loader
                        title="Chargement des compagnies..."
                        description="Nous recherchons les compagnies logistiques partenaires disponibles."
                        icon="solar:delivery-bold-duotone"
                    />
                ) : !loading && !isInitialLoading && providers.length === 0 ? (
                    <NotFound
                        title="Aucune compagnie trouvée"
                        description="Aucune compagnie logistique ne correspond à votre recherche. Essayez d'autres mots-clés ou un autre type de transport."
                        icon="solar:delivery-bold-duotone"
                    />
                ) : (
                    <InfiniteScroll
                        items={providers}
                        loadMore={() => setPage(prev => prev + 1)}
                        hasMore={hasMore}
                        isLoading={loading}
                        skeletonType="logistics"
                        skeletonCount={4}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" : "grid grid-cols-1 gap-4"}
                        renderItem={(provider) => (<LogisticProviderCard key={provider.id} provider={provider} viewMode={viewMode} />)}
                    />
                )}
            </div>

            <VoiceSearchModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onResult={handleVoiceResult}
            />
        </div>
    );
}
