"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { LogisticProvider, LogisticService, TransportType } from "@/types/interface";
import { getLogisticServices, getMyLogisticServices, createLogisticService, updateLogisticService, deleteLogisticService, patchLogisticServiceStatus, findAllPrestataire } from "@/api/api";
import LogisticsServicesCard from "@/components/logistics/cards/LogisticsServicesCard";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { Modal } from "@/components/ui/MotionModal";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { SectionHeader } from "@/components/shared/SectionHeader";
import Delete from "@/components/logistics/modals/Delete";
import NotFound from "@/components/common/NotFound";
import Loader from "@/components/common/Loader";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import CreateButton from "@/components/ui/CreateButton";
import dynamic from "next/dynamic";
import Image from "next/image"
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle";
import CategoryFilter from "@/components/ui/CategoryFilter"
import LiveFormModal from "@/components/lives/LiveFormModal";
import { LiveEntityType } from "@/types/interface";
import BoostedContentTabs from "@/components/boost/BoostedContentTabs";
import { createStoreSlug } from "@/utils/storeSlug";

// Lazy-load des composants lourds non nécessaires au premier rendu
const FormsLogistics = dynamic(() => import("@/components/logistics/forms/FormsLogistics"), { ssr: false });
const VoiceSearchModal = dynamic(() => import("@/components/services/sections/VoiceSearchModal"), { ssr: false });

const ITEMS_PER_PAGE = 6;

interface LogisticsServicesListProps {
    mode?: "marketplace" | "management";
    companyName?: string;
    onRequestQuote?: (service: LogisticService) => void;
}

export default function LogisticsServicesList({ mode = "marketplace", companyName, onRequestQuote }: LogisticsServicesListProps) {

    const [services, setServices] = useState<LogisticService[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTransport, setFilterTransport] = useState<TransportType | "ALL">("ALL");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [editingService, setEditingService] = useState<LogisticService | null>(null);
    // Ref pour éviter la stale closure sur `loading` dans le useCallback
    const loadingRef = useRef(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const { addNotification } = useNotification();

    const { checkEligibility, loading: checkLoading } = useSubscriptionCheck()
    const [providerInfo, setProviderInfo] = useState<LogisticProvider | null>(null)
    const [copied, setCopied] = useState(false);
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
    const [liveLogisticService, setLiveLogisticService] = useState<LogisticService | null>(null)

    const openEditModal = (service: LogisticService) => {
        setEditingService(service);
        setIsEditModalOpen(true);
    };

    const isManagement = mode === "management";
    const pathname = usePathname();
    const isAkwaba = pathname === "/akwaba";


    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            addNotification("Lien copié !", "success");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            addNotification("Erreur lors de la copie", "error");
        }
    };

    const fetchServices = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current && !isNewSearch) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const params = {
                query: searchTerm || undefined,
                transportType: filterTransport === "ALL" ? undefined : filterTransport,
                companyName: companyName || undefined,
                page: pageNum,
                limit: ITEMS_PER_PAGE
            };

            let res;
            let resultat;
            if (isManagement) {
                res = await getMyLogisticServices(params);
            } else {
                res = await getLogisticServices(params);
                resultat = await findAllPrestataire(params)

            }


            if (res.statusCode === 200 && res.data) {
                const isPaginated = !Array.isArray(res.data) && res.data.data;
                const data = isPaginated ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                const totalItems = isPaginated ? res.data.total : data.length;
                const totalPageCount = isPaginated ? res.data.totalPages : 1;

                setServices(prev => {
                    if (isNewSearch) return data;
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
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [isManagement, searchTerm, filterTransport]);

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1);
        fetchServices(1, true);
    }, [searchTerm, filterTransport, fetchServices]);

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
        setServiceToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!serviceToDelete) return;
        setIsSubmitting(true);
        try {
            const res = await deleteLogisticService(serviceToDelete);
            if (res.statusCode === 200) {
                addNotification("Service supprimé avec succès", "success");
                setServices(prev => prev.filter(s => s.id !== serviceToDelete));
                setTotal(prev => prev - 1);
                setIsDeleteModalOpen(false);
            } else {
                addNotification(res.message || "Erreur lors de la suppression", "error");
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        } finally {
            setIsSubmitting(false);
            setServiceToDelete(null);
        }
    };

    const updateStatus = async (id: string, value: boolean) => {
        return await patchLogisticServiceStatus(id, value);
    };

    const handleToggle = async (id: string, value: boolean) => {
        setUpdatingId(id);

        try {
            const res = await updateStatus(id, value);

            if (res.statusCode === 200) {
                addNotification(`Service ${value ? 'activé' : 'désactivé'}`, "success");
                fetchServices(1, true);
            } else {
                addNotification("Erreur lors du changement de statut", "error");
            }
        } catch (error) {
            addNotification("Erreur serveur", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleVoiceResult = (text: string) => {
        setSearchTerm(text);
    };

    const openCreateModal = async () => {
        const canCreate = await checkEligibility('LogisticService')
        if (canCreate) {
            setEditingService(null);
            setIsCreateModalOpen(true)
        }
    }

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-1">
            {/* Search Input - Matching Boutique Style - Hidden on Akwaba */}
            {!isAkwaba && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mb-2">
                    <div className="flex items-center w-full bg-card border border-primary rounded-xl px-4 py-3 shadow-sm hover:border-secondary transition-colors">
                        <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <input type="text" placeholder="Quel service logistique recherchez-vous ?" className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 md:text-sm placeholder:text-muted-foreground" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} inputMode="text" style={{ fontSize: '16px' }} suppressHydrationWarning />
                        <button type="button" onClick={() => setIsVoiceModalOpen(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-90" title="Recherche vocale" >
                            <Icon icon="solar:microphone-bold-duotone" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            {/* Transport Filters */}
            <div className="w-full max-w-3xl mx-auto mb-4">
                <CategoryFilter
                    categories={[
                        { id: "ALL", name: "Tous" },
                        ...Object.values(TransportType).map(t => ({
                            id: t,
                            name: t.replace(/_/g, ' ')
                        }))
                    ]}
                    selectedCategoryId={filterTransport}
                    onCategoryChange={(id) => setFilterTransport(id as any)}
                    hasSubCategories={false}
                />
            </div>
            {isManagement && (
                <>
                    <div className="w-full max-w-6xl mb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <SectionHeader
                                title="Mes Services Logistiques"
                                subtitle="Gérez vos offres de transport et de logistique publiées sur la plateforme."
                                className="!text-left"
                            />
                            <div className="flex flex-col gap-2">
                                <CreateButton
                                    label="Publier un service"
                                    onClick={() => openCreateModal()}
                                />
                                <CreateButton
                                    label="Créer un Live"
                                    icon="solar:play-circle-bold-duotone"
                                    onClick={() => { setLiveLogisticService(null); setIsLiveModalOpen(true); }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-4xl mx-auto mb-2 px-0 md:px-4">
                        <div className="group bg-card border-b p-6  flex items-center justify-between gap-6">

                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden shrink-0">
                                    {providerInfo?.logo ? (
                                        <Image
                                            src={providerInfo.logo}
                                            alt={providerInfo.companyName || "Boutique"}
                                            fill
                                            className="object-cover"
                                            unoptimized />
                                    ) : (
                                        <Icon icon="solar:shop-bold-duotone" className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Ma plateforme de transport </p>
                                    <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight leading-none truncate max-w-[150px] md:max-w-md">
                                        {providerInfo?.companyName || "Ma plateforme de transport"}
                                    </h3>
                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                            <Icon icon="solar:user-bold-duotone" className="w-3 h-3 text-primary" />
                                            {providerInfo?.fullName || "Gérant"}
                                        </p>
                                        {providerInfo?.phone && (
                                            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                                <Icon icon="solar:phone-bold-duotone" className="w-3 h-3 text-primary" />
                                                {providerInfo.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => handleCopy(`${process.env.NEXT_PUBLIC_BASE_URL}/shop/${createStoreSlug(providerInfo?.companyName || "")}`)} className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all active:scale-90 shrink-0">
                                    {copied ? <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5 md:w-6 md:h-6" /> : <Icon icon="solar:share-bold-duotone" className="w-5 h-5 md:w-6 md:h-6" />}
                                </button>
                            </div>

                        </div>
                    </div>

                </>

            )}
            {/* Results count header */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-1">
                <LogisticsResultsContent
                    isManagement={isManagement}
                    loading={loading}
                    isInitialLoading={isInitialLoading}
                    services={services}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    hasMore={hasMore}
                    setPage={setPage}
                    openEditModal={openEditModal}
                    handleDelete={handleDelete}
                    setLiveLogisticService={setLiveLogisticService}
                    setIsLiveModalOpen={setIsLiveModalOpen}
                    handleToggle={handleToggle}
                    onRequestQuote={onRequestQuote}
                    updatingId={updatingId}
                />

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

                {/* Delete Modal */}
                <Delete
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    isDeleting={isSubmitting}
                    message="Voulez-vous vraiment supprimer ce service logistique ? Cette action supprimera définitivement toutes les données associées."
                />
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
            <VoiceSearchModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onResult={handleVoiceResult}
            />
            {/* LIVE FORM MODAL */}
            <LiveFormModal
                isOpen={isLiveModalOpen}
                onClose={() => { setIsLiveModalOpen(false); setLiveLogisticService(null); }}
                onSuccess={() => { setIsLiveModalOpen(false); setLiveLogisticService(null); }}
                defaultEntityType={LiveEntityType.SERVICE_LOGISTIQUE}
                defaultEntityId={liveLogisticService?.id}
                lockedEntity={!!liveLogisticService}
                entityLabel={liveLogisticService?.label}
            />
        </div>
    );
}

// ─── Contenu "Mes Services Logistiques" — composant stable, évite le pattern IIFE inline ────
interface LogisticsResultsContentProps {
    isManagement: boolean;
    loading: boolean;
    isInitialLoading: boolean;
    services: LogisticService[];
    viewMode: ViewMode;
    setViewMode: (v: ViewMode) => void;
    hasMore: boolean;
    setPage: (fn: (prev: number) => number) => void;
    openEditModal: (service: LogisticService) => void;
    handleDelete: (id: string) => void;
    setLiveLogisticService: (s: LogisticService | null) => void;
    setIsLiveModalOpen: (v: boolean) => void;
    handleToggle: (id: string, value: boolean) => void;
    onRequestQuote?: (service: LogisticService) => void;
    updatingId: string | null;
}

function LogisticsResultsContent({
    isManagement, loading, isInitialLoading, services, viewMode, setViewMode,
    hasMore, setPage, openEditModal, handleDelete, setLiveLogisticService, setIsLiveModalOpen,
    handleToggle, onRequestQuote, updatingId,
}: LogisticsResultsContentProps) {
    const results = (
        <>
            <div className="flex items-center justify-between w-full px-2 md:px-0 mb-4">
                <h3 className="text-xl md:text-2xl font-black text-foreground italic text-left md:text-center leading-tight"> </h3>
                {services.length > 0 && (
                    <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                )}
            </div>

            {(loading || isInitialLoading) && services.length === 0 ? (
                <Loader
                    title={isManagement ? "Chargement de vos services..." : "Chargement des services..."}
                    description={isManagement ? "Récupération de vos services logistiques en cours." : "Nous récupérons les services logistiques disponibles."}
                    icon="solar:delivery-bold-duotone"
                />
            ) : !loading && !isInitialLoading && services.length === 0 ? (
                <NotFound
                    title={isManagement ? "Aucun service publié" : "Aucun service disponible"}
                    description={isManagement ? "Vous n'avez pas encore publié de service logistique. Cliquez sur « Publier un service » pour commencer." : "Aucun service logistique ne correspond à votre recherche. Essayez d'autres mots-clés ou un autre type de transport."}
                    icon="solar:delivery-bold-duotone"
                />
            ) : (
                <InfiniteScroll
                    items={services}
                    loadMore={() => setPage(prev => prev + 1)}
                    hasMore={hasMore}
                    isLoading={loading}
                    skeletonType="logistics"
                    skeletonCount={3}
                    gridClassName={viewMode === 'grid' ? "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}
                    renderItem={(service) => (
                        <LogisticsServicesCard
                            key={service.id}
                            service={service}
                            isOwner={isManagement}
                            onEdit={() => openEditModal(service)}
                            onDelete={handleDelete}
                            onCreateLive={(s) => { setLiveLogisticService(s); setIsLiveModalOpen(true); }}
                            onToggleStatus={handleToggle}
                            onRequestQuote={onRequestQuote}
                            isUpdating={updatingId === service.id}
                            viewMode={viewMode}
                        />
                    )}
                    className="w-full"
                />
            )}
        </>
    );

    if (!isManagement) return results;

    return (
        <BoostedContentTabs entityType="LOGISTIC_SERVICE" entityLabel="service logistique" entityLabelPlural="Services logistiques" iconMine="solar:box-bold-duotone">
            {results}
        </BoostedContentTabs>
    );
}
