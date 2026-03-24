"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Delivery, DeliveryStatus } from "@/types/interface";
import { getDeliveries, getMyDeliveries } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import { Button } from "../ui/button";
import { Modal } from "../modal/MotionModal";
import TrackingCard from "./TrackingCard";

interface DeliveriesListProps {
    role: "CLIENT" | "ENTREPRISE";
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; icon: string }> = {
    [DeliveryStatus.PREPARING]: { label: "Préparation", color: "text-amber-500 bg-amber-500/10", icon: "solar:box-bold-duotone" },
    [DeliveryStatus.IN_TRANSIT]: { label: "En transit", color: "text-blue-500 bg-blue-500/10", icon: "solar:plain-bold-duotone" },
    [DeliveryStatus.AT_CUSTOMS]: { label: "Dédouanement", color: "text-indigo-500 bg-indigo-500/10", icon: "solar:shield-user-bold-duotone" },
    [DeliveryStatus.OUT_FOR_DELIVERY]: { label: "Livraison locale", color: "text-sky-500 bg-sky-500/10", icon: "solar:delivery-bold-duotone" },
    [DeliveryStatus.DELIVERED]: { label: "Livré", color: "text-emerald-500 bg-emerald-500/10", icon: "solar:check-circle-bold-duotone" },
    [DeliveryStatus.CANCELLED]: { label: "Annulé", color: "text-red-500 bg-red-500/10", icon: "solar:close-circle-bold-duotone" },
};

export default function DeliveriesList({ role }: DeliveriesListProps) {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const { addNotification } = useNotification();

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const res = role === "CLIENT" ? await getMyDeliveries() : await getDeliveries();
            if (res.statusCode === 200) {
                const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
                setDeliveries(data);
            }
        } catch (error) {
            console.error("Error fetching deliveries:", error);
            addNotification("Erreur lors de la récupération des livraisons", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [role]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Icon icon="solar:refresh-bold-duotone" className="w-12 h-12 text-primary animate-spin" />
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Chargement des livraisons...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {deliveries.length > 0 ? (
                deliveries.map((delivery) => {
                    const status = STATUS_CONFIG[delivery.status];
                    return (
                        <div key={delivery.id} className="bg-card hover:bg-muted/10 border border-border rounded-3xl p-5 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${status.color}`}>
                                    <Icon icon={status.icon} className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-foreground uppercase tracking-tight">Code: {delivery.trackingCode}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                            <Icon icon="solar:calendar-date-bold-duotone" className="w-3.5 h-3.5" />
                                            Arrivée Est: {delivery.estimatedArrival ? new Date(delivery.estimatedArrival).toLocaleDateString('fr-FR') : 'Non définie'}
                                        </div>
                                        {delivery.quote?.service && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                                                <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5" />
                                                {delivery.quote.service.label}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pl-0 md:pl-6 md:border-l border-border/50">
                                <Button
                                    className="rounded-xl h-10 bg-primary hover:bg-secondary text-white font-black text-xs gap-2 px-6 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                    onClick={() => {
                                        setSelectedDelivery(delivery);
                                        setIsTrackingModalOpen(true);
                                    }}
                                >
                                    <Icon icon="solar:map-point-wave-bold-duotone" className="w-4 h-4" />
                                    SUIVRE LE COLIS
                                </Button>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="bg-card/30 border border-dashed border-border rounded-3xl py-20 flex flex-col items-center justify-center text-center px-6">
                    <Icon icon="solar:delivery-bold-duotone" className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-black text-foreground/70 uppercase mb-2">Aucune livraison</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Vous n'avez aucune livraison active ou passée pour le moment.
                    </p>
                </div>
            )}

            {/* Tracking Modal */}
            <Modal isOpen={isTrackingModalOpen} onClose={() => setIsTrackingModalOpen(false)}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <Icon icon="solar:map-point-wave-bold-duotone" className="text-primary w-7 h-7" />
                            Suivi de Livraison
                        </h2>
                        <button onClick={() => setIsTrackingModalOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                    {selectedDelivery && (
                        <TrackingCard
                            delivery={selectedDelivery}
                            isOwner={role === "ENTREPRISE"}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
