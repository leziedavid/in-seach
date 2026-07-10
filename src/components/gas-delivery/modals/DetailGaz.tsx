"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { getPublicGasBottles, createGasDelivery } from "@/api/api";
import { GasProvider, GasBottle } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import { Modal } from "@/components/ui/MotionModal";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";
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

const DIRECT_CONTACT_WARNING =
    "Les commandes effectuées directement par téléphone ou via WhatsApp ne sont pas prises en charge par Djamko. En cas de litige ou de problème, la plateforme ne pourra garantir aucun suivi ni aucune assistance. Pour bénéficier du suivi et des garanties de Djamko, veuillez passer votre commande directement depuis l'application.";

interface DetailGazProps {
    isOpen: boolean;
    onClose: () => void;
    provider: GasProvider | null;
}

interface ConfirmState {
    isOpen: boolean;
    action: (() => void) | null;
    title: string;
    message: string;
    confirmLabel: string;
    variant: ConfirmVariant;
    icon: string;
}

export default function DetailGaz({ isOpen, onClose, provider }: DetailGazProps) {
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();

    const [bottles, setBottles] = useState<GasBottle[]>([]);
    const [loadingBottles, setLoadingBottles] = useState(false);

    // Commande
    const [orderBottle, setOrderBottle] = useState<GasBottle | null>(null);
    const [address, setAddress] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false, action: null, title: "", message: "", confirmLabel: "Confirmer", variant: "info", icon: "",
    });
    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const fetchBottles = useCallback(async () => {
        if (!provider) return;
        setLoadingBottles(true);
        try {
            const res = await getPublicGasBottles({ page: 1, limit: 50, providerId: provider.id });
            if (res.statusCode === 200 && res.data) setBottles(res.data.data || []);
        } finally {
            setLoadingBottles(false);
        }
    }, [provider]);

    useEffect(() => {
        if (isOpen && provider) {
            fetchBottles();
            setOrderBottle(null);
            setAddress("");
            setClientPhone("");
            setCoords(null);
        }
    }, [isOpen, provider, fetchBottles]);

    if (!provider) return null;

    const whatsappHref = provider.whatsapp ? `https://wa.me/${provider.whatsapp.replace(/\D/g, "")}` : undefined;
    const phoneHref = provider.phone ? `tel:${provider.phone}` : undefined;

    const confirmDirectContact = (type: "call" | "whatsapp") => {
        const href = type === "call" ? phoneHref : whatsappHref;
        if (!href) return;
        setConfirmState({
            isOpen: true,
            action: () => {
                if (type === "call") {
                    window.location.href = href;
                } else {
                    window.open(href, "_blank", "noopener,noreferrer");
                }
            },
            title: "Commande hors application",
            message: DIRECT_CONTACT_WARNING,
            confirmLabel: type === "call" ? "Appeler quand même" : "Continuer vers WhatsApp",
            variant: "warning",
            icon: "solar:danger-triangle-bold-duotone",
        });
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

    const submitOrder = async () => {
        if (!orderBottle) return;
        setSubmitting(true);
        try {
            const res = await createGasDelivery({
                clientPhone,
                address,
                latitude: coords!.lat,
                longitude: coords!.lng,
                bottleId: orderBottle.id,
            });
            if (res.statusCode === 201) {
                addNotification("Votre demande a été envoyée aux prestataires disponibles", "success");
                setOrderBottle(null);
                onClose();
            } else {
                addNotification(res.message || "Erreur lors de l'envoi de la demande", "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmOrder = () => {
        if (!address.trim() || !clientPhone.trim() || !coords) {
            addNotification("Adresse, téléphone et position GPS sont requis", "error");
            return;
        }
        setConfirmState({
            isOpen: true,
            action: submitOrder,
            title: "Confirmer la commande",
            message: `Confirmez-vous la demande de livraison pour ${orderBottle?.brand} — ${orderBottle ? GAS_BOTTLE_FORMAT_CONFIG[orderBottle.format].label : ""} (${orderBottle?.weight}kg) à ${orderBottle?.price.toLocaleString()} FCFA ?`,
            confirmLabel: "Oui, commander",
            variant: "success",
            icon: "solar:check-circle-bold-duotone",
        });
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={provider.companyName}>
                <div className="p-6 space-y-6">
                    {/* En-tête prestataire */}
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                            <Icon icon="mdi:propane-tank" className="w-7 h-7 text-primary" />
                            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${provider.isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-black text-foreground leading-tight">{provider.companyName}</h2>
                            <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${provider.isAvailable ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                {provider.isAvailable ? "Disponible" : "Indisponible"}
                            </span>
                            {provider.address && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <Icon icon="solar:map-point-bold-duotone" className="w-3.5 h-3.5 shrink-0" />
                                    {provider.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {provider.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-2xl p-4">{provider.description}</p>
                    )}

                    {provider.latitude != null && provider.longitude != null && (
                        <div className="rounded-2xl overflow-hidden h-40">
                            <UserMap lat={provider.latitude} lng={provider.longitude} userName={provider.companyName} />
                        </div>
                    )}

                    {/* Actions de contact direct */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => confirmDirectContact("call")}
                            disabled={!phoneHref}
                            className="flex-1 py-3.5 rounded-2xl bg-muted hover:bg-blue-500/10 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            <Icon icon="solar:phone-bold-duotone" className="w-4 h-4" />
                            Appeler
                        </button>
                        <button
                            onClick={() => confirmDirectContact("whatsapp")}
                            disabled={!whatsappHref}
                            className="flex-1 py-3.5 rounded-2xl bg-muted hover:bg-green-500/10 hover:text-green-600 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                            WhatsApp
                        </button>
                    </div>

                    {/* Catalogue de bouteilles */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Catalogue de bouteilles</h3>
                        {loadingBottles ? (
                            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)}</div>
                        ) : bottles.length === 0 ? (
                            <div className="py-8 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                                <Icon icon="solar:box-minimalistic-bold-duotone" className="w-7 h-7 text-muted-foreground" />
                                <p className="text-xs font-bold text-muted-foreground">Aucune bouteille disponible pour ce prestataire</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {bottles.map(bottle => (
                                    <div key={bottle.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Icon icon={GAS_BOTTLE_FORMAT_CONFIG[bottle.format].icon} className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-foreground truncate">{bottle.brand} — {GAS_BOTTLE_FORMAT_CONFIG[bottle.format].label} ({bottle.weight}kg)</p>
                                                <p className="text-primary font-black text-sm">{bottle.price.toLocaleString()} FCFA</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setOrderBottle(bottle)}
                                            disabled={!provider.isAvailable || !bottle.isAvailable}
                                            className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-wide hover:bg-secondary transition-all active:scale-95 disabled:opacity-40"
                                        >
                                            Commander
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Formulaire de commande */}
                    {orderBottle && (
                        <div className="space-y-4 p-4 rounded-2xl border-2 border-primary/20 bg-primary/5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-foreground">
                                    Commander : {orderBottle.brand} — {GAS_BOTTLE_FORMAT_CONFIG[orderBottle.format].label}
                                </h3>
                                <button onClick={() => setOrderBottle(null)} className="p-1.5 rounded-full hover:bg-muted transition">
                                    <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Adresse de livraison</label>
                                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Cocody Angré, Rue des Jardins" className="w-full bg-card border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Numéro de téléphone</label>
                                <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Ex: 0102030405" className="w-full bg-card border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                            </div>

                            <div className="space-y-2">
                                <button type="button" onClick={handleLocate} disabled={locating} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-card hover:bg-primary/10 hover:text-primary font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                                    {locating ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:gps-bold-duotone" className="w-4 h-4" />}
                                    {coords ? "Position détectée — actualiser" : "Utiliser ma position actuelle"}
                                </button>
                                {coords && (
                                    <div className="rounded-2xl overflow-hidden h-40">
                                        <UserMap lat={coords.lat} lng={coords.lng} />
                                    </div>
                                )}
                            </div>

                            <button onClick={handleConfirmOrder} disabled={submitting} className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {submitting ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                                Envoyer la demande de livraison
                            </button>
                        </div>
                    )}
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
                isLoading={submitting}
            />
        </>
    );
}
