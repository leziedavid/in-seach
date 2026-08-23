"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { getPublicGasBottles, createGasDelivery, getMyGasDeliveries, cancelMyGasDelivery } from "@/api/api";
import { GasBottle, GasDelivery, GasDeliveryStatus } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import { Modal } from "@/components/ui/MotionModal";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";
import OnBack from "@/components/shared/OnBack";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { GAS_BOTTLE_FORMAT_CONFIG } from "@/components/gas-delivery/gasBottleFormat";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";

const UserMap = dynamic(() => import("@/components/ui/Maps"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-40 bg-muted animate-pulse flex items-center justify-center rounded-2xl">
            <Icon icon="solar:map-bold-duotone" width={32} className="text-muted-foreground" />
        </div>
    ),
});

const STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    ACCEPTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    DELIVERED: "bg-green-500/10 text-green-600 dark:text-green-400",
    CANCELED: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: "EN ATTENTE",
    ACCEPTED: "ACCEPTÉE",
    DELIVERED: "LIVRÉE",
    CANCELED: "ANNULÉE",
};

const NEARBY_RADIUS_KM = 15;
const ITEMS_PER_PAGE = 6;

const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface GasRefillRequestProps {
    onBack: () => void;
}

export default function GasRefillRequest({ onBack }: GasRefillRequestProps) {
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();

    // ── Recherche & navigation du catalogue (même workflow que SearchGaz) ──
    const [query, setQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [browseLat, setBrowseLat] = useState<number | undefined>();
    const [browseLng, setBrowseLng] = useState<number | undefined>();
    const [browseAddress, setBrowseAddress] = useState("");

    const [bottles, setBottles] = useState<GasBottle[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const [myDeliveries, setMyDeliveries] = useState<GasDelivery[]>([]);

    // ── Gestion interne de la demande de recharge (workflow propre à ce composant) ──
    const [selectedBottle, setSelectedBottle] = useState<GasBottle | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [address, setAddress] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: (() => void) | null; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }>({
        isOpen: false, action: null, title: "", message: "", confirmLabel: "Confirmer", variant: "danger", icon: "",
    });
    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const fetchBottles = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const res = await getPublicGasBottles({ page: pageNum, limit: ITEMS_PER_PAGE });
            if (res.statusCode === 200 && res.data) {
                const newBottles = res.data.data;
                setBottles(prev => {
                    const combined = isNewSearch ? newBottles : [...prev, ...newBottles];
                    return Array.from(new Map(combined.map(b => [b.id, b])).values());
                });
                setHasMore(pageNum < res.data.totalPages);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching gas bottles:", error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, []);

    const fetchMyDeliveries = useCallback(async () => {
        const res = await getMyGasDeliveries();
        if (res.statusCode === 200) setMyDeliveries(res.data || []);
    }, []);

    useEffect(() => {
        fetchBottles(1, true);
        fetchMyDeliveries();
    }, [fetchBottles, fetchMyDeliveries]);

    useEffect(() => {
        if (page > 1) fetchBottles(page, false);
    }, [page, fetchBottles]);

    // ── Filtrage texte + tri par proximité (côté client, sur le catalogue chargé) ──
    const displayedBottles = useMemo(() => {
        let list = bottles;
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(b =>
                b.brand.toLowerCase().includes(q) ||
                b.provider?.companyName?.toLowerCase().includes(q) ||
                GAS_BOTTLE_FORMAT_CONFIG[b.format].label.toLowerCase().includes(q)
            );
        }
        if (browseLat != null && browseLng != null) {
            list = [...list].sort((a, b) => {
                const da = a.provider?.latitude != null && a.provider?.longitude != null ? distanceKm(browseLat, browseLng, a.provider.latitude, a.provider.longitude) : Infinity;
                const db = b.provider?.latitude != null && b.provider?.longitude != null ? distanceKm(browseLat, browseLng, b.provider.latitude, b.provider.longitude) : Infinity;
                return da - db;
            });
        }
        return list;
    }, [bottles, query, browseLat, browseLng]);

    const isFallback = useMemo(() => {
        if (browseLat == null || browseLng == null) return false;
        return !bottles.some(b => b.provider?.latitude != null && b.provider?.longitude != null && distanceKm(browseLat, browseLng, b.provider.latitude, b.provider.longitude) <= NEARBY_RADIUS_KM);
    }, [bottles, browseLat, browseLng]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleUseMyLocation = async () => {
        const location = await getUserLocation();
        if (location) {
            setBrowseLat(location.lat ?? undefined);
            setBrowseLng(location.lng ?? undefined);
            setBrowseAddress(`${location.city || ''}, ${location.country || ''}`.replace(/^, |, $/g, '') || 'Position obtenue');
        }
    };

    const handleVoiceResult = (text: string) => {
        setQuery(text);
    };

    // ── Demande de recharge ──
    const openRequestModal = (bottle: GasBottle) => {
        setSelectedBottle(bottle);
        setAddress("");
        setClientPhone("");
        setCoords(null);
        setIsRequestModalOpen(true);
    };

    const handleLocate = async () => {
        setLocating(true);
        try {
            const loc = await getUserLocation();
            if (loc?.lat != null && loc?.lng != null) {
                setCoords({ lat: loc.lat, lng: loc.lng });
                const parts = [loc.street, loc.district, loc.city].filter(Boolean);
                if (parts.length) setAddress(parts.join(", "));
            }
        } finally {
            setLocating(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!selectedBottle) return;
        if (!address.trim() || !clientPhone.trim() || !coords) {
            addNotification("Adresse, téléphone et position GPS sont requis", "error");
            return;
        }
        setSubmitting(true);
        try {
            const res = await createGasDelivery({
                clientPhone,
                address,
                latitude: coords.lat,
                longitude: coords.lng,
                bottleId: selectedBottle.id,
            });
            if (res.statusCode === 201) {
                addNotification("Votre demande a été envoyée aux prestataires disponibles", "success");
                setIsRequestModalOpen(false);
                fetchMyDeliveries();
            } else {
                addNotification(res.message || "Erreur lors de l'envoi de la demande", "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = (delivery: GasDelivery) => {
        setConfirmState({
            isOpen: true,
            action: async () => {
                const res = await cancelMyGasDelivery(delivery.id);
                if (res.statusCode === 200) {
                    addNotification("Demande annulée", "success");
                    fetchMyDeliveries();
                } else {
                    addNotification(res.message || "Erreur lors de l'annulation", "error");
                }
            },
            title: "Annuler la demande",
            message: "Voulez-vous vraiment annuler cette demande de recharge ?",
            confirmLabel: "Oui, annuler",
            variant: "danger",
            icon: "solar:close-circle-bold-duotone",
        });
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2 md:px-4 py-2">
            <OnBack
                label="Recharge de gaz à domicile"
                onBack={onBack}
                subtitle="Choisissez une bouteille et faites-vous livrer directement chez vous, ou contactez un prestataire en direct."
                className="mb-6"
            />

            {/* Recherche - même workflow que SearchGaz */}
            <form onSubmit={handleSearch} className="flex flex-row items-stretch justify-center gap-2 w-full max-w-2xl mb-2 relative">
                <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-2 shadow-sm hover:border-secondary transition-colors">
                    <Icon icon="solar:fire-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <input value={query} type="text" placeholder="Rechercher une bouteille de gaz..."
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
                    <button type="button" onClick={handleUseMyLocation} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Bouteilles à proximité" >
                        <Icon icon="solar:gps-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
                <button type="submit" className="flex-shrink-0 px-3 bg-transparent border border-border/40 text-muted-foreground hover:text-primary rounded-xl shadow-sm transition-all active:scale-95 hover:border-primary/50 flex items-center justify-center" >
                    <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5" />
                </button>
            </form>
            {browseAddress && (
                <div className="mb-4 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2">
                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{browseAddress}</span>
                </div>
            )}
            {browseLat && browseLng && isFallback && (
                <div className="mb-8 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 flex items-center gap-2">
                    <Icon icon="solar:info-circle-bold-duotone" className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm text-foreground/80">Aucune bouteille à proximité — affichage de toutes les bouteilles disponibles</span>
                </div>
            )}

            {/* Catalogue de bouteilles */}
            <div className="w-full mb-8">
                <div className="flex items-center justify-between w-full mb-4">
                    <h3 className="text-lg font-black text-foreground">Bouteilles disponibles</h3>
                    {displayedBottles.length > 0 && (
                        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    )}
                </div>

                {loading && displayedBottles.length === 0 ? (
                    <Loader
                        title="Recherche de bouteilles..."
                        description="Nous recherchons les bouteilles de gaz disponibles correspondant à vos critères."
                        icon="solar:fire-bold-duotone"
                    />
                ) : !loading && displayedBottles.length === 0 ? (
                    <NotFound
                        title="Aucune bouteille trouvée"
                        description="Aucune bouteille de gaz ne correspond à votre recherche. Essayez d'autres mots-clés ou une localisation différente."
                        icon="solar:fire-bold-duotone"
                    />
                ) : (
                    <InfiniteScroll
                        items={displayedBottles}
                        loadMore={() => setPage(prev => prev + 1)}
                        hasMore={hasMore}
                        isLoading={loading}
                        skeletonType="default"
                        skeletonCount={3}
                        gridClassName={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}
                        renderItem={(bottle: GasBottle) => {
                            const whatsappHref = bottle.provider?.whatsapp ? `https://wa.me/${bottle.provider.whatsapp.replace(/\D/g, "")}` : undefined;
                            const phoneHref = bottle.provider?.phone ? `tel:${bottle.provider.phone}` : undefined;
                            return (
                                <div key={bottle.id} className={`group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 ${viewMode === 'grid' ? "p-4 flex flex-col items-center text-center" : "p-4 flex flex-row items-center gap-4 text-left"}`}>
                                    <div className={`relative shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center ${viewMode === 'grid' ? "w-16 h-16 mb-3" : "w-14 h-14"}`}>
                                        <Icon icon={GAS_BOTTLE_FORMAT_CONFIG[bottle.format].icon} className="w-7 h-7 text-primary" />
                                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${bottle.isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
                                    </div>
                                    <div className={`flex flex-col flex-1 min-w-0 ${viewMode === 'grid' ? "w-full items-center" : ""}`}>
                                        <p className="text-sm font-black text-foreground truncate w-full">{bottle.brand} — {GAS_BOTTLE_FORMAT_CONFIG[bottle.format].label} ({bottle.weight}kg)</p>
                                        <p className="text-xs text-muted-foreground truncate w-full">{bottle.provider?.companyName}</p>
                                        <p className="text-primary font-black text-sm mt-1">{bottle.price.toLocaleString()} FCFA</p>
                                        <div className={`flex gap-2 mt-3 w-full ${viewMode === 'grid' ? "justify-center" : ""}`}>
                                            <button onClick={() => openRequestModal(bottle)} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-wide hover:bg-secondary transition-all active:scale-95">
                                                Demander la livraison
                                            </button>
                                            {phoneHref && (
                                                <a href={phoneHref} className="p-2.5 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-all shrink-0" title="Appeler">
                                                    <Icon icon="solar:phone-bold-duotone" className="w-4 h-4" />
                                                </a>
                                            )}
                                            {whatsappHref && (
                                                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-muted hover:bg-green-500/10 hover:text-green-600 transition-all shrink-0" title="WhatsApp">
                                                    <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                        className="w-full"
                    />
                )}
            </div>

            {/* Mes demandes — gestion interne propre à GasRefillRequest */}
            <div className="w-full">
                <h3 className="text-lg font-black text-foreground mb-4">Mes demandes</h3>
                {myDeliveries.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                        <Icon icon="solar:clipboard-list-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                        <p className="text-xs font-bold text-muted-foreground">Vous n'avez pas encore fait de demande de recharge</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {myDeliveries.map(delivery => (
                            <div key={delivery.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
                                <div className="min-w-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[delivery.status]}`}>{STATUS_LABEL[delivery.status]}</span>
                                    <p className="text-sm font-black text-foreground mt-1">{delivery.bottle?.brand} — {delivery.bottle?.weight}kg</p>
                                    {delivery.provider && <p className="text-xs text-muted-foreground">Livré par {delivery.provider.companyName}</p>}
                                </div>
                                {delivery.status === GasDeliveryStatus.PENDING && (
                                    <button onClick={() => handleCancel(delivery)} className="shrink-0 px-3 py-2 rounded-xl bg-muted hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 font-black text-[10px] uppercase tracking-wide transition-all">
                                        Annuler
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de demande */}
            <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)}>
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <Icon icon="solar:fire-bold-duotone" className="text-primary w-6 h-6" />
                        Demande de recharge
                    </h2>
                    {selectedBottle && (
                        <p className="text-sm text-muted-foreground">
                            {selectedBottle.brand} — {GAS_BOTTLE_FORMAT_CONFIG[selectedBottle.format].label} ({selectedBottle.weight}kg) • <span className="font-black text-primary">{selectedBottle.price.toLocaleString()} FCFA</span>
                        </p>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Adresse de livraison</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Cocody Angré, Rue des Jardins" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Numéro de téléphone</label>
                        <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Ex: 0102030405" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>

                    <div className="space-y-2">
                        <button onClick={handleLocate} disabled={locating} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                            {locating ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:gps-bold-duotone" className="w-4 h-4" />}
                            {coords ? "Position détectée — actualiser" : "Utiliser ma position actuelle"}
                        </button>
                        {coords && (
                            <div className="rounded-2xl overflow-hidden h-40">
                                <UserMap lat={coords.lat} lng={coords.lng} />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsRequestModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-muted hover:bg-muted/80 transition-all">Annuler</button>
                        <button onClick={handleSubmitRequest} disabled={submitting} className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {submitting ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                            Envoyer la demande
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmAction
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={() => { confirmState.action?.(); closeConfirm(); }}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                icon={confirmState.icon}
            />

            <VoiceSearchModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} onResult={handleVoiceResult} />
        </div>
    );
}
