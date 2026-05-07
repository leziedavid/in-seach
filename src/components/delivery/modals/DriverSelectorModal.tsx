"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAvailableDrivers, assignOrderToDriver } from "@/api/api";
import { EasyDelivery, TypeEngin } from "@/types/interface";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notifications/NotificationProvider";
import Image from "next/image";
import { TablePagination } from "@/components/ui/table/Pagination"

const ENGIN_LABELS: Record<TypeEngin, string> = {
    VELO: "Vélo",
    VOITURE: "Voiture",
    MOTO: "Moto",
    CAMION: "Camion",
};

const ENGIN_ICONS: Record<TypeEngin, string> = {
    VELO: "solar:bicycle-bold-duotone",
    VOITURE: "solar:car-bold-duotone",
    MOTO: "solar:scooter-bold-duotone",
    CAMION: "solar:delivery-bold-duotone",
};

interface DriverSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string;
    onSuccess?: (delivery: any) => void;
}

export default function DriverSelectorModal({ isOpen, onClose, orderId, onSuccess }: DriverSelectorModalProps) {
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const { showNotification } = useNotification();
    const [page, setPage] = useState(1);
    const limit = 6;

    const { data: driversRes, isLoading } = useQuery({
        queryKey: ["available-drivers", page],
        queryFn: () => getAvailableDrivers({ page, limit }),
        enabled: isOpen,
    });

    const drivers = (driversRes?.data?.data || []) as EasyDelivery[];
    const totalPages = driversRes?.data?.totalPages || 0;
    const totalDrivers = driversRes?.data?.total || 0;

    const assignMutation = useMutation({
        mutationFn: (driverId: string) =>
            assignOrderToDriver({ driverId, orderId }),
        onSuccess: (res) => {
            showNotification("Livreur assigné avec succès !", "success");
            setSelectedDriverId(null);
            onSuccess?.(res.data);
        },
        onError: (err: any) => {
            showNotification(err?.message || "Erreur lors de l'assignation", "error");
        },
    });

    const handleAssign = () => {
        if (!selectedDriverId) return;
        assignMutation.mutate(selectedDriverId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full md:max-w-lg bg-card rounded-t-3xl md:rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Icon icon="solar:scooter-bold-duotone" className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black">Choisir un livreur</h2>
                            <p className="text-xs text-muted-foreground">Livreurs disponibles en temps réel</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-all active:scale-90">
                        <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Driver List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!isLoading && drivers.length === 0 && (
                        <div className="py-14 text-center flex flex-col items-center gap-3">
                            <div className="p-4 bg-muted/50 rounded-full">
                                <Icon icon="solar:scooter-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-black">Aucun livreur disponible</p>
                            <p className="text-xs text-muted-foreground">
                                Tous les livreurs sont occupés ou indisponibles.
                            </p>
                        </div>
                    )}

                    {!isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {drivers.map((driver) => {
                                const isSelected = selectedDriverId === (driver.user?.id || driver.userId);
                                return (
                                    <button
                                        key={driver.id}
                                        onClick={() => setSelectedDriverId(isSelected ? null : (driver.user?.id || driver.userId))}
                                        className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${isSelected
                                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shrink-0 overflow-hidden relative">
                                                    {driver.deliveryLogo ? (
                                                        <Image
                                                            src={driver.deliveryLogo}
                                                            alt={driver.companyName || "Logo"}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Icon icon="solar:user-bold-duotone" className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0">
                                                    <p className="font-black text-[12px] text-foreground truncate leading-tight">
                                                        {driver.user?.fullName || "Livreur"}
                                                    </p>
                                                    {driver.companyName && (
                                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                                                            {driver.companyName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selected indicator */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                                                {isSelected && <Icon icon="solar:check-bold" className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-primary">
                                                    {driver.deliveryBasePrice?.toLocaleString() || 0} FCFA
                                                </span>
                                                <span className="text-[8px] text-muted-foreground font-bold uppercase">Base</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-foreground">
                                                    {driver.activeDeliveriesCount ?? 0}/10
                                                </span>
                                                <span className="text-[8px] text-muted-foreground font-bold uppercase">En cours</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                            {driver.typeEngin && (
                                                <div className="flex items-center gap-1">
                                                    <Icon icon={ENGIN_ICONS[driver.typeEngin]} className="w-2.5 h-2.5 text-primary" />
                                                    <span className="text-[8px] text-muted-foreground font-bold uppercase">{ENGIN_LABELS[driver.typeEngin]}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className="w-full overflow-x-auto mt-6">
                            <TablePagination
                                page={page}
                                limit={limit}
                                total={totalDrivers}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border shrink-0 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl font-black h-12"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedDriverId || assignMutation.isPending}
                        className="flex-1 rounded-xl font-black h-12 flex items-center gap-2"
                    >
                        {assignMutation.isPending ? (
                            <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" />
                        ) : (
                            <>
                                <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4" />
                                Assigner
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
