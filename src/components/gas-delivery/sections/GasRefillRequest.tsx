"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { getPublicGasBottles, createGasDelivery, getMyGasDeliveries, cancelMyGasDelivery } from "@/api/api";
import { GasBottle, GasDelivery, GasDeliveryStatus } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import { Modal } from "@/components/ui/MotionModal";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { GAS_BOTTLE_FORMAT_CONFIG } from "@/components/gas-delivery/gasBottleFormat";

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

export default function GasRefillRequest() {
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();

    const [bottles, setBottles] = useState<GasBottle[]>([]);
    const [loadingBottles, setLoadingBottles] = useState(true);
    const [myDeliveries, setMyDeliveries] = useState<GasDelivery[]>([]);

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

    const fetchBottles = useCallback(async () => {
        setLoadingBottles(true);
        try {
            const res = await getPublicGasBottles({ page: 1, limit: 20 });
            if (res.statusCode === 200 && res.data) setBottles(res.data.data || []);
        } finally {
            setLoadingBottles(false);
        }
    }, []);

    const fetchMyDeliveries = useCallback(async () => {
        const res = await getMyGasDeliveries();
        if (res.statusCode === 200) setMyDeliveries(res.data || []);
    }, []);

    useEffect(() => {
        fetchBottles();
        fetchMyDeliveries();
    }, [fetchBottles, fetchMyDeliveries]);

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
            <SectionHeader
                title="Recharge de gaz à domicile"
                subtitle="Choisissez une bouteille et faites-vous livrer directement chez vous, ou contactez un prestataire en direct."
                className="mb-6"
            />

            <div className="w-full mb-8">
                <h3 className="text-lg font-black text-foreground mb-4">Bouteilles disponibles</h3>
                {loadingBottles ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}</div>
                ) : bottles.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                        <Icon icon="solar:fire-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                        <p className="text-xs font-bold text-muted-foreground">Aucune bouteille disponible pour le moment</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bottles.map(bottle => {
                            const whatsappHref = bottle.provider?.whatsapp ? `https://wa.me/${bottle.provider.whatsapp.replace(/\D/g, "")}` : undefined;
                            const phoneHref = bottle.provider?.phone ? `tel:${bottle.provider.phone}` : undefined;
                            return (
                                <div key={bottle.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Icon icon={GAS_BOTTLE_FORMAT_CONFIG[bottle.format].icon} className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-foreground">{bottle.brand} — {GAS_BOTTLE_FORMAT_CONFIG[bottle.format].label} ({bottle.weight}kg)</p>
                                            <p className="text-xs text-muted-foreground">{bottle.provider?.companyName}</p>
                                            <p className="text-primary font-black text-sm mt-1">{bottle.price.toLocaleString()} FCFA</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openRequestModal(bottle)} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-wide hover:bg-secondary transition-all">
                                            Demander la livraison
                                        </button>
                                        {phoneHref && (
                                            <a href={phoneHref} className="p-2.5 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-all" title="Appeler">
                                                <Icon icon="solar:phone-bold-duotone" className="w-4 h-4" />
                                            </a>
                                        )}
                                        {whatsappHref && (
                                            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-muted hover:bg-green-500/10 hover:text-green-600 transition-all" title="WhatsApp">
                                                <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
        </div>
    );
}
