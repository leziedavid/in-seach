"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { getServices, searchServiceIA } from "@/api/api";
import { UserLocation, Service } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import BookingModal from "../home/BookingModal";
import ImageSearchModal from "./ImageSearchModal";
import InfiniteScroll from "../ui/InfiniteScroll";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import NotFound from "../shared/NotFound";
import dynamic from 'next/dynamic';

const ServicesMap = dynamic(() => import("./ServicesMap"), {
    ssr: false,
    loading: () => <div className="w-full h-[600px] bg-muted/20 animate-pulse rounded-[2.5rem] flex items-center justify-center">
        <Icon icon="solar:map-bold-duotone" className="w-12 h-12 text-muted-foreground/30" />
    </div>
});

export default function SearchServies() {
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

    // State-based pagination
    const [services, setServices] = useState<Service[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

    const ITEMS_PER_PAGE = 6;

    const fetchServices = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loading) return;
        setLoading(true);

        try {
            const res = await getServices({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                search: query || undefined,
                lat: lat || undefined,
                lng: lng || undefined
            });

            if (res.statusCode === 200 && res.data) {
                const newServices = res.data.data;
                setServices(prev => isNewSearch ? newServices : [...prev, ...newServices]);
                setHasMore(pageNum < res.data.totalPages);
                setTotal(res.data.total);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [query, lat, lng]);

    // Reset and fetch when filters change
    useEffect(() => {
        if (isSearching && aiResults.length === 0) {
            setPage(1);
            fetchServices(1, true);
        }
    }, [isSearching, query, lat, lng, fetchServices, aiResults.length]);

    // Load more when page changes
    useEffect(() => {
        if (page > 1 && aiResults.length === 0) {
            fetchServices(page, false);
        }
    }, [page, fetchServices, aiResults.length]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() || lat || lng) {
            setAiResults([]);
            setAiSearchEmpty(false);
            setIsSearching(true);
        }
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

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Search Input - Centered */}
            <form suppressHydrationWarning onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input suppressHydrationWarning value={query} type="text" placeholder="Quel service recherchez-vous ?" className="flex-1 bg-transparent outline-none text-foreground text-sm min-w-0 md:text-sm placeholder:text-muted-foreground" onChange={(e) => { setQuery(e.target.value); if (e.target.value === "" && !lat && !lng) setIsSearching(false); }} inputMode="text" style={{ fontSize: '16px' }} />
                    {query && (
                        <button type="button" onClick={() => { setQuery(""); if (!lat && !lng) setIsSearching(false); }} className="p-1 text-muted-foreground hover:text-primary transition-colors animate-in fade-in zoom-in duration-200" title="Effacer la recherche">
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                        </button>
                    )}
                    <button type="button" onClick={() => setIsImageModalOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Recherche par image (IA)" >
                        <Icon icon="solar:camera-bold-duotone" className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={handleUseMyLocation} className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-sm ml-2 flex-shrink-0 md:px-3 md:py-1.5" >
                        <Icon icon="solar:gps-bold-duotone" className="w-4 h-4" />
                        <span className="hidden md:inline">Ma position</span>
                    </button>
                </div>
                <button type="submit" className="w-full md:w-auto bg-primary text-white px-8 py-2 rounded-xl text-base font-black flex items-center justify-center gap-3 hover:bg-secondary transition-all shadow-xs active:scale-95 flex-shrink-0 md:px-8 md:py-2" >
                    Explorer
                    <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5" />
                </button>
            </form>

            {/* Adresse */}
            {address && (
                <div className="mb-8 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2 md:mb-8 md:px-4 md:py-2">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80 md:text-sm">{address}</span>
                </div>
            )}

            {/* Dynamic Results or Initial Steps */}
            {isSearching && (
                <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                    <div className="flex items-center justify-start md:justify-center w-full px-4 md:px-0 mb-6">
                        <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center">
                            {isAiLoading ? 'Analyses en cours...' : aiSearchEmpty ? '' : ``}
                        </h3>

                        {/* View Toggle */}
                        {displayedServices.length > 0 && (
                            <div className="flex bg-muted p-1 rounded-xl gap-1">
                                <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'map' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} >
                                    <Icon icon="solar:map-bold-duotone" className="w-4 h-4" />
                                    Carte
                                </button>
                                <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} >
                                    <Icon icon="solar:posts-carousel-vertical-bold-duotone" className="w-4 h-4" />
                                    Grille
                                </button>

                            </div>
                        )}
                    </div>

                    {viewMode === 'map' && displayedServices.length > 0 ? (
                        <div className="w-full stagger-item mb-8">
                            <ServicesMap services={displayedServices} userLocation={userLocation} onSelectService={(service) => withAuth(() => setSelectedService(service))} />
                        </div>
                    ) : (

                        <InfiniteScroll loadMore={() => setPage(prev => prev + 1)} hasMore={hasMore && aiResults.length === 0} isLoading={loading} className="w-full px-0 md:px-0"  >
                            {displayedServices.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
                                    {/* ... rest of the grid ... */}
                                    {displayedServices.map((service: any) => (
                                        <div key={service.id} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center bg-card w-full transition-all duration-300">
                                            {/* Image - Pleine largeur sans padding */}
                                            <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                                                <Image src={(service.imageUrls && typeof service.imageUrls === 'string' && service.imageUrls !== "") ? service.imageUrls : (Array.isArray(service.images) && service.images[0]) || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={service.title} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground shadow-sm uppercase tracking-tighter">
                                                    {service.categoryLabel || 'Expert'}
                                                </div>
                                            </div>

                                            {/* Contenu - Padding minimal */}
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
                                                        <p className="text-secondary font-black text-sm md:text-lg">
                                                            {service.price} <span className="text-[9px] font-bold text-muted-foreground">CFA</span>
                                                        </p>
                                                    </div>
                                                    <button onClick={() => withAuth(() => setSelectedService(service))} className="bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full md:rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm"  >
                                                        <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !loading && (
                                <NotFound title="Aucun service trouvé" description={aiSearchEmpty ? aiMessage : "Désolé, nous n'avons trouvé aucun service correspondant à votre recherche."} icon="solar:ghost-bold-duotone" />
                            )}
                        </InfiniteScroll>

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
        </div>
    );
}