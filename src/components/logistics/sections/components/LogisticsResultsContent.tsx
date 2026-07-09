"use client"

import { LogisticService } from "@/types/interface"
import LogisticsServicesCard from "@/components/logistics/cards/LogisticsServicesCard"
import NotFound from "@/components/common/NotFound"
import Loader from "@/components/common/Loader"
import InfiniteScroll from "@/components/ui/InfiniteScroll"
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle"
import BoostedContentTabs from "@/components/boost/BoostedContentTabs"

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

export default function LogisticsResultsContent({
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
