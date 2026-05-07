"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getFleet, deleteFleetItem, toggleFleetStatus } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import FloteFormModal from "@/components/logistics/modals/FloteFormModal";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function FloteManager() {
    const [fleet, setFleet] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const { addNotification } = useNotification();

    const fetchFleet = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await getFleet({ page, limit: 10 });
            if (res.statusCode === 200 || res.statusCode === 201) {
                setFleet(res.data?.data || []);
                setPagination(res.data);
            }
        } catch (error) {
            console.error("Error fetching fleet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet engin ?")) return;
        try {
            const res = await deleteFleetItem(id);
            if (res.statusCode === 200) {
                addNotification("Engin supprimé", "success");
                fetchFleet();
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const res = await toggleFleetStatus(id);
            if (res.statusCode === 200) {
                addNotification("Statut mis à jour", "success");
                fetchFleet();
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour", "error");
        }
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'VEHICULE': return 'solar:car-bold-duotone';
            case 'CAMION': return 'solar:bus-bold-duotone';
            case 'AVION': return 'solar:air-plane-bold-duotone';
            default: return 'solar:box-bold-duotone';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'VEHICULE': return 'from-blue-500/20 to-blue-500/5 text-blue-600';
            case 'CAMION': return 'from-amber-500/20 to-amber-500/5 text-amber-600';
            case 'AVION': return 'from-purple-500/20 to-purple-500/5 text-purple-600';
            default: return 'from-primary/20 to-primary/5 text-primary';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                <SectionHeader title="Ma Flotte" subtitle="Gérez vos véhicules, camions et autres engins logistiques" className="!text-left" />
                <button onClick={handleAdd} className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
                    Ajouter
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-primary uppercase tracking-widest">Chargement de la flotte...</p>
                </div>
            ) : fleet.length === 0 ? (
                <div className="bg-card border-2 border-dashed border-border rounded-[3rem] p-16 text-center space-y-6">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Icon icon="solar:bus-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="max-w-xs mx-auto">
                        <h4 className="text-lg font-black text-foreground uppercase">Votre flotte est vide</h4>
                        <p className="text-xs text-muted-foreground font-bold mt-2 uppercase tracking-wider">Ajoutez vos véhicules pour pouvoir les assigner à vos livraisons.</p>
                    </div>
                    <button onClick={handleAdd} className="text-primary font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                        Ajouter mon premier engin
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fleet.map((item) => (
                        <div key={item.id} className="group bg-card border border-border rounded-[2.5rem] p-6 hover:border-primary transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center border border-primary/10 ${getTypeColor(item.type)}`}>
                                    <Icon icon={getTypeIcon(item.type)} className="w-8 h-8" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                                        <Icon icon="solar:pen-bold-duotone" width={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors">
                                        <Icon icon="solar:trash-bin-trash-bold-duotone" width={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 mb-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black text-foreground uppercase truncate tracking-tight">{item.name}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${item.status === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground pb-1">
                                    <Icon icon="solar:tag-bold-duotone" className="w-3 h-3" />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">{item.type} {item.marque ? `- ${item.marque}` : ''}</span>
                                </div>
                                {item.immatriculation && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:letter-bold-duotone" className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase">{item.immatriculation}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <button
                                    onClick={() => handleToggleStatus(item.id)}
                                    className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'ACTIF' ? 'text-red-500 hover:underline' : 'text-emerald-500 hover:underline'}`}
                                >
                                    {item.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                                </button>
                                <span className="text-[9px] font-black text-muted-foreground uppercase">
                                    {item.capacite || 'Capacité non déf.'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <FloteFormModal
                isOpen={isModalOpen}
                item={selectedItem}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchFleet()}
            />
        </div>
    );
}
