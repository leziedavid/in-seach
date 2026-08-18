"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { getServices, searchServiceIA, searchServiceCategories, getAllCategories } from "@/api/api";
import { UserLocation, Service, Category } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import BookingModal from "@/components/bookings/modals/BookingModal";
import ImageSearchModal from "@/components/services/sections/ImageSearchModal";
import SearchInput from "@/components/shared/SearchInput";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import dynamic from 'next/dynamic';
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal";
import { useTranslation } from "@/utils/langue/hooks";
import { hasValidPrice } from "@/utils/price";

const ServicesMap = dynamic(() => import("./ServicesMap"), {
    ssr: false,
    loading: () => <div className="w-full h-[600px] bg-muted/20 animate-pulse rounded-[2.5rem] flex items-center justify-center">
        <Icon icon="solar:map-bold-duotone" className="w-12 h-12 text-muted-foreground/30" />
    </div>
});

export default function SearchServies() {
    const { t } = useTranslation();
    const { withAuth } = useRequireAuth();
    const { getUserLocation } = useUserLocation();
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [address, setAddress] = useState<string>("");
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResults, setAiResults] = useState<Service[]>([]);
    const [aiSearchEmpty, setAiSearchEmpty] = useState(false);
    const [aiMessage, setAiMessage] = useState("");
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

    // Filtre par catégorie — liste horizontale au-dessus de la recherche (voir maquette).
    // Indépendant de `query` : peut être combiné avec le texte saisi ou utilisé seul.
    // useQuery (pas un simple useEffect+fetch) : les catégories changent rarement et
    // AppTabs démonte/remonte ce composant à chaque changement d'onglet — sans cache
    // partagé, on refetch inutilement à chaque retour sur l'onglet "Expertise". React
    // Query dédoublonne/cache ce résultat (staleTime 5 min, voir QueryProvider.tsx) : un
    // retour sur l'onglet dans ce délai réutilise le cache, zéro requête réseau.
    const { data: categoriesRes, isLoading: categoriesLoading } = useQuery({
        queryKey: ["services-categories-all"],
        queryFn: getAllCategories,
    });
    const categories: Category[] = categoriesRes?.statusCode === 200 ? (categoriesRes.data ?? []) : [];
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const [categoryRowOverflow, setCategoryRowOverflow] = useState(false);

    // Indication de scroll — visible seulement si les catégories dépassent la largeur visible
    // (même logique que AppTabs.tsx).
    useEffect(() => {
        const checkOverflow = () => {
            const el = categoryScrollRef.current;
            if (el) setCategoryRowOverflow(el.scrollWidth > el.clientWidth + 4);
        };
        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [categories.length]);

    // Autocomplete states
    const [suggestions, setSuggestions] = useState<{ id: string, label: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // State-based pagination
    const [services, setServices] = useState<Service[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
    // Ref pour éviter la stale closure sur `loading` dans le useCallback
    const loadingRef = useRef(false);

    const ITEMS_PER_PAGE = 6;

    const fetchServices = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const res = await getServices({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                search: query || undefined,
                categoryId: selectedCategoryId || undefined,
                lat: lat || undefined,
                lng: lng || undefined
            });

            if (res.statusCode === 200 && res.data) {
                const newServices = res.data.data;
                setServices(prev => {
                    const combined = isNewSearch ? newServices : [...prev, ...newServices];
                    // Ensure uniqueness by ID
                    return Array.from(new Map(combined.map(s => [s.id, s])).values());
                });
                setHasMore(pageNum < res.data.totalPages);
                setTotal(res.data.total);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [query, lat, lng, selectedCategoryId]);

    // Réinitialiser la recherche si query est vide, pas de localisation ET pas de catégorie active
    useEffect(() => {
        if (query === "" && !lat && !lng && !selectedCategoryId) {
            setIsSearching(false);
        }
    }, [query, lat, lng, selectedCategoryId]);

    // Reset and fetch when filters change
    useEffect(() => {
        if (isSearching && aiResults.length === 0) {
            setPage(1);
            fetchServices(1, true);
        }
    }, [isSearching, query, lat, lng, selectedCategoryId, fetchServices, aiResults.length]);

    // Load more when page changes
    useEffect(() => {
        if (page > 1 && aiResults.length === 0) {
            fetchServices(page, false);
        }
    }, [page, fetchServices, aiResults.length]);

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
                const res = await searchServiceCategories(query);
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

    // Clic sur une catégorie — la sélectionne (ou la désélectionne si déjà active) et
    // lance/actualise la recherche, seule ou combinée au texte déjà saisi.
    const handleCategoryClick = (categoryId: string) => {
        const next = selectedCategoryId === categoryId ? null : categoryId;
        setAiResults([]);
        setAiSearchEmpty(false);
        setSelectedCategoryId(next);
        if (next || query.trim() || lat || lng) {
            setIsSearching(true);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (query.trim() || lat || lng) {
            setAiResults([]);
            setAiSearchEmpty(false);
            setIsSearching(true);
        }
    };
    // SearchInput n'est plus un <form> HTML — adapte le handler existant (qui n'utilise
    // l'event que pour preventDefault) à sa signature onSubmit(value), sans toucher à sa logique.
    const handleSearchSubmit = () => handleSearch({ preventDefault: () => { } } as React.FormEvent);

    const handleSuggestionClick = (suggestion: any) => {
        setQuery(suggestion.label);
        setShowSuggestions(false);
        setAiResults([]);
        setAiSearchEmpty(false);
        setIsSearching(true);
    };

    const handleUseMyLocation = async () => {
        const location = await getUserLocation();
        if (location) {
            setUserLocation(location);
            setLat(location.lat);
            setLng(location.lng);
            setAddress(`${location.city}, ${location.country}`);
            // Automatically trigger search if location is updated
            setAiResults([]);
            setIsSearching(true);
        }
    };

    const handleImageSearch = async (file: File) => {
        setIsAiLoading(true);
        setAiSearchEmpty(false);
        setAiResults([]);
        setServices([]); // Clear manual search results when using AI
        try {
            const res = await searchServiceIA(file);
            if (res.data?.data && res.data.data.length > 0) {
                setAiResults(res.data.data);
                setAiSearchEmpty(false);
                setAiMessage("");
            } else {
                setAiSearchEmpty(true);
                setAiMessage(res.message || "Nous n’avons pas trouvé de service correspondant à cette image. Veuillez réessayer avec une autre photo ou saisir le nom du service dans la barre de recherche.");
            }
            setIsSearching(true);
        } catch (err) {
            console.error("AI search error:", err);
        } finally {
            setIsAiLoading(false);
            setIsImageModalOpen(false);
        }
    };

    const displayedServices = aiResults.length > 0 ? aiResults : services;
    const totalResults = aiResults.length > 0 ? aiResults.length : total;

    const handleVoiceResult = (text: string) => {
        setQuery(text);
        if (text.trim()) {
            setAiResults([]);
            setAiSearchEmpty(false);
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
                                // cat.iconName peut aussi être un ancien nom d'icône texte (ex: "tile", legacy,
                                // voir resolveCategoryIcon côté backend) plutôt qu'une vraie image uploadée — sans
                                // ce filtre, next/image (non-unoptimized) lève une erreur pour un src invalide
                                // au lieu d'un simple visuel cassé.
                                const hasImage = !!cat.iconName && (cat.iconName.startsWith("http") || cat.iconName.startsWith("/"));
                                return (
                                    <div key={cat.id} className="flex flex-col items-center gap-1.5 shrink-0 group">
                                        <div className="relative">
                                            <button type="button" onClick={() => handleCategoryClick(cat.id)} className={`relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-300 active:scale-95 ${isActive ? "border-primary bg-primary/10 shadow-md shadow-primary/20 scale-105" : "border-border/40 bg-muted/40 group-hover:border-primary/40"}`}>
                                                {hasImage ? (
                                                    <Image src={cat.iconName} alt={cat.label} fill sizes="56px" className="object-cover" />
                                                ) : (
                                                    <Icon icon="solar:widget-5-bold-duotone" className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                                )}
                                            </button>
                                            {/* Croix rouge — visible seulement sur la catégorie active, permet de la désélectionner sans re-cliquer dessus */}
                                            {isActive && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat.id); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900 active:scale-90 transition-all" aria-label={t("services.remove_category_filter")} title={t("services.remove_category_filter")} >
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
                            {t("services.categories_scroll_hint")}
                        </span>
                    )}
                </div>
            )}
            {/* Search Input - Centered */}
            <div className="w-full mb-2">
                <SearchInput
                    value={query}
                    onChange={setQuery}
                    onSubmit={handleSearchSubmit}
                    placeholder={t("services.search_placeholder")}
                    enableVoice
                    onVoiceOpen={() => setIsVoiceModalOpen(true)}
                    enableImage
                    onImageOpen={() => setIsImageModalOpen(true)}
                    enableMap
                    onMapClick={handleUseMyLocation}
                    addressLabel={address}
                    labels={{
                        clear: t("common.clear_search"),
                        voice: t("common.voice_search"),
                        image: t("common.image_search"),
                        location: t("common.my_location"),
                    }}
                    suggestionsSlot={showSuggestions && (
                        <div ref={suggestionRef} className="absolute z-50 top-full mt-2 w-full bg-card border border-border/40 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {isSearchingSuggestions ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Recherche...</div>
                            ) : suggestions.length > 0 ? (
                                <ul className="max-h-60 overflow-y-auto">
                                    {suggestions.map((suggestion) => (
                                        <li key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)} className="px-4 py-3 flex items-center gap-3 hover:bg-primary/10 cursor-pointer transition-colors border-b border-border/20 last:border-0" >
                                            <Icon icon="solar:magnifer-outline" className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-foreground text-sm font-medium">{suggestion.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    )}
                />
            </div>
            {/* Dynamic Results or Initial Steps */}
            {isSearching && (
                <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                    <div className="flex items-center justify-start md:justify-center w-full px-4 md:px-0 mb-4">
                        <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center">
                            {''}
                        </h3>

                        {/* View Toggle */}
                        {displayedServices.length > 0 && (
                            <div className="flex bg-muted p-1 rounded-xl gap-1">
                                <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'map' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} >
                                    <Icon icon="solar:map-bold-duotone" className="w-4 h-4" />
                                    {t("common.map")}
                                </button>
                                <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} >
                                    <Icon icon="solar:posts-carousel-vertical-bold-duotone" className="w-4 h-4" />
                                    {t("common.grid")}
                                </button>

                            </div>
                        )}
                    </div>

                    {isAiLoading || (loading && displayedServices.length === 0) ? (
                        <Loader
                            title={isAiLoading ? t("services.ai_loading_title") : t("services.search_loading_title")}
                            description={isAiLoading ? t("services.ai_loading_description") : t("services.search_loading_description")}
                            icon="solar:case-round-minimalistic-bold-duotone"
                        />
                    ) : displayedServices.length === 0 ? (
                        <NotFound
                            title={t("services.not_found_title")}
                            description={aiSearchEmpty ? (aiMessage || t("services.ai_not_found_description")) : t("services.not_found_description")}
                            icon="solar:case-round-minimalistic-bold-duotone"
                        />
                    ) : (
                        viewMode === 'map' ? (
                            <div className="w-full stagger-item mb-4">
                                <ServicesMap services={displayedServices} userLocation={userLocation} onSelectService={(service) => withAuth(() => setSelectedService(service))} />
                            </div>
                        ) : (
                            <InfiniteScroll
                                items={displayedServices}
                                loadMore={() => setPage(prev => prev + 1)}
                                hasMore={hasMore && aiResults.length === 0}
                                isLoading={loading}
                                skeletonType="service"
                                skeletonCount={3}
                                renderItem={(service: any) => (
                                    <div key={service.id} onClick={() => withAuth(() => setSelectedService(service))} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center bg-card w-full transition-all duration-300 cursor-pointer">
                                        {/* Image */}
                                        <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                                            <Image
                                                src={(service.imageUrls && typeof service.imageUrls === 'string' && service.imageUrls !== "") ? service.imageUrls : (Array.isArray(service.images) && service.images[0]) || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'}
                                                alt={service.title}
                                                fill
                                                unoptimized
                                                className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground shadow-sm uppercase tracking-tighter">
                                                {service.categoryLabel || 'Expert'}
                                            </div>
                                        </div>

                                        {/* Contenu */}
                                        <div className="px-0.5 pb-0 md:px-0 md:pb-0 w-full">
                                            <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors w-full text-left leading-tight">
                                                {service.title}
                                            </h3>

                                            <div className="flex items-center justify-start gap-1 text-primary mb-2 md:mb-4 md:justify-center">
                                                <Icon icon="solar:star-bold-duotone" className="w-2.5 h-2.5 fill-current md:w-3 md:h-3" />
                                                <span className="text-[9px] md:text-xs font-black tracking-tight">4.9 • <span className="text-muted-foreground">Pro</span></span>
                                            </div>
                                            <div className="w-full flex items-center justify-between mt-auto">
                                                <div className="text-left">
                                                    {hasValidPrice(service.price) && (
                                                        <p className="text-secondary font-black text-sm md:text-lg">
                                                            {service.price.toLocaleString()} <span className="text-[9px] font-bold text-muted-foreground">CFA</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <button className="flex items-center gap-1 md:gap-2 bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm" >
                                                    <span className="whitespace-nowrap">{t("common.consult")}</span>
                                                    <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                className="w-full"
                            />
                        )
                    )}
                </div>
            )}
            {/* Booking Modal */}
            <BookingModal
                isOpen={!!selectedService}
                onClose={() => setSelectedService(null)}
                item={selectedService}
                type="SERVICE" />
            <ImageSearchModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onSearch={handleImageSearch}
                isLoading={isAiLoading}
            />
            <VoiceSearchModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onResult={handleVoiceResult}
            />
        </div>
    );
}