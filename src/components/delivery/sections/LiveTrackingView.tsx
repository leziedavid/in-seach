"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEasyDeliveryStatus, unassignDriver, getLiveTracking } from "@/api/api";
import { HistoryDelivery, EasyDeliveryStatus } from "@/types/interface";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import Image from "next/image";

interface LiveTrackingViewProps {
    delivery: HistoryDelivery;
    onBack: () => void;
}

const STATUS_FLOW: EasyDeliveryStatus[] = [
    EasyDeliveryStatus.PENDING,
    EasyDeliveryStatus.ACCEPTED,
    EasyDeliveryStatus.PICKED_UP,
    EasyDeliveryStatus.IN_TRANSIT,
    EasyDeliveryStatus.ARRIVED,
    EasyDeliveryStatus.DELIVERED,
];

const STATUS_LABELS: Record<EasyDeliveryStatus, string> = {
    PENDING: "En attente",
    ACCEPTED: "Acceptée",
    PICKED_UP: "Récupérée",
    IN_TRANSIT: "En transit",
    ARRIVED: "Arrivée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
};

const STATUS_ICONS: Record<EasyDeliveryStatus, string> = {
    PENDING: "solar:clock-circle-bold-duotone",
    ACCEPTED: "solar:check-circle-bold-duotone",
    PICKED_UP: "solar:box-bold-duotone",
    IN_TRANSIT: "solar:delivery-bold-duotone",
    ARRIVED: "solar:map-point-bold-duotone",
    DELIVERED: "solar:verified-check-bold-duotone",
    CANCELLED: "solar:close-circle-bold-duotone",
};

export default function LiveTrackingView({ delivery: initialDelivery, onBack }: LiveTrackingViewProps) {
    const [delivery, setDelivery] = useState<HistoryDelivery>(initialDelivery);
    const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { showNotification } = useNotification();
    const queryClient = useQueryClient();
    const { checkFeatureAccess, loading: subscriptionLoading } = useSubscriptionCheck();

    // Polling for live updates every 15 seconds
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await getLiveTracking(delivery.id);
                if (res?.data) setDelivery(res.data as HistoryDelivery);
            } catch { /* silent */ }
        };

        pollRef.current = setInterval(poll, 15000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [delivery.id]);

    const statusMutation = useMutation({
        mutationFn: (status: EasyDeliveryStatus) => updateEasyDeliveryStatus(delivery.id, status),
        onSuccess: (res) => {
            if (res?.data) setDelivery((prev) => ({ ...prev, ...res.data }));
            showNotification("Statut mis à jour", "success");
            queryClient.invalidateQueries({ queryKey: ["driver-history"] });
        },
        onError: () => showNotification("Erreur lors de la mise à jour du statut", "error"),
    });

    const handleAdvanceStatus = async (status: EasyDeliveryStatus) => {
        const canProceed = await checkFeatureAccess();
        if (!canProceed) return;
        statusMutation.mutate(status);
    };

    const unassignMutation = useMutation({
        mutationFn: () => unassignDriver(delivery.id),
        onSuccess: () => {
            showNotification("Livreur désassigné", "success");
            queryClient.invalidateQueries({ queryKey: ["driver-history"] });
            onBack();
        },
        onError: () => showNotification("Impossible de désassigner", "error"),
    });

    const currentStepIndex = STATUS_FLOW.indexOf(delivery.status as EasyDeliveryStatus);
    const isCancelled = delivery.status === EasyDeliveryStatus.CANCELLED;
    const isFinished = delivery.status === EasyDeliveryStatus.DELIVERED || isCancelled;

    const nextStatus = !isFinished && currentStepIndex < STATUS_FLOW.length - 1
        ? STATUS_FLOW[currentStepIndex + 1]
        : null;

    const getStepState = (step: EasyDeliveryStatus) => {
        const idx = STATUS_FLOW.indexOf(step);
        if (idx < currentStepIndex) return "done";
        if (idx === currentStepIndex) return "active";
        return "pending";
    };

    return (
        <div className="w-full space-y-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-all active:scale-90"
                >
                    <Icon icon="solar:arrow-left-bold-duotone" className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="font-black text-lg">Suivi en direct</h2>
                    <p className="text-xs text-muted-foreground">
                        #{delivery.id.slice(0, 8).toUpperCase()} · Mise à jour auto 15s
                    </p>
                </div>
                {/* Unassign floating button */}
                {!isFinished && (
                    <button
                        onClick={() => setShowUnassignConfirm(true)}
                        className="ml-auto p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all active:scale-90 flex items-center gap-1.5 text-xs font-black"
                    >
                        <Icon icon="solar:user-cross-bold-duotone" className="w-4 h-4" />
                        <span className="hidden sm:inline">Changer</span>
                    </button>
                )}
            </div>
            {/* ── Status Progress ── */}
            {!isCancelled && (
                <div className="bg-card border border-border rounded-3xl p-5">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">
                        Progression
                    </p>
                    <div className="relative">
                        {/* Track line */}
                        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
                        <div
                            className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500"
                            style={{ width: `${(currentStepIndex / (STATUS_FLOW.length - 1)) * 100}%` }}
                        />
                        <div className="flex justify-between relative">
                            {STATUS_FLOW.map((step) => {
                                const state = getStepState(step);
                                return (
                                    <div key={step} className="flex flex-col items-center gap-1.5">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${state === "done" ? "bg-primary border-primary text-white" : state === "active" ? "bg-primary/10 border-primary text-primary animate-pulse" : "bg-card border-border text-muted-foreground"}`}>
                                            <Icon icon={STATUS_ICONS[step]} className="w-4 h-4" />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wider text-center max-w-[48px] leading-tight ${state === "active" ? "text-primary" : "text-muted-foreground"}`}>
                                            {STATUS_LABELS[step]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {isCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <Icon icon="solar:close-circle-bold-duotone" className="w-6 h-6 text-red-500 shrink-0" />
                    <p className="text-sm font-bold text-red-600">Cette livraison a été annulée.</p>
                </div>
            )}
            {/* ── Driver & Delivery Info ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Driver Info */}
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Icon icon="solar:scooter-bold-duotone" className="text-primary w-3.5 h-3.5" />
                        Livreur
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shrink-0 overflow-hidden relative">
                            {delivery.easyDelivery?.deliveryLogo ? (
                                <Image
                                    src={delivery.easyDelivery.deliveryLogo}
                                    alt="Livreur"
                                    fill
                                    className="object-cover" />
                            ) : (
                                <Icon icon="solar:user-bold-duotone" className="w-6 h-6 text-primary" />
                            )}
                        </div>
                        <div>
                            <p className="font-black text-sm">{delivery.driverName || delivery.easyDelivery?.user?.fullName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{delivery.driverPhone || delivery.easyDelivery?.user?.phone || "—"}</p>
                        </div>
                    </div>
                    {delivery.vehicleType && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon icon="solar:car-bold-duotone" className="w-3.5 h-3.5" />
                            {delivery.vehicleType}
                            {delivery.vehiclePlateNumber && ` · ${delivery.vehiclePlateNumber}`}
                        </div>
                    )}
                </div>

                {/* Delivery Info */}
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Icon icon="solar:box-bold-duotone" className="text-primary w-3.5 h-3.5" />
                        Destinataire
                    </p>
                    <div>
                        <p className="font-black text-sm">{delivery.recipientName || "—"}</p>
                        {delivery.recipientPhone && (
                            <p className="text-xs text-muted-foreground">{delivery.recipientPhone}</p>
                        )}
                        {delivery.deliveryNotes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{delivery.deliveryNotes}</p>
                        )}
                    </div>
                    {delivery.deliveryPrice && (
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                                {delivery.deliveryPrice.toLocaleString()} FCFA
                            </span>
                        </div>
                    )}
                </div>
            </div>
            {/* ── Timing ── */}
            {(delivery.estimatedDeliveryTime || delivery.actualDeliveryTime || (delivery as any).eta) && (
                <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Icon icon="solar:clock-circle-bold-duotone" className="text-primary w-3.5 h-3.5" />
                        Timing
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {(delivery as any).eta != null && (
                            <div className="bg-primary/5 rounded-xl p-3 text-center">
                                <p className="text-xl font-black text-primary">{(delivery as any).eta} min</p>
                                <p className="text-[10px] text-primary/70 uppercase font-bold">ETA estimé</p>
                            </div>
                        )}
                        {delivery.estimatedDeliveryTime && (
                            <div className="bg-muted/40 rounded-xl p-3 text-center">
                                <p className="text-sm font-black">
                                    {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Livraison estimée</p>
                            </div>
                        )}
                        {delivery.actualDeliveryTime && (
                            <div className="bg-green-50 rounded-xl p-3 text-center">
                                <p className="text-sm font-black text-green-700">
                                    {new Date(delivery.actualDeliveryTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                                <p className="text-[10px] text-green-600 uppercase font-bold">Livré à</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* ── Status Update (for the driver) ── */}
            {nextStatus && !isFinished && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Icon icon="solar:refresh-bold-duotone" className="text-primary w-3.5 h-3.5" />
                        Mettre à jour le statut
                    </p>
                    <Button
                        onClick={() => handleAdvanceStatus(nextStatus)}
                        disabled={statusMutation.isPending || subscriptionLoading}
                        className="w-full rounded-xl font-black h-12 flex items-center gap-2"
                    >
                        {statusMutation.isPending || subscriptionLoading ? (
                            <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" />
                        ) : (
                            <>
                                <Icon icon={STATUS_ICONS[nextStatus]} className="w-4 h-4" />
                                Marquer comme « {STATUS_LABELS[nextStatus]} »
                            </>
                        )}
                    </Button>
                </div>
            )}
            {/* ── Unassign Confirm ── */}
            {showUnassignConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <Icon icon="solar:user-cross-bold-duotone" className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-black">Changer de livreur ?</h3>
                                <p className="text-xs text-muted-foreground">La livraison en cours sera annulée.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowUnassignConfirm(false)} className="flex-1 rounded-xl font-black">
                                Non
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => { setShowUnassignConfirm(false); unassignMutation.mutate(); }}
                                disabled={unassignMutation.isPending}
                                className="flex-1 rounded-xl font-black"
                            >
                                {unassignMutation.isPending ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : "Confirmer"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
