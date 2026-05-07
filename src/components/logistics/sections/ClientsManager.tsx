"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { LogisticsClient, Pagination } from "@/types/interface";
import { getCompanyClients, deleteCompanyClient } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import ClientFormModal from "../modals/ClientFormModal";

export default function ClientsManager() {
    const [clients, setClients] = useState<LogisticsClient[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<LogisticsClient | null>(null);
    const { addNotification } = useNotification();

    const fetchClients = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await getCompanyClients({ page, limit: 10 });
            if (res.statusCode === 200 || res.statusCode === 201) {
                setClients(res.data?.data || []);
                setPagination(res.data);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;
        try {
            const res = await deleteCompanyClient(id);
            if (res.statusCode === 200) {
                addNotification("Client supprimé", "success");
                fetchClients();
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    const handleEdit = (client: LogisticsClient) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedClient(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Mes Clients</h3>
                    <p className="text-sm text-muted-foreground font-medium">Gérez votre base de données clients et tiers</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                    <Icon icon="solar:user-plus-bold" className="w-4 h-4" />
                    Ajouter un client
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-primary uppercase tracking-widest">Chargement des clients...</p>
                </div>
            ) : clients.length === 0 ? (
                <div className="bg-card border-2 border-dashed border-border rounded-[3rem] p-16 text-center space-y-6">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Icon icon="solar:users-group-two-rounded-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="max-w-xs mx-auto">
                        <h4 className="text-lg font-black text-foreground uppercase">Aucun client trouvé</h4>
                        <p className="text-xs text-muted-foreground font-bold mt-2 uppercase tracking-wider">Commencez par ajouter votre premier client pour créer des devis manuels.</p>
                    </div>
                    <button onClick={handleAdd} className="text-primary font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                        Créer un client maintenant
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client) => (
                        <div key={client.id} className="group bg-card border border-border rounded-[2.5rem] p-6 hover:border-primary transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                                    <Icon icon="solar:user-circle-bold-duotone" className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(client)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                                        <Icon icon="solar:pen-bold-duotone" width={16} />
                                    </button>
                                    <button onClick={() => handleDelete(client.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors">
                                        <Icon icon="solar:trash-bin-trash-bold-duotone" width={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 mb-4">
                                <p className="text-sm font-black text-foreground uppercase truncate tracking-tight">{client.fullName || "Utilisateur sans nom"}</p>
                                <div className="flex items-center gap-2 text-muted-foreground pb-1">
                                    <Icon icon="solar:phone-bold-duotone" className="w-3 h-3" />
                                    <span className="text-[10px] font-bold tracking-wider">{client.phone}</span>
                                </div>
                                {client.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:letter-bold-duotone" className="w-3 h-3" />
                                        <span className="text-[10px] font-bold truncate">{client.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${client.role === 'ENTREPRISE' ? 'bg-amber-500/10 text-amber-600' :
                                        client.role === 'CHAUFFEUR' ? 'bg-emerald-500/10 text-emerald-600' :
                                            'bg-primary/10 text-primary'
                                    }`}>
                                    {client.role}
                                </span>
                                {client.companyName && (
                                    <span className="text-[9px] font-black text-muted-foreground uppercase truncate max-w-[100px]">
                                        {client.companyName}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ClientFormModal
                isOpen={isModalOpen}
                client={selectedClient}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchClients()}
            />
        </div>
    );
}
