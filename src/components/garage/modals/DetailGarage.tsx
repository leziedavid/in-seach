"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { getGaragePieces } from "@/api/api";
import { Garage, GaragePieceCatalogue } from "@/types/interface";
import { Modal } from "@/components/ui/MotionModal";
import { calculateDistance } from "@/utils/calculateDistance";

const UserMap = dynamic(() => import("@/components/ui/Maps"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-40 bg-muted animate-pulse flex items-center justify-center rounded-2xl">
            <Icon icon="solar:map-bold-duotone" width={32} className="text-muted-foreground" />
        </div>
    ),
});

const DAY_ORDER = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface DetailGarageProps {
    isOpen: boolean;
    onClose: () => void;
    garage: Garage | null;
    userLocation?: { lat: number; lng: number } | null;
}

export default function DetailGarage({ isOpen, onClose, garage, userLocation }: DetailGarageProps) {
    const [pieces, setPieces] = useState<GaragePieceCatalogue[]>([]);
    const [loadingPieces, setLoadingPieces] = useState(false);

    const fetchPieces = useCallback(async () => {
        if (!garage) return;
        setLoadingPieces(true);
        try {
            const res = await getGaragePieces(garage.id);
            if (res.statusCode === 200 && res.data) setPieces(res.data);
        } finally {
            setLoadingPieces(false);
        }
    }, [garage]);

    useEffect(() => {
        if (isOpen && garage) fetchPieces();
    }, [isOpen, garage, fetchPieces]);

    if (!garage) return null;

    const whatsappHref = garage.whatsapp ? `https://wa.me/${garage.whatsapp.replace(/\D/g, "")}` : undefined;
    const phoneHref = garage.telephone ? `tel:${garage.telephone}` : undefined;

    const distanceKm = userLocation && garage.latitude != null && garage.longitude != null
        ? calculateDistance(userLocation.lat, userLocation.lng, garage.latitude, garage.longitude)
        : null;

    const openItinerary = () => {
        if (garage.latitude == null || garage.longitude == null) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${garage.latitude},${garage.longitude}`, "_blank");
    };

    const gallery = [garage.coverPhoto, ...(garage.images || [])].filter(Boolean) as string[];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={garage.nom}>
            <div className="p-6 space-y-6">
                {/* En-tête garage */}
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center relative overflow-hidden">
                        {garage.logo ? <img src={garage.logo} alt={garage.nom} className="w-full h-full object-cover" /> : <Icon icon="solar:garage-bold-duotone" className="w-7 h-7 text-primary" />}
                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${garage.actif ? "bg-emerald-500" : "bg-red-500"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-black text-foreground leading-tight">{garage.nom}</h2>
                        {garage.slogan && <p className="text-xs text-muted-foreground italic mt-0.5">{garage.slogan}</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-block text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${garage.actif ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                {garage.actif ? "Ouvert" : "Fermé"}
                            </span>
                            {garage.isAgence && (
                                <span className="inline-block text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">Agence</span>
                            )}
                            {distanceKm != null && (
                                <span className="inline-block text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">à {distanceKm} km</span>
                            )}
                        </div>
                        {(garage.adresseComplete || garage.commune || garage.ville) && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Icon icon="solar:map-point-bold-duotone" className="w-3.5 h-3.5 shrink-0" />
                                {garage.adresseComplete || [garage.quartier, garage.commune, garage.ville].filter(Boolean).join(", ")}
                            </p>
                        )}
                    </div>
                </div>

                {gallery.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {gallery.map((url, i) => (
                            <img key={i} src={url} alt="" className="w-28 h-20 rounded-xl object-cover shrink-0 border border-border" />
                        ))}
                    </div>
                )}

                {garage.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-2xl p-4">{garage.description}</p>
                )}

                {garage.servicesProposes && (
                    <div className="flex items-start gap-2 text-sm text-foreground/80">
                        <Icon icon="solar:wrench-bold-duotone" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{garage.servicesProposes}</span>
                    </div>
                )}

                {garage.horaires && garage.horaires.length > 0 && (
                    <div className="space-y-1.5">
                        <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Horaires</h3>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {[...garage.horaires].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)).map(h => (
                                <div key={h.day} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-1.5">
                                    <span className="font-bold text-foreground">{h.day}</span>
                                    <span className="text-muted-foreground">{h.closed ? "Fermé" : `${h.openTime || "—"} - ${h.closeTime || "—"}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {garage.latitude != null && garage.longitude != null && (
                    <div className="rounded-2xl overflow-hidden h-40">
                        <UserMap lat={garage.latitude} lng={garage.longitude} userName={garage.nom} />
                    </div>
                )}

                {/* Actions de contact */}
                <div className="flex gap-3">
                    <a
                        href={phoneHref}
                        aria-disabled={!phoneHref}
                        className={`flex-1 py-3.5 rounded-2xl bg-muted hover:bg-blue-500/10 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!phoneHref ? "opacity-40 pointer-events-none" : ""}`}
                    >
                        <Icon icon="solar:phone-bold-duotone" className="w-4 h-4" />
                        Appeler
                    </a>
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!whatsappHref}
                        className={`flex-1 py-3.5 rounded-2xl bg-muted hover:bg-green-500/10 hover:text-green-600 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!whatsappHref ? "opacity-40 pointer-events-none" : ""}`}
                    >
                        <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                        WhatsApp
                    </a>
                    <button
                        onClick={openItinerary}
                        disabled={garage.latitude == null || garage.longitude == null}
                        className="flex-1 py-3.5 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        <Icon icon="solar:routing-bold-duotone" className="w-4 h-4" />
                        Itinéraire
                    </button>
                </div>

                {/* Catalogue de pièces — consultatif uniquement */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Catalogue de pièces automobiles</h3>
                    {loadingPieces ? (
                        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)}</div>
                    ) : pieces.length === 0 ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                            <Icon icon="solar:box-minimalistic-bold-duotone" className="w-7 h-7 text-muted-foreground" />
                            <p className="text-xs font-bold text-muted-foreground">Aucune pièce renseignée pour ce garage</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pieces.map(piece => (
                                <div key={piece.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {piece.photo ? <img src={piece.photo} alt="" className="w-full h-full object-cover" /> : <Icon icon="solar:widget-4-bold-duotone" className="w-5 h-5 text-primary" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-foreground truncate">{piece.nom}</p>
                                        <p className="text-primary font-black text-sm">{piece.prix.toLocaleString()} FCFA</p>
                                        {(piece.marqueVehicule || piece.modele || piece.vehicleType?.name) && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {[piece.vehicleType?.name, piece.marqueVehicule, piece.modele].filter(Boolean).join(" • ")}
                                            </p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        Disponible en magasin
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-[11px] text-muted-foreground/80 px-1 italic">Catalogue informatif — aucune vente en ligne. Déplacez-vous au garage pour l'achat.</p>
                </div>
            </div>
        </Modal>
    );
}
