"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { useInfiniteQuery } from "@tanstack/react-query";
import { getServices, searchServiceIA } from "@/api/api";
import { UserLocation, Service } from "@/types/interface";
import { getUserLocation } from "@/utils/location";
import BookingModal from "../home/BookingModal";
import ImageSearchModal from "./ImageSearchModal";
import InfiniteScroll from "../ui/InfiniteScroll";

export default function SearchServies() {

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

    const { data: servicesRes, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['home-services', query], queryFn: ({ pageParam = 1 }) => getServices({ page: pageParam as number, limit: 3, search: query }), initialPageParam: 1, getNextPageParam: (lastPage) => {
            if (!lastPage.data) return undefined;
            const { page, totalPages } = lastPage.data;
            return page < totalPages ? page + 1 : undefined;
        },
        enabled: isSearching
    });

    const services = aiResults.length > 0 ? aiResults : (servicesRes?.pages.flatMap(page => page.data?.data || []) || []);

    const totalResults = aiResults.length > 0 ? aiResults.length : (servicesRes?.pages[0]?.data?.total || 0);


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setAiResults([]); // Clear AI results on manual search
            setAiSearchEmpty(false); // Reset empty state
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
        }
    };

    const handleImageSearch = async (file: File) => {
        setIsAiLoading(true);
        setAiSearchEmpty(false);
        setAiResults([]);
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
            alert("Erreur lors de la recherche IA.");
        } finally {
            setIsAiLoading(false);
            setIsImageModalOpen(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Search Input - Centered */}
            <form suppressHydrationWarning onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input suppressHydrationWarning value={query} type="text"
                        placeholder="Quel service recherchez-vous ?"
                        className="flex-1 bg-transparent outline-none text-foreground text-sm min-w-0 md:text-sm placeholder:text-muted-foreground"
                        onChange={(e) => { setQuery(e.target.value); if (e.target.value === "") setIsSearching(false); }}
                        inputMode="text"
                        style={{ fontSize: '16px' }}
                    />
                    <button type="button" onClick={() => setIsImageModalOpen(true)}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        title="Recherche par image (IA)" >
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
                    <div className="flex items-center justify-start md:justify-center w-full px-2 md:px-0 mb-6">
                        <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center">
                            {isLoading ? 'Analyses en cours...' : aiSearchEmpty ? 'Aucun résultat' : `${totalResults} résultats`}
                        </h3>
                    </div>


                    <InfiniteScroll loadMore={fetchNextPage} hasMore={!!hasNextPage} isLoading={isFetchingNextPage} className="w-full px-2 md:px-0" >
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
                            {services.map((service: any) => (
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
                                            <button onClick={() => setSelectedService(service)} className="bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full md:rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm"  >
                                                <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfiniteScroll>
                </div>

            )}


            {/* Booking Modal */}
            <BookingModal
                isOpen={!!selectedService}
                onClose={() => setSelectedService(null)}
                service={selectedService} />

            <ImageSearchModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onSearch={handleImageSearch}
                isLoading={isAiLoading}
            />
        </div>
    );
}