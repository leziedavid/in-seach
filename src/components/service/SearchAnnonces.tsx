"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { getAnnonces } from "@/api/api";
import { Annonce, UserLocation } from "@/types/interface";
import { getUserLocation } from "@/utils/location";
import AnnonceModal from "../home/AnnonceModal";
import InfiniteScroll from "../ui/InfiniteScroll";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function SearchAnnonces() {
    const { withAuth } = useRequireAuth();
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [lat, setLat] = useState<number | undefined>();
    const [lng, setLng] = useState<number | undefined>();
    const [address, setAddress] = useState<string>("");

    // State-based pagination
    const [annonces, setAnnonces] = useState<Annonce[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const ITEMS_PER_PAGE = 6;

    const fetchAnnonces = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loading) return;
        setLoading(true);

        try {
            const res = await getAnnonces({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: query || undefined,
                lat: lat || undefined,
                lng: lng || undefined,
                radiusKm: lat && lng ? 10 : undefined
            });

            if (res.statusCode === 200 && res.data) {
                const newAnnonces = res.data.data;
                setAnnonces(prev => isNewSearch ? newAnnonces : [...prev, ...newAnnonces]);
                setHasMore(pageNum < res.data.totalPages);
                setTotal(res.data.total);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching annonces:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [query, lat, lng]);

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1);
        fetchAnnonces(1, true);
        // if (isSearching) {
        //     setPage(1);
        //     fetchAnnonces(1, true);
        // }
    }, [isSearching, query, lat, lng, fetchAnnonces]);

    // Load more when page changes
    useEffect(() => {
        if (page > 1) {
            fetchAnnonces(page, false);
        }
    }, [page, fetchAnnonces]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() || lat || lng) {
            setAnnonces([]);
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

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Search Input - Centered */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input value={query} type="text" placeholder="Quelle annonce recherchez-vous ?"
                        className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 md:text-sm placeholder:text-muted-foreground"
                        onChange={(e) => { setQuery(e.target.value); }}
                        inputMode="text" style={{ fontSize: '16px' }}
                    />
                    <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-sm ml-2 flex-shrink-0 md:px-3 md:py-1.5" >
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
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0 md:w-4 md:h-4" />
                    <span className="text-sm text-foreground/80 md:text-sm">{address}</span>
                </div>
            )}

            {/* Résultats de recherche */}
            {/* {isSearching && ( */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                <div className="flex items-center justify-start md:justify-center w-full px-2 md:px-0 mb-6">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center">
                        {loading && annonces.length === 0 ? 'Recherche en cours...' : `${annonces.length} résultat${annonces.length > 1 ? 's' : ''}`}
                    </h3>
                </div>

                <InfiniteScroll loadMore={() => setPage(prev => prev + 1)} hasMore={hasMore} isLoading={loading} className="w-full px-2 md:px-0" >
                    {annonces.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6 stagger-parent">
                            {annonces.map((annonce: Annonce) => (
                                <div key={annonce.id} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center bg-card w-full transition-all duration-300 shadow-sm hover:shadow-md hover-lift stagger-item">
                                    {/* Image */}
                                    <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                                        <Image src={(annonce.images?.[0] && typeof annonce.images?.[0] === 'string') ? annonce.images[0] : (Array.isArray(annonce.images) && (annonce.images[0] as any)?.fileUrl) || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={annonce.title} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                        {annonce.categorie && (
                                            <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground shadow-sm uppercase tracking-tighter">
                                                {annonce.categorie.label}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contenu */}
                                    <div className="px-0.5 pb-0 md:px-0 md:pb-0 w-full">
                                        <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors w-full text-left leading-tight">
                                            {annonce.title}
                                        </h3>

                                        <div className="flex items-center justify-start gap-1 text-primary mb-2 md:mb-4 md:justify-center">
                                            <Icon icon="solar:star-bold-duotone" className="w-2.5 h-2.5 fill-current md:w-3 md:h-3" />
                                            <span className="text-[9px] md:text-xs font-black tracking-tight">
                                                4.9 • <span className="text-muted-foreground">
                                                    {annonce.type?.label || 'Annonce'}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="w-full flex items-center justify-between mt-auto">
                                            <div className="text-left">
                                                <p className="text-secondary font-black text-sm md:text-lg">
                                                    {annonce.price?.toLocaleString() || '0'} <span className="text-[9px] font-bold text-muted-foreground">CFA</span>
                                                </p>
                                            </div>
                                            <button onClick={() => withAuth(() => setSelectedAnnonce(annonce))} className="bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full md:rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm">
                                                <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <p className="text-lg">Aucune annonce trouvée</p>
                            <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
                        </div>
                    )}
                </InfiniteScroll>
            </div>
            {/* )} */}

            {/* Modal de réservation */}
            <AnnonceModal
                isOpen={!!selectedAnnonce}
                onClose={() => setSelectedAnnonce(null)}
                annonce={selectedAnnonce}
            />
        </div>
    );
}