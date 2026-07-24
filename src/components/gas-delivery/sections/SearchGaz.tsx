"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { getPublicGasProviders } from "@/api/api";
import { GasProvider, UserLocation } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";
import DetailGaz from "../modals/DetailGaz";

export default function SearchGaz() {
    const { withAuth } = useRequireAuth();
    const { getUserLocation } = useUserLocation();
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<GasProvider | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [lat, setLat] = useState<number | undefined>();
    const [lng, setLng] = useState<number | undefined>();
    const [address, setAddress] = useState<string>("");
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [isFallback, setIsFallback] = useState(false);

    const [providers, setProviders] = useState<GasProvider[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const ITEMS_PER_PAGE = 6;

    const fetchProviders = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const res = await getPublicGasProviders({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: query || undefined,
                lat: lat || undefined,
                lng: lng || undefined,
                radiusKm: lat && lng ? 15 : undefined,
            });

            if (res.statusCode === 200 && res.data) {
                const newProviders = res.data.data;
                setProviders(prev => {
                    const combined = isNewSearch ? newProviders : [...prev, ...newProviders];
                    return Array.from(new Map(combined.map(p => [p.id, p])).values());
                });
                setHasMore(pageNum < res.data.totalPages);
                setIsFallback(!!res.data.isFallback);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching gas providers:", error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [query, lat, lng]);

    useEffect(() => {
        setPage(1);
        fetchProviders(1, true);
    }, [isSearching, query, lat, lng, fetchProviders]);

    useEffect(() => {
        if (page > 1) {
            fetchProviders(page, false);
        }
    }, [page, fetchProviders]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() || lat || lng) {
            setProviders([]);
            setIsSearching(true);
        }
    };

    const handleUseMyLocation = async () => {
        const location = await getUserLocation();
        if (location) {
            setUserLocation(location);
            setLat(location.lat ?? undefined);
            setLng(location.lng ?? undefined);
            setAddress(`${location.city || ''}, ${location.country || ''}`.replace(/^, |, $/g, '') || 'Position obtenue');

            setProviders([]);
            setIsSearching(true);
        }
    };

    useEffect(() => {
        if (query === "" && !lat && !lng) {
            setIsSearching(false);
            setProviders([]);
        }
    }, [query, lat, lng]);

    const handleVoiceResult = (text: string) => {
        setQuery(text);
        if (text.trim()) {
            setProviders([]);
            setIsSearching(true);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Search Input - Centered */}
            <form onSubmit={handleSearch} className="flex flex-row items-stretch justify-center gap-2 w-full max-w-2xl mb-2 relative">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input value={query} type="text" placeholder="Rechercher un prestataire de gaz..."
                        className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 placeholder:text-muted-foreground"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery("")} className="p-1 text-muted-foreground hover:text-primary transition-colors animate-in fade-in zoom-in duration-200" title="Effacer la recherche" >
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                        </button>
                    )}
                    <button type="button" onClick={() => setIsVoiceModalOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-90" title="Recherche vocale" >
                        <Icon icon="solar:microphone-bold-duotone" className="w-5 h-5" />
                    </button>

                    <button type="button" onClick={handleUseMyLocation} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Prestataires à proximité" >
                        <Icon icon="solar:gps-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
                <button type="submit" className="flex-shrink-0 px-3 bg-transparent border border-border/40 text-muted-foreground hover:text-primary rounded-xl shadow-sm transition-all active:scale-95 hover:border-primary/50 flex items-center justify-center" >
                    <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5" />
                </button>
            </form>
            {/* Adresse */}
            {address && (
                <div className="mb-4 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{address}</span>
                </div>
            )}
            {lat && lng && isFallback && (
                <div className="mb-8 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 flex items-center gap-2">
                    <Icon icon="solar:info-circle-bold-duotone" className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm text-foreground/80">Aucun prestataire à proximité — affichage de tous les prestataires disponibles</span>
                </div>
            )}
            {/* Résultats de recherche */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center leading-tight"> </h3>
                    {providers.length > 0 && (
                        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    )}
                </div>

                {loading && providers.length === 0 ? (
                    <Loader
                        title="Recherche de prestataires..."
                        description="Nous recherchons les prestataires de gaz correspondant à vos critères."
                        icon="solar:fire-bold-duotone"
                    />
                ) : !loading && providers.length === 0 ? (
                    <NotFound
                        title="Aucun prestataire trouvé"
                        description="Aucun prestataire de gaz ne correspond à votre recherche. Essayez d'autres mots-clés ou une localisation différente."
                        icon="solar:fire-bold-duotone"
                    />
                ) : (
                    <InfiniteScroll
                        items={providers}
                        loadMore={() => setPage(prev => prev + 1)}
                        hasMore={hasMore}
                        isLoading={loading}
                        skeletonType="default"
                        skeletonCount={3}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                        renderItem={(provider: GasProvider) => (
                            <div key={provider.id} onClick={() => withAuth(() => setSelectedProvider(provider))}
                                className={`group rounded-2xl transition-all duration-300 cursor-pointer bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 overflow-hidden p-3 md:p-4 flex ${viewMode === 'grid' ? "flex-col items-center text-center" : "flex-row items-center gap-4 text-left"}`}>
                                <div className={`relative shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden ring-1 ring-border/40 ${viewMode === 'grid' ? "w-16 h-16 mb-3" : "w-16 h-16 md:w-20 md:h-20"}`}>
                                    <Icon icon="mdi:propane-tank" className="w-8 h-8 text-primary" />
                                </div>
                                <div className={`flex flex-col flex-1 min-w-0 ${viewMode === 'grid' ? "w-full items-center" : ""}`}>
                                    <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Prestataire de gaz</span>
                                    <h3 className="font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate text-sm md:text-base w-full">
                                        {provider.companyName}
                                    </h3>
                                    {provider.address && (
                                        <p className="text-[10px] md:text-xs text-muted-foreground truncate w-full">{provider.address}</p>
                                    )}
                                    {typeof provider.bottlesCount === "number" && (
                                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                            {provider.bottlesCount} bouteille{provider.bottlesCount > 1 ? "s" : ""} au catalogue
                                        </p>
                                    )}
                                    <button className="mt-3 flex items-center gap-1.5 bg-secondary text-white rounded-full font-black hover:bg-primary transition-all active:scale-90 shadow-sm px-3 py-1.5 text-[10px] md:text-xs">
                                        <span className="whitespace-nowrap">Voir le prestataire</span>
                                        <Icon icon="solar:check-circle-bold-duotone" className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                        className="w-full"
                    />
                )}
            </div>
            {/* Modal détail prestataire */}
            <DetailGaz isOpen={!!selectedProvider} onClose={() => setSelectedProvider(null)} provider={selectedProvider} />
            <VoiceSearchModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} onResult={handleVoiceResult} />
        </div>
    );
}
