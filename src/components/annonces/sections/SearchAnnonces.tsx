"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { getAnnonces, searchAnnonceCategories, getAllCategorieAnnonces } from "@/api/api";
import { Annonce, UserLocation, CategorieAnnonce } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import AnnonceModal from "../../home/AnnonceModal";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";
import { useTranslation } from "@/utils/langue/hooks";
import { hasValidPrice } from "@/utils/price";

export default function SearchAnnonces() {
    const { t } = useTranslation();
    const { withAuth } = useRequireAuth();
    const { getUserLocation } = useUserLocation();
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [lat, setLat] = useState<number | undefined>();
    const [lng, setLng] = useState<number | undefined>();
    const [address, setAddress] = useState<string>("");
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Filtre par catégorie — liste horizontale au-dessus de la recherche (même comportement
    // que SearchServies.tsx). Indépendant de `query` : peut être combiné au texte saisi.
    // useQuery plutôt qu'un useEffect+fetch : ce composant est démonté/remonté à chaque
    // changement d'onglet dans AppTabs, et les catégories changent rarement — React Query
    // dédoublonne/cache le résultat (staleTime 5 min, voir QueryProvider.tsx) pour éviter
    // un refetch réseau à chaque retour sur l'onglet "Opportunités".
    const { data: categoriesRes, isLoading: categoriesLoading } = useQuery({
        queryKey: ["annonce-categories-all"],
        queryFn: getAllCategorieAnnonces,
    });
    const categories: CategorieAnnonce[] = categoriesRes?.statusCode === 200 ? (categoriesRes.data ?? []) : [];
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const [categoryRowOverflow, setCategoryRowOverflow] = useState(false);

    // Indication de scroll — visible seulement si les catégories dépassent la largeur visible
    // (même logique que AppTabs.tsx / SearchServies.tsx).
    useEffect(() => {
        const checkOverflow = () => {
            const el = categoryScrollRef.current;
            if (el) setCategoryRowOverflow(el.scrollWidth > el.clientWidth + 4);
        };
        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [categories.length]);

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    };

    // Autocomplete states
    const [suggestions, setSuggestions] = useState<{ id: string, name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // State-based pagination
    const [annonces, setAnnonces] = useState<Annonce[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    // Ref pour éviter la stale closure sur `loading` dans le useCallback
    const loadingRef = useRef(false);

    const ITEMS_PER_PAGE = 6;

    const fetchAnnonces = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const res = await getAnnonces({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: query || undefined,
                categorieId: selectedCategoryId || undefined,
                lat: lat || undefined,
                lng: lng || undefined,
                radiusKm: lat && lng ? 10 : undefined
            });

            if (res.statusCode === 200 && res.data) {
                const newAnnonces = res.data.data;
                setAnnonces(prev => {
                    const combined = isNewSearch ? newAnnonces : [...prev, ...newAnnonces];
                    // Ensure uniqueness by ID
                    return Array.from(new Map(combined.map(a => [a.id, a])).values());
                });
                setHasMore(pageNum < res.data.totalPages);
                setTotal(res.data.total);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching annonces:", error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [query, lat, lng, selectedCategoryId]);

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1);
        fetchAnnonces(1, true);
        // if (isSearching) {
        //     setPage(1);
        //     fetchAnnonces(1, true);
        // }
    }, [isSearching, query, lat, lng, selectedCategoryId, fetchAnnonces]);

    // Load more when page changes
    useEffect(() => {
        if (page > 1) {
            fetchAnnonces(page, false);
        }
    }, [page, fetchAnnonces]);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query.trim() || isSearching) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            setIsSearchingSuggestions(true);
            try {
                const res = await searchAnnonceCategories(query);
                if (res.statusCode === 200 && res.data) {
                    setSuggestions(res.data);
                    setShowSuggestions(res.data.length > 0);
                }
            } catch (e) {
                console.error("Error fetching suggestions:", e);
            } finally {
                setIsSearchingSuggestions(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [query, isSearching]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (query.trim() || lat || lng) {
            setAnnonces([]);
            setIsSearching(true);
        }
    };

    const handleSuggestionClick = (suggestion: any) => {
        setQuery(suggestion.name);
        setShowSuggestions(false);
        setAnnonces([]);
        setIsSearching(true);
    };

    const handleUseMyLocation = async () => {
        const location = await getUserLocation();
        if (location) {
            setUserLocation(location);
            setLat(location.lat ?? undefined);
            setLng(location.lng ?? undefined);
            setAddress(`${location.city || ''}, ${location.country || ''}`.replace(/^, |, $/g, '') || 'Position obtenue');

            setAnnonces([]);
            setIsSearching(true);
        }
    };

    // Réinitialiser la recherche si query est vide ET pas de localisation
    useEffect(() => {
        if (query === "" && !lat && !lng) {
            setIsSearching(false);
            setAnnonces([]);
        }
    }, [query, lat, lng]);

    const handleVoiceResult = (text: string) => {
        setQuery(text);
        if (text.trim()) {
            setAnnonces([]);
            setIsSearching(true);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Catégories — filtre horizontal scrollable, indépendant du texte de recherche */}
            {categoriesLoading ? (
                <div className="flex flex-col items-center w-full max-w-2xl mb-3">
                    <div className="flex items-start gap-3 px-1 py-1 w-max mx-auto">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                                <div className="w-14 h-14 rounded-2xl bg-muted/60 animate-pulse" />
                                <div className="w-10 h-2.5 rounded-full bg-muted/60 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : categories.length > 0 && (
                <div className="relative flex flex-col items-center w-full max-w-2xl mb-3">
                    <div ref={categoryScrollRef} className="w-full overflow-x-auto scroll-smooth scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-start gap-3 px-1 py-1 w-max mx-auto">
                            {categories.map((cat) => {
                                const isActive = selectedCategoryId === cat.id;
                                return (
                                    <div key={cat.id} className="flex flex-col items-center gap-1.5 shrink-0 group">
                                        <div className="relative">
                                            <button type="button" onClick={() => handleCategoryClick(cat.id)} className={`relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-300 active:scale-95 ${isActive ? "border-primary bg-primary/10 shadow-md shadow-primary/20 scale-105" : "border-border/40 bg-muted/40 group-hover:border-primary/40"}`}>
                                                {cat.iconName ? (
                                                    <Image src={cat.iconName} alt={cat.label} fill unoptimized className="object-cover" />
                                                ) : (
                                                    <Icon icon="solar:widget-5-bold-duotone" className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                                )}
                                            </button>
                                            {isActive && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat.id); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900 active:scale-90 transition-all" aria-label={`Désélectionner ${cat.label}`} title={`Désélectionner ${cat.label}`} >
                                                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <span className={`text-[11px] font-black max-w-[64px] truncate transition-colors ${isActive ? "text-primary" : "text-foreground/80 group-hover:text-primary"}`}>
                                            {cat.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {categoryRowOverflow && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                            <Icon icon="solar:round-double-alt-arrow-right-bold-duotone" className="w-3 h-3 animate-bounce" />
                            Glissez pour voir plus de catégories
                        </span>
                    )}
                </div>
            )}
            {/* Search Input - Centered */}
            <form onSubmit={handleSearch} className="flex flex-row items-stretch justify-center gap-2 w-full max-w-2xl mb-2 relative">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input value={query} type="text" placeholder="Quelle annonce recherchez-vous ?"
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

                    <button type="button" onClick={handleUseMyLocation} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Recherche par image (IA)" >
                        <Icon icon="solar:gps-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
                <button type="submit" className="flex-shrink-0 px-3 bg-transparent border border-border/40 text-muted-foreground hover:text-primary rounded-xl shadow-sm transition-all active:scale-95 hover:border-primary/50 flex items-center justify-center" >
                    <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5" />
                </button>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                    <div ref={suggestionRef} className="absolute z-50 w-full max-w-2xl mt-14 bg-card border border-border/40 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {isSearchingSuggestions ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">Recherche...</div>
                        ) : suggestions.length > 0 ? (
                            <ul className="max-h-60 overflow-y-auto">
                                {suggestions.map((suggestion) => (
                                    <li key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)} className="px-4 py-3 flex items-center gap-3 hover:bg-primary/10 cursor-pointer transition-colors border-b border-border/20 last:border-0" >
                                        <Icon icon="solar:magnifer-outline" className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-foreground text-sm font-medium">{suggestion.name}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                )}
            </form>
            {/* Adresse */}
            {address && (
                <div className="mb-8 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2 md:mb-8 md:px-4 md:py-2">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0 md:w-4 md:h-4" />
                    <span className="text-sm text-foreground/80 md:text-sm">{address}</span>
                </div>
            )}
            {/* Résultats de recherche */}
            {/* {isSearching && ( */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center leading-tight"> </h3>
                    {annonces.length > 0 && (
                        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    )}
                </div>

                {loading && annonces.length === 0 ? (
                    <Loader title="Recherche d'annonces..." description="Nous recherchons les annonces correspondant à vos critères." icon="solar:tag-bold-duotone" />
                ) : !loading && annonces.length === 0 ? (
                    <NotFound title="Aucune annonce trouvée" description="Aucune annonce ne correspond à votre recherche. Essayez d'autres mots-clés ou une localisation différente." icon="solar:tag-bold-duotone" />
                ) : (

                    <InfiniteScroll
                        items={annonces}
                        loadMore={() => setPage(prev => prev + 1)}
                        hasMore={hasMore}
                        isLoading={loading}
                        skeletonType="annonce"
                        skeletonCount={3}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                        renderItem={(annonce: Annonce) => {
                            const lastImage = annonce.images?.[annonce.images.length - 1];
                            const imageUrl = typeof lastImage === "string" ? lastImage : lastImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop";
                            return (
                                <div key={annonce.id} onClick={() => withAuth(() => setSelectedAnnonce(annonce))} className={`group rounded-xl transition-all duration-300 cursor-pointer bg-card border border-border/40 hover:border-primary/30 overflow-hidden ${viewMode === 'grid' ? "p-0 md:p-4 flex flex-col md:items-center text-left md:text-center" : "p-2 md:p-4 flex flex-row items-center gap-4 text-left"}`}>
                                    {/* Image */}
                                    <div className={`relative overflow-hidden rounded-lg md:rounded-2xl shrink-0 ${viewMode === 'grid' ? "w-full aspect-square mb-1.5" : "w-24 h-24 md:w-32 md:h-32"}`}>
                                        {/* <Image src={(annonce.images?.[0] && typeof annonce.images?.[0] === 'string') ? annonce.images[0] : (Array.isArray(annonce.images) && (annonce.images[0] as any)?.fileUrl) || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={annonce.title} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" /> */}
                                        <Image src={imageUrl} alt={annonce.title} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                        {annonce.categorie && (
                                            <div className={`absolute bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground shadow-sm uppercase tracking-tighter ${viewMode === 'grid' ? "top-1 left-1 md:top-2 md:left-2" : "top-1 left-1"}`}>
                                                {annonce.categorie.label}
                                            </div>
                                        )}
                                    </div>
                                    {/* Contenu */}
                                    <div className={`flex flex-col flex-1 min-w-0 ${viewMode === 'grid' ? "px-0.5 pb-0 md:px-0 md:pb-0 w-full" : "h-full justify-center"}`}>
                                        <h3 className={`font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate ${viewMode === 'grid' ? "text-xs md:text-base line-clamp-2 md:line-clamp-1 text-left md:text-center w-full" : "text-sm md:text-lg"}`}>
                                            {annonce.title}
                                        </h3>

                                        <div className={`flex items-center gap-1 text-primary ${viewMode === 'grid' ? "justify-start md:justify-center mb-2 md:mb-4" : "justify-start mb-1 md:mb-2"}`}>
                                            <Icon icon="solar:star-bold-duotone" className="w-2.5 h-2.5 fill-current md:w-3 md:h-3" />
                                            <span className="text-[9px] md:text-xs font-black tracking-tight">
                                                4.9 • <span className="text-muted-foreground">
                                                    {annonce.type?.label || 'Annonce'}
                                                </span>
                                            </span>
                                        </div>

                                        <div className={`flex items-center justify-between w-full ${viewMode === 'grid' ? "mt-auto" : "mt-2 md:mt-4"}`}>
                                            <div className="text-left">
                                                {hasValidPrice(annonce.price) && (
                                                    <p className={`text-secondary font-black ${viewMode === 'grid' ? "text-sm md:text-lg" : "text-base md:text-xl"}`}>
                                                        {annonce.price.toLocaleString()} <span className="text-[9px] font-bold text-muted-foreground">CFA</span>
                                                    </p>
                                                )}
                                            </div>

                                            <button className={`flex items-center gap-1 md:gap-2 bg-secondary text-white rounded-full font-black hover:bg-primary transition-all active:scale-90 shadow-sm ${viewMode === 'grid' ? "px-2 py-1 md:px-3 md:py-2 text-[10px] md:text-xs" : "px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm"}`}>
                                                <span className="whitespace-nowrap">{viewMode === 'grid' ? "Consulter" : "Voir l'annonce"}</span>
                                                <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 md:w-4 md:h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                        className="w-full"
                    />
                )}
            </div>
            {/* )} */}
            {/* Modal de réservation */}
            <AnnonceModal isOpen={!!selectedAnnonce} onClose={() => setSelectedAnnonce(null)} annonce={selectedAnnonce} />
            <VoiceSearchModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} onResult={handleVoiceResult} />
        </div>
    );
}