"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Delivery, DeliveryStatus, DeliveryTracking } from "@/types/interface";
import { getTrackingByDelivery, createTrackingEvent } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import { Button } from "../ui/button";

interface TrackingCardProps {
    delivery: Delivery;
    isOwner?: boolean;
}

const STATUS_STYLING: Record<DeliveryStatus, { label: string; color: string; icon: string }> = {
    [DeliveryStatus.PREPARING]: { label: "Préparation", color: "text-amber-500 bg-amber-500/10", icon: "solar:box-bold-duotone" },
    [DeliveryStatus.IN_TRANSIT]: { label: "En transit", color: "text-blue-500 bg-blue-500/10", icon: "solar:plain-bold-duotone" },
    [DeliveryStatus.AT_CUSTOMS]: { label: "Dédouanement", color: "text-indigo-500 bg-indigo-500/10", icon: "solar:shield-user-bold-duotone" },
    [DeliveryStatus.OUT_FOR_DELIVERY]: { label: "En cours de livraison", color: "text-sky-500 bg-sky-500/10", icon: "solar:delivery-bold-duotone" },
    [DeliveryStatus.DELIVERED]: { label: "Livré", color: "text-emerald-500 bg-emerald-500/10", icon: "solar:check-circle-bold-duotone" },
    [DeliveryStatus.CANCELLED]: { label: "Annulé", color: "text-red-500 bg-red-500/10", icon: "solar:close-circle-bold-duotone" },
};

export default function TrackingCard({ delivery, isOwner = false }: TrackingCardProps) {
    const [events, setEvents] = useState<DeliveryTracking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const { addNotification } = useNotification();

    // Form state for new event
    const [newEvent, setNewEvent] = useState<{ status: DeliveryStatus, location: string, note: string }>({
        status: delivery.status,
        location: "",
        note: ""
    });

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await getTrackingByDelivery(delivery.id);
            if (res.statusCode === 200) {
                const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching tracking events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [delivery.id]);

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.location) return;

        setIsAdding(true);
        try {
            const res = await createTrackingEvent(delivery.id, newEvent);
            if (res.statusCode === 201) {
                addNotification("Événement de suivi ajouté", "success");
                setNewEvent({ ...newEvent, location: "", note: "" });
                fetchEvents();
            }
        } catch (error) {
            addNotification("Erreur lors de l'ajout", "error");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Icon icon="solar:delivery-bold-duotone" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Code de suivi</p>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{delivery.trackingCode}</h3>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-wider ${STATUS_STYLING[delivery.status].color}`}>
                    {STATUS_STYLING[delivery.status].label}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Timeline */}
                <div className={`${isOwner ? 'lg:col-span-12' : 'lg:col-span-12'} space-y-4`}>
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6">Chronologie des événements</h4>

                    <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-border before:border-dashed before:border-l">
                        {loading ? (
                            <div className="py-10 text-center text-muted-foreground animate-pulse text-xs font-bold uppercase">Mise à jour du suivi...</div>
                        ) : events.length > 0 ? (
                            events.map((event, i) => {
                                const style = STATUS_STYLING[event.status];
                                const isLatest = i === 0;
                                return (
                                    <div key={event.id} className="relative">
                                        {/* Dot */}
                                        <div className={`absolute -left-8 top-1 w-7 h-7 rounded-full border-4 border-background flex items-center justify-center z-10 ${style.color}`}>
                                            <Icon icon={style.icon} className="w-3.5 h-3.5" />
                                        </div>

                                        <div className={`bg-card p-4 rounded-2xl border ${isLatest ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border/50 opacity-70'} transition-all`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${style.color}`}>{style.label}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground">
                                                    {new Date(event.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} &bull; {new Date(event.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5 uppercase">
                                                <Icon icon="solar:map-point-bold-duotone" className="w-3 h-3 text-emerald-500" />
                                                {event.location}
                                            </p>
                                            {event.note && (
                                                <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                                    "{event.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-muted-foreground text-xs font-bold uppercase opacity-50">Aucun événement enregistré</div>
                        )}
                    </div>
                </div>

                {/* Status Update (Company Only) */}
                {isOwner && (
                    <div className="lg:col-span-12 bg-card rounded-3xl border border-border p-6 mt-6">
                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-4">Ajouter un point de suivi</h4>
                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Statut de la livraison</label>
                                    <select
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none uppercase tracking-tighter"
                                        value={newEvent.status}
                                        onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as DeliveryStatus })}
                                    >
                                        {Object.values(DeliveryStatus).map(s => (
                                            <option key={s} value={s}>{STATUS_STYLING[s].label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Lieu actuel</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Port de San Pedro, Côte d'Ivoire"
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Note / Commentaire (Optionnel)</label>
                                <textarea
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none resize-none"
                                    rows={2}
                                    placeholder="Ex: Marchandises en cours de dédouanement..."
                                    value={newEvent.note}
                                    onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={isAdding || !newEvent.location}
                                    className="rounded-2xl h-10 bg-primary hover:bg-secondary text-white font-black text-xs gap-2 px-8 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                    {isAdding ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" /> : <Icon icon="solar:plus-circle-bold-duotone" className="w-4 h-4" />}
                                    METTRE À JOUR LE SUIVI
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
