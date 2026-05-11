"use client"

import Image from "next/image"

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { TablePagination } from "@/components/ui/table/Pagination"
import FormsAnnonce from "../forms/FormsAnnonce"
import { Annonce, AnnonceStatus } from "@/types/interface"
import { createAnnonce, getAnnonces, handleToggleAnnonceActive, updateAnnonce, deleteAnnonce as apiDeleteAnnonce } from "@/api/api"
import { Modal } from "@/components/ui/MotionModal"
import { Switch } from "@/components/ui/switch"
import { useNotification } from "@/components/notifications/NotificationProvider"
import { Button } from "@/components/ui/button"
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck"
import Delete from "@/components/logistics/modals/Delete"
import { SectionHeader } from "@/components/shared/SectionHeader"
import ViewToggle, { ViewMode } from "@/components/shared/ViewToggle"

interface AnnoncesCardProps {
    data?: Annonce[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
}

export default function AnnoncesCard({
    data: propData,
    page: propPage,
    limit: propLimit = 6,
    total: propTotal,
    totalPages: propTotalPages,
    loading: propLoading,
    onPageChange,
    onSuccess
}: AnnoncesCardProps) {
    const [internalPage, setInternalPage] = useState(1)
    const page = propPage ?? internalPage;
    const limit = propLimit;
    const setPage = onPageChange ?? setInternalPage;

    const [isCreating, setIsCreating] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null)
    const [internalLoading, setInternalLoading] = useState(false)
    const [internalListes, setInternalListes] = useState<Annonce[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [annonceToDelete, setAnnonceToDelete] = useState<Annonce | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>("grid")

    const loading = propLoading ?? internalLoading;
    const listes = propData ?? internalListes;
    const total = propTotal ?? internalListes.length;
    const totalPages = propTotalPages ?? Math.ceil(total / limit);
    const { showNotification } = useNotification();

    const fetchAnnonces = async () => {
        if (propData) return;
        try {
            setInternalLoading(true)
            const response = await getAnnonces({ page, limit })
            if (response?.statusCode === 200 && response?.data) {
                setInternalListes(response.data.data)
            }
        } catch (error) {
            console.error("Error fetching annonces:", error)
        } finally {
            setInternalLoading(false)
        }
    }

    useEffect(() => {
        if (!propData) {
            fetchAnnonces()
        }
    }, [page, propData])


    const mapAnnonceToFormData = (annonce: Annonce) => ({
        id: annonce.id,
        title: annonce.title,
        description: annonce.description,
        price: annonce.price,
        status: annonce.status,
        options: annonce.options || [],
        latitude: annonce.latitude,
        longitude: annonce.longitude,
        typeId: annonce.typeId,
        categorieId: annonce.categorieId,
        categories: annonce.categories || [],
        imageUrls: annonce.images || [],
        files: annonce.images || [],
        technicalSheets: annonce.technicalSheets || [],
        equipments: annonce.equipments || [],
        realEstateOptionId: annonce.realEstateOptionId,
        vehicleTypeId: annonce.vehicleTypeId,
        images: [], // File[] type expected
    })

    const handleAction = (action: string, row: Annonce) => {
        if (action === "edit") {
            setSelectedAnnonce(row)
            setIsEditing(true)
            setIsOpen(true)
        }
        if (action === "delete") {
            setAnnonceToDelete(row)
            setIsDeleteModalOpen(true)
        }
        if (action === "duplicate") {
            setInternalListes((prev) => [
                ...prev,
                { ...row, id: String(Date.now()) },
            ])
        }
    }

    const handleToggleActiv = async (row: Annonce, value: boolean) => {
        const response = await handleToggleAnnonceActive(row.id, value)
        if (response?.statusCode === 200) {
            showNotification(response.message || "Statut mis à jour", "success");
            onSuccess?.();
        }
    }

    const handleFormSubmit = async (formData: FormData) => {
        try {
            setIsCreating(true)
            let response: any;

            if (selectedAnnonce?.id && isEditing) {
                response = await updateAnnonce(selectedAnnonce.id, formData)
            } else {
                response = await createAnnonce(formData)
            }

            if (response.statusCode === 201 || response.statusCode === 200) {
                showNotification(response.message || "Opération réussie", "success");
                setIsOpen(false)

                // 1. Reset pagination to first page
                if (onPageChange) {
                    onPageChange(1)
                } else {
                    setInternalPage(1)
                }

                // 2. Notify parent for refetch (React Query)
                onSuccess?.();

                // 3. Manual refetch if uncontrolled
                if (!propData) {
                    await fetchAnnonces()
                }

            } else {
                showNotification(response.message || "Une erreur est survenue", "error");
            }

        } catch (error: any) {
            showNotification(error.message || "Erreur de connexion", "error");
        } finally {
            setIsCreating(false)
        }
    }

    /* ===============================
        DELETE ANNONCE
    =============================== */
    const handleDeleteConfirm = async () => {
        if (!annonceToDelete) return;
        try {
            setIsDeleting(true)
            const response = await apiDeleteAnnonce(annonceToDelete.id)
            if (response.statusCode === 200) {
                showNotification("Annonce supprimée avec succès", "success")
                setInternalListes((prev) => prev.filter((a) => a.id !== annonceToDelete.id))
                onSuccess?.()
            } else {
                showNotification(response.message || "Erreur lors de la suppression", "error")
            }
        } catch (error: any) {
            showNotification(error.message || "Erreur serveur", "error")
        } finally {
            setIsDeleting(false)
            setIsDeleteModalOpen(false)
            setAnnonceToDelete(null)
        }
    }

    const paginatedData = propData ? propData : listes.slice(
        (page - 1) * limit,
        page * limit
    )
    const { checkEligibility, loading: checkLoading } = useSubscriptionCheck();

    return (
        <>
            <div className="flex flex-col w-full px-0">

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-4xl mb-6">
                    <div className="flex items-center w-full"></div>
                    <Button disabled={checkLoading} onClick={async () => {
                        const canCreate = await checkEligibility('Annonce');
                        if (canCreate) {
                            setIsOpen(true);
                            setIsEditing(false);
                            setSelectedAnnonce(null)
                        }
                    }}
                        className="bg-primary text-primary-foreground hover:bg-secondary uppercase">
                        {checkLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-6 h-6 mr-2" /> : <Icon icon="solar:widget-add-bold" width="24" height="24" />}
                        Publier une annonce
                    </Button>
                </div>

                <SectionHeader
                    title="Publiez toutes vos annonces"
                    subtitle="Vente de tickets, location, tourisme… publiez vos annonces, fixez vos prix et trouvez rapidement des clients."
                    className="mb-8"
                />

                <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                    <div className="flex items-center justify-between w-full px-2 md:px-0 mb-6 border-b border-border pb-4">
                        <h3 className="text-lg font-black text-foreground">
                            {loading && listes.length === 0 ? 'Chargement...' : listes.length === 0 ? 'Mes Annonces' : `Mes Annonces (${total})`}
                        </h3>
                        {listes.length > 0 && (
                            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                        )}
                    </div>
                </div>

                {loading && <div className="text-center py-10 text-muted-foreground">Chargement...</div>}
                {!loading && listes.length === 0 && <div className="text-center py-10 text-muted-foreground/60">Aucune annonce trouvée</div>}

                {!loading && listes.length > 0 && (
                    <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                        <div className="w-full px-2 md:px-0">
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4"}>
                                {paginatedData.map((annonce: Annonce) => (
                                    <div key={annonce.id} 
                                        className={`group rounded-xl transition-all duration-300 bg-card border border-border/40 hover:border-primary/30 overflow-hidden ${
                                            viewMode === 'grid' 
                                            ? "p-0 md:p-4 flex flex-col md:items-center text-left md:text-center" 
                                            : "p-2 md:p-4 flex flex-row items-center gap-4 text-left"
                                        }`}>

                                        <div className={`relative overflow-hidden rounded-lg md:rounded-2xl shrink-0 ${
                                            viewMode === 'grid' ? "w-full aspect-square mb-1.5" : "w-24 h-24 md:w-32 md:h-32"
                                        }`}>
                                            <Image src={(annonce.images?.[0] && annonce.images?.[0] !== "") ? annonce.images[0] : (annonce.imageUrls?.[0] && annonce.imageUrls?.[0] !== "") ? annonce.imageUrls[0] : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={annonce.title} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className={`absolute bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-black text-foreground shadow-sm uppercase ${
                                                viewMode === 'grid' ? "top-2 left-2" : "top-1 left-1"
                                            }`}>
                                                {annonce.categorie?.label || 'Annonce'}
                                            </div>
                                        </div>

                                        <div className={`flex flex-col flex-1 min-w-0 ${viewMode === 'grid' ? "px-0.5 w-full" : "h-full justify-center"}`}>
                                            <h3 className={`font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate ${
                                                viewMode === 'grid' ? "text-xs md:text-base line-clamp-2 md:line-clamp-1 text-left" : "text-sm md:text-lg"
                                            }`}>
                                                {annonce.title}
                                            </h3>

                                            <div className={`flex items-center gap-1 text-primary ${
                                                viewMode === 'grid' ? "justify-start md:justify-center mb-2 md:mb-4" : "justify-start mb-1 md:mb-2"
                                            }`}>
                                                <Icon icon="solar:star-bold-duotone" className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                                                <span className="text-[9px] md:text-xs font-black tracking-tight">{annonce.type?.label || 'Vente'}</span>
                                            </div>

                                            <div className={`text-left ${viewMode === 'grid' ? "mb-3" : "mb-1"}`}>
                                                <p className={`text-secondary font-black ${viewMode === 'grid' ? "text-sm md:text-base" : "text-base md:text-xl"}`}>
                                                    {annonce.price ? `${annonce.price.toLocaleString()} FCFA` : "0 FCFA"}
                                                </p>
                                            </div>

                                            <div className={`flex items-center w-full gap-3 ${viewMode === 'grid' ? "justify-center" : "justify-end mt-auto"}`}>
                                                <Switch checked={annonce.status === "ACTIVE"} onCheckedChange={(value) => handleToggleActiv(annonce, value)} />
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleAction("edit", annonce)} className="p-2 rounded-lg hover:bg-muted transition">
                                                        <Icon icon="solar:pen-new-square-bold-duotone" width={18} height={18} />
                                                    </button>
                                                    <button onClick={() => handleAction("duplicate", annonce)} className="p-2 rounded-lg hover:bg-muted transition">
                                                        <Icon icon="solar:copy-bold-duotone" width={18} height={18} />
                                                    </button>
                                                    <button onClick={() => handleAction("delete", annonce)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition">
                                                        <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} height={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="w-full overflow-x-auto mt-4 px-4">
                        <TablePagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                )}
            </div>

            <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setIsEditing(false) }}>
                <FormsAnnonce
                    initialData={selectedAnnonce ? mapAnnonceToFormData(selectedAnnonce) : undefined}
                    onSubmit={handleFormSubmit}
                    isSubmitting={isCreating}
                    isEditMode={isEditing}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                />
            </Modal>

            {/* DELETE CONFIRMATION */}
            <Delete
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false)
                    setAnnonceToDelete(null)
                }}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    )
}
