"use client"
import Image from "next/image"

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { TablePagination } from "../table/Pagination"
import FormsAnnonce from "../Forms/FormsAnnonce"
import { Annonce, AnnonceStatus } from "@/types/interface"
import { createAnnonce, getAnnonces, handleToggleAnnonceActive, updateAnnonce } from "@/api/api"
import { Modal } from "../modal/MotionModal"
import { Switch } from "../ui/switch"
import { useNotification } from "../toast/NotificationProvider"
import { Button } from "../ui/button"
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck"

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
        imageUrls: annonce.images || [],
        files: annonce.images || [],
    })

    const handleAction = (action: string, row: Annonce) => {
        if (action === "edit") {
            setSelectedAnnonce(row)
            setIsEditing(true)
            setIsOpen(true)
        }
        if (action === "delete") {
            setInternalListes((prev) => prev.filter((p) => p.id !== row.id))
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

    const paginatedData = propData ? propData : listes.slice(
        (page - 1) * limit,
        page * limit
    )
    const { checkEligibility, loading: checkLoading } = useSubscriptionCheck();

    return (
        <>
            <div className="flex flex-col w-full px-0">

                {/* DASHBOARD HEADER */}
                <div className="w-full max-w-6xl mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">   </h2>

                        <div className="flex items-center gap-8">

                            <div className="h-10 w-px bg-border" />

                            <div className="text-center md:text-left">
                                <p className="flex items-center gap-2 text-3xl md:text-4xl font-black text-secondary">
                                    <span>130</span>
                                    <Icon icon="solar:album-linear" className="w-8 h-8" />
                                </p>
                                <p className="text-sm text-muted-foreground font-medium"> Annonces </p>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="flex justify-end mb-2">
                    <Button
                        disabled={checkLoading}
                        onClick={async () => {
                            const canCreate = await checkEligibility('Annonce');
                            if (canCreate) {
                                setIsOpen(true);
                                setIsEditing(false);
                                setSelectedAnnonce(null)
                            }
                        }}
                        className="bg-primary text-primary-foreground hover:bg-secondary"
                    >
                        {checkLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-6 h-6 mr-2" /> : <Icon icon="mdi-light:file-plus" className="w-10 h-10" />}
                        Ajouter une annonce
                    </Button>
                </div>


                {loading && <div className="text-center py-10 text-muted-foreground">Chargement...</div>}
                {!loading && listes.length === 0 && <div className="text-center py-10 text-muted-foreground/60">Aucune annonce trouvée</div>}

                {!loading && listes.length > 0 && (
                    <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                        <div className="w-full px-2 md:px-0">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
                                {paginatedData.map((annonce: Annonce) => (
                                    <div key={annonce.id} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center transition-all w-full">

                                        <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                                            <Image
                                                src={(annonce.images?.[0] && annonce.images?.[0] !== "") ? annonce.images[0] : (annonce.imageUrls?.[0] && annonce.imageUrls?.[0] !== "") ? annonce.imageUrls[0] : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'}
                                                alt={annonce.title}
                                                fill
                                                unoptimized
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-black text-foreground shadow-sm uppercase">
                                                {annonce.categorie?.label || 'Annonce'}
                                            </div>
                                        </div>

                                        <div className="px-0.5 w-full">
                                            <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors text-left leading-tight">
                                                {annonce.title}
                                            </h3>


                                            <div className="flex items-center justify-start gap-1 text-primary mb-2 md:mb-4 md:justify-center">
                                                <Icon icon="solar:star-bold-duotone" className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                                                <span className="text-[9px] md:text-xs font-black tracking-tight">{annonce.type?.label || 'Vente'}</span>
                                            </div>

                                            <div className="text-left mb-3">
                                                <p className="text-secondary font-black text-sm md:text-base">
                                                    {annonce.price ? `${annonce.price.toLocaleString()} FCFA` : "0 FCFA"}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-center w-full gap-3">
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
        </>
    )
}
