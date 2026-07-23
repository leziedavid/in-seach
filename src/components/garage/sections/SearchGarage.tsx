"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { getPublicGarages } from "@/api/api";
import { Garage, UserLocation } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";
import DetailGarage from "../modals/DetailGarage";

export default function SearchGarage() {
    const { withAuth } = useRequireAuth();
    const { getUserLocation } = useUserLocation();
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [lat, setLat] = useState<number | undefined>();
    const [lng, setLng] = useState<number | undefined>();
    const [address, setAddress] = useState<string>("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [isFallback, setIsFallback] = useState(false);

    const [garages, setGarages] = useState<Garage[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const ITEMS_PER_PAGE = 6;

    const fetchGarages = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const res = await getPublicGarages({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: query || undefined,
                lat: lat || undefined,
                lng: lng || undefined,
                radiusKm: lat && lng ? 15 : undefined,
            });

            if (res.statusCode === 200 && res.data) {
                const newGarages = res.data.data;
                setGarages(prev => {
                    const combined = isNewSearch ? newGarages : [...prev, ...newGarages];
                    return Array.from(new Map(combined.map(g => [g.id, g])).values());
                });
                setHasMore(pageNum < res.data.totalPages);
                setIsFallback(!!res.data.isFallback);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching garages:", error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [query, lat, lng]);

    useEffect(() => {
        setPage(1);
        fetchGarages(1, true);
    }, [isSearching, query, lat, lng, fetchGarages]);

    useEffect(() => {
        if (page > 1) {
            fetchGarages(page, false);
        }
    }, [page, fetchGarages]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() || lat || lng) {
            setGarages([]);
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

            setGarages([]);
            setIsSearching(true);
        }
    };

    useEffect(() => {
        if (query === "" && !lat && !lng) {
            setIsSearching(false);
            setGarages([]);
        }
    }, [query, lat, lng]);

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Search Input - Centered */}
            <form onSubmit={handleSearch} className="flex flex-row items-stretch justify-center gap-2 w-full max-w-2xl mb-2 relative">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input value={query} type="text" placeholder="Rechercher un garage..."
                        className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 placeholder:text-muted-foreground"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery("")} className="p-1 text-muted-foreground hover:text-primary transition-colors animate-in fade-in zoom-in duration-200" title="Effacer la recherche" >
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                        </button>
                    )}
                    <button type="button" onClick={handleUseMyLocation} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Garages à proximité" >
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
                    <span className="text-sm text-foreground/80">Aucun garage à proximité — affichage de tous les garages actifs</span>
                </div>
            )}
            {/* Résultats de recherche */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center leading-tight"> </h3>
                    {garages.length > 0 && (
                        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    )}
                </div>

                {loading && garages.length === 0 ? (
                    <Loader
                        title="Recherche de garages..."
                        description="Nous recherchons les garages correspondant à vos critères."
                        icon="solar:garage-bold-duotone"
                    />
                ) : !loading && garages.length === 0 ? (
                    <NotFound
                        title="Aucun garage trouvé"
                        description="Aucun garage ne correspond à votre recherche. Essayez d'autres mots-clés ou une localisation différente."
                        icon="solar:garage-bold-duotone"
                    />
                ) : (
                    <InfiniteScroll
                        items={garages}
                        loadMore={() => setPage(prev => prev + 1)}
                        hasMore={hasMore}
                        isLoading={loading}
                        skeletonType="default"
                        skeletonCount={3}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                        renderItem={(garage: Garage) => (
                            viewMode === 'list' ? (
                                <div key={garage.id} onClick={() => withAuth(() => setSelectedGarage(garage))}
                                    className="group flex items-start gap-4 p-4 rounded-xl cursor-pointer bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 transition-all">
                                    <div className="relative shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-1 ring-border/40">
                                        {garage.logo ? (
                                            <img src={garage.logo} alt={garage.nom} className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon icon="solar:garage-bold-duotone" className="w-7 h-7 text-primary" />
                                        )}
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${garage.actif ? "bg-emerald-500" : "bg-red-500"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {garage.logo ? (
                                                    <img src={garage.logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Icon icon="solar:garage-bold-duotone" className="w-3 h-3 text-primary" />
                                                )}
                                            </span>
                                            <span className="text-sm font-bold text-foreground truncate">{garage.nom}</span>
                                        </div>
                                        {(garage.commune || garage.ville) && (
                                            <p className="text-xs text-muted-foreground/70 truncate mb-1.5 ml-7">
                                                {[garage.commune, garage.ville].filter(Boolean).join(", ")}
                                            </p>
                                        )}
                                        <h3 className="text-base md:text-lg font-black leading-snug mb-1 group-hover:text-primary transition-colors">
                                            <span className="text-primary">Garage</span> <span className="text-foreground">{garage.nom}</span>
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {garage.actif ? "Ouvert et disponible pour vos réparations." : "Actuellement fermé."}
                                            {typeof garage.catalogueCount === "number" ? ` ${garage.catalogueCount} pièce${garage.catalogueCount > 1 ? "s" : ""} au catalogue.` : ""}
                                        </p>
                                        {typeof garage.catalogueCount === "number" && (
                                            <p className="text-xl font-black text-foreground">
                                                {garage.catalogueCount} <span className="text-sm font-bold text-muted-foreground">pièce{garage.catalogueCount > 1 ? "s" : ""}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div key={garage.id} onClick={() => withAuth(() => setSelectedGarage(garage))} className="group rounded-2xl transition-all duration-300 cursor-pointer bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 overflow-hidden p-3 md:p-4 flex flex-col items-center text-center">
                                    {/* Logo / icône garage */}
                                    <div className="relative shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden w-16 h-16 mb-3 ring-1 ring-border/40">
                                        {garage.logo ? (
                                            <img src={garage.logo} alt={garage.nom} className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon icon="solar:garage-bold-duotone" className="w-8 h-8 text-primary" />
                                        )}
                                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${garage.actif ? "bg-emerald-500" : "bg-red-500"}`} />
                                    </div>
                                    {/* Contenu */}
                                    <div className="flex flex-col flex-1 min-w-0 w-full items-center">
                                        <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Garage</span>
                                        <h3 className="font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate text-sm md:text-base w-full">
                                            {garage.nom}
                                        </h3>
                                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${garage.actif ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                            {garage.actif ? "Ouvert" : "Fermé"}
                                        </span>
                                        {(garage.commune || garage.ville) && (
                                            <p className="text-[10px] md:text-xs text-muted-foreground truncate w-full flex items-center gap-1 justify-center">
                                                <Icon icon="solar:map-point-bold-duotone" className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{[garage.commune, garage.ville].filter(Boolean).join(", ")}</span>
                                            </p>
                                        )}
                                        {typeof garage.catalogueCount === "number" && (
                                            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                                {garage.catalogueCount} pièce{garage.catalogueCount > 1 ? "s" : ""} au catalogue
                                            </p>
                                        )}
                                        <button className="mt-3 flex items-center gap-1.5 bg-secondary text-white rounded-full font-black hover:bg-primary transition-all active:scale-90 shadow-sm px-3 py-1.5 text-[10px] md:text-xs">
                                            <span className="whitespace-nowrap">Voir le garage</span>
                                            <Icon icon="solar:check-circle-bold-duotone" className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                        className="w-full"
                    />
                )}
            </div>
            {/* Modal détail garage */}
            <DetailGarage isOpen={!!selectedGarage} onClose={() => setSelectedGarage(null)} garage={selectedGarage} userLocation={lat && lng ? { lat, lng } : null} />
        </div>
    );
}
