"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "../modal/MotionModal";
import { getActiveFleet, getCompanyClients, assignToDelivery } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import { Select2 } from "../Forms/Select2";

interface DeliveryAssignmentModalProps {
    isOpen: boolean;
    delivery: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeliveryAssignmentModal({ isOpen, delivery, onClose, onSuccess }: DeliveryAssignmentModalProps) {
    const { addNotification } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [fleetOptions, setFleetOptions] = useState<any[]>([]);
    const [driverOptions, setDriverOptions] = useState<any[]>([]);
    
    const [selectedFlotes, setSelectedFlotes] = useState<string[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && delivery) {
            fetchOptions();
            setSelectedFlotes(delivery.flotes?.map((f: any) => f.id) || []);
            setSelectedDrivers(delivery.drivers?.map((d: any) => d.id) || []);
        }
    }, [isOpen, delivery]);

    const fetchOptions = async () => {
        try {
            const [fleet, clients] = await Promise.all([
                getActiveFleet(),
                getCompanyClients({ page: 1, limit: 100 })
            ]);

            setFleetOptions(fleet.map((f: any) => ({
                id: f.id,
                label: `${f.name} (${f.immatriculation || f.type})`.toUpperCase()
            })));

            const drivers = clients.data?.data?.filter((c: any) => c.role === 'CHAUFFEUR') || [];
            setDriverOptions(drivers.map((d: any) => ({
                id: d.id,
                label: (d.fullName || d.phone).toUpperCase()
            })));
        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await assignToDelivery(delivery.id, {
                floteIds: selectedFlotes,
                driverIds: selectedDrivers
            });

            if (res.statusCode === 200) {
                addNotification("Affectations mises à jour", "success");
                onSuccess();
                onClose();
            } else {
                addNotification(res.message || "Erreur lors de l'affectation", "error");
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border w-xl max-w-2xl rounded-[2.5rem] shadow-2xl overflow-visible animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:user-speak-bold-duotone" className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Affectations</h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                    Équipage et matériel pour TRK: {delivery?.trackingCode}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                            <Icon icon="solar:close-circle-bold" className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[70vh] px-1 scrollbar-hide">
                        <div className="space-y-4">
                            {/* Select Flotte */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                                    <Icon icon="solar:bus-bold-duotone" className="w-3.5 h-3.5" />
                                    Engins logistiques
                                </label>
                                <Select2
                                    mode="multiple"
                                    options={fleetOptions}
                                    selectedItem={selectedFlotes}
                                    onSelectionChange={(val) => setSelectedFlotes(val || [])}
                                    labelExtractor={(item) => item.label}
                                    valueExtractor={(item) => item.id}
                                    placeholder="Choisir les engins..."
                                />
                            </div>

                            {/* Select Chauffeurs */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                                    <Icon icon="solar:user-hands-bold-duotone" className="w-3.5 h-3.5" />
                                    Chauffeurs / Équipage
                                </label>
                                <Select2
                                    mode="multiple"
                                    options={driverOptions}
                                    selectedItem={selectedDrivers}
                                    onSelectionChange={(val) => setSelectedDrivers(val || [])}
                                    labelExtractor={(item) => item.label}
                                    valueExtractor={(item) => item.id}
                                    placeholder="Choisir les chauffeurs..."
                                />
                            </div>
                        </div>

                        <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider flex-1 h-12"
                            >
                                Revenir
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest flex-[2] h-12"
                            >
                                {isLoading ? (
                                    <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                                        Confirmer l'affectation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
