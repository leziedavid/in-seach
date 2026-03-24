"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { LogisticService, TransportType } from "@/types/interface";
import { getLogisticServices, getMyLogisticServices, createLogisticService, updateLogisticService, deleteLogisticService } from "@/api/api";
import LogisticsServicesCard from "./LogisticsServicesCard";
import { useNotification } from "../toast/NotificationProvider";
import { Button } from "../ui/button";
import { Modal } from "../modal/MotionModal";
import FormsLogistics from "./FormsLogistics";

const ITEMS_PER_PAGE = 6;

interface LogisticsServicesListProps {
    mode?: "marketplace" | "management";
    onRequestQuote?: (service: LogisticService) => void;
}

export default function LogisticsServicesList({ mode = "marketplace", onRequestQuote }: LogisticsServicesListProps) {

    const [services, setServices] = useState<LogisticService[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTransport, setFilterTransport] = useState<TransportType | "ALL">("ALL");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [editingService, setEditingService] = useState<LogisticService | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { addNotification } = useNotification();

    const openEditModal = (service: LogisticService) => {
        setEditingService(service);
        setIsEditModalOpen(true);
    };

    const loaderRef = useRef<HTMLDivElement | null>(null);
    const isManagement = mode === "management";
    const pathname = usePathname();
    const isAkwaba = pathname === "/akwaba";

    const fetchServices = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loading) return;
        setLoading(true);

        try {
            const params = {
                query: searchTerm || undefined,
                transportType: filterTransport === "ALL" ? undefined : filterTransport,
                page: pageNum,
                limit: ITEMS_PER_PAGE
            };

            let res;
            if (isManagement) {
                res = await getMyLogisticServices({ page: pageNum, limit: ITEMS_PER_PAGE });
            } else {
                res = await getLogisticServices(params);
            }

            if (res.statusCode === 200 && res.data) {
                // Handle both old array format and new paginated format
                const isPaginated = !Array.isArray(res.data) && res.data.data;
                const data = isPaginated ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                const totalItems = isPaginated ? res.data.total : data.length;
                const totalPageCount = isPaginated ? res.data.totalPages : 1;

                setServices(prev => {
                    if (isNewSearch) return data;
                    // Prevent duplicates if the same page is somehow fetched twice
                    const existingIds = new Set(prev.map(s => s.id));
                    const newItems = data.filter((s: any) => !existingIds.has(s.id));
                    return [...prev, ...newItems];
                });

                setHasMore(pageNum < totalPageCount);
                setTotal(totalItems);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching logistics services:", error);
            addNotification("Erreur lors de la récupération des services", "error");
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [isManagement, searchTerm, filterTransport, addNotification]);

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1);
        fetchServices(1, true);
    }, [searchTerm, filterTransport, fetchServices]);

    // Load more when page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) {
            fetchServices(page, false);
        }
    }, [page, fetchServices]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            const res = await createLogisticService(formData);
            if (res.statusCode === 201) {
                addNotification("Service créé avec succès", "success");
                setIsCreateModalOpen(false);
                fetchServices(1, true);
            } else {
                addNotification(res.message || "Erreur lors de la création", "error");
            }
        } catch (error) {
            addNotification("Erreur serveur", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (id: string, formData: FormData) => {
        setIsSubmitting(true);
        try {
            const res = await updateLogisticService(id, formData);
            if (res.statusCode === 200) {
                addNotification("Service mis à jour", "success");
                fetchServices(1, true);
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce service ?")) return;
        try {
            const res = await deleteLogisticService(id);
            if (res.statusCode === 200) {
                addNotification("Service supprimé", "success");
                fetchServices(1, true);
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    const handleToggle = async (id: string, value: boolean) => {
        const formData = new FormData();
        formData.append('isActive', String(value));
        await handleUpdate(id, formData);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">

            {/* Search Input - Matching Boutique Style - Hidden on Akwaba */}
            {!isAkwaba && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                    <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-3 shadow-sm hover:border-secondary transition-colors">
                        <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <input type="text" placeholder="Quel service logistique recherchez-vous ?" className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 md:text-sm placeholder:text-muted-foreground" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} inputMode="text"
                            style={{ fontSize: '16px' }}
                            suppressHydrationWarning
                        />
                    </div>
                </div>
            )}

            {/* Transport Filters - Matching Boutique scroll style */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide w-full justify-start md:justify-center px-2">
                <button onClick={() => setFilterTransport("ALL")} className={`px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter whitespace-nowrap transition-all duration-300 border-2 ${filterTransport === "ALL" ? 'bg-primary border-primary text-white shadow-md scale-105' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}  >
                    Tous
                </button>
                {Object.values(TransportType).map((t) => (
                    <button key={t} onClick={() => setFilterTransport(t as any)} className={`px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter whitespace-nowrap transition-all duration-300 border-2 ${filterTransport === t ? 'bg-primary border-primary text-white shadow-md scale-105' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}  >
                        {t.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>


            {isManagement && (
                <>


                    {/* DASHBOARD HEADER */}
                    <div className="w-full max-w-6xl mb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground"> </h2>


                            <div className="flex items-center gap-8">
                                <div className="text-center md:text-left">

                                </div>

                                <div className="h-10 w-px bg-border" />

                                <div className="text-center md:text-left">
                                    <p className="flex items-center gap-2 text-3xl md:text-4xl font-black text-secondary">
                                        <span>{total}</span>
                                        <Icon icon="solar:album-linear" className="w-8 h-8" />
                                    </p>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Rendez-vous
                                    </p>
                                </div>

                                <div className="flex justify-end mb-2">
                                    <Button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto bg-primary text-white px-8 py-2 rounded-xl text-base font-black flex items-center justify-center gap-3 hover:bg-secondary transition-all shadow-xs active:scale-95 flex-shrink-0">
                                        Créer
                                        <Icon icon="solar:plus-circle-bold-duotone" className="w-5 h-5" />
                                    </Button>
                                </div>

                            </div>

                        </div>

                    </div>
                </>
            )}

            {/* Results count header */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                <div className="flex items-center justify-start md:justify-center w-full px-2 md:px-0 mb-6">
                    <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center">
                        {loading && services.length === 0 ? 'Chargement...' : services.length === 0 ? 'Aucun service trouvé' : `${total} résultat${total > 1 ? 's' : ''}`}
                    </h3>
                </div>

                {/* SERVICES GRID */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
                    {services.map((service) => (
                        <LogisticsServicesCard
                            key={service.id}
                            service={service}
                            isOwner={isManagement}
                            onEdit={() => openEditModal(service)}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggle}
                            onRequestQuote={onRequestQuote}
                            isUpdating={isSubmitting}
                        />
                    ))}
                </div>

                {/* Edit Modal */}
                <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingService(null); }}>
                    <div className="p-6">
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <Icon icon="solar:pen-new-square-bold-duotone" className="text-primary w-7 h-7" />
                            Modifier le service
                        </h2>
                        {editingService && (
                            <FormsLogistics
                                initialData={editingService}
                                onSubmit={(formData) => handleUpdate(editingService.id, formData)}
                                isSubmitting={isSubmitting}
                                isEditMode={true}
                                isOpen={isEditModalOpen}
                                onClose={() => { setIsEditModalOpen(false); setEditingService(null); }}
                            />
                        )}
                    </div>
                </Modal>

                {/* Empty State */}
                {!loading && services.length === 0 && (
                    <div className="bg-card/30 border border-dashed border-border rounded-3xl py-12 flex flex-col items-center justify-center text-center px-6 stagger-item">
                        <Icon icon="solar:box-minimalistic-bold-duotone" className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="font-black text-foreground/70 uppercase text-sm mb-1">Aucun service disponible</h3>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            {searchTerm || filterTransport !== "ALL"
                                ? "Essayez de modifier vos filtres ou votre recherche."
                                : isManagement ? "Vous n'avez pas encore créé de services." : "Aucun prestataire n'est disponible."}
                        </p>
                    </div>
                )}

                {/* Loading State / Trigger */}
                <div ref={loaderRef} className="w-full flex justify-center py-8">
                    {loading && (<Icon icon="eos-icons:loading" className="w-8 h-8 text-primary animate-spin" />)}
                    {!hasMore && services.length > 0 && total > ITEMS_PER_PAGE && (
                        <p className="text-muted-foreground text-sm font-medium italic">
                            Fin des résultats
                        </p>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                        <Icon icon="solar:add-square-bold-duotone" className="text-primary w-7 h-7" />
                        Nouveau Service Logistique
                    </h2>
                    <FormsLogistics
                        onSubmit={handleCreate}
                        isSubmitting={isSubmitting}
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                    />
                </div>
            </Modal>

        </div>
    );
}
