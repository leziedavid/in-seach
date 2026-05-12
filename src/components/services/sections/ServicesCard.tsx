"use client"

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { TablePagination } from "@/components/ui/table/Pagination"
import FormsServices from "../forms/FormsServices"
import { Service, ServiceStatus } from "@/types/interface"
import { createService, getServices, handleToggleActive, updateService } from "@/api/api"
import { Modal } from "@/components/ui/MotionModal"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notifications/NotificationProvider"
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck"
import Delete from "@/components/logistics/modals/Delete"
import { deleteService as apiDeleteService } from "@/api/api"
import { SectionHeader } from "@/components/shared/SectionHeader"

/* =====================================================
   PAGE
===================================================== */

interface ServicesCardProps {
    data?: Service[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
}

export default function ServicesCard({ data: propData, page: propPage, limit: propLimit = 6, total: propTotal, totalPages: propTotalPages, loading: propLoading, onPageChange, onSuccess }: ServicesCardProps) {

    const [internalPage, setInternalPage] = useState(1)
    const page = propPage ?? internalPage;
    const limit = propLimit;
    const setPage = onPageChange ?? setInternalPage;

    const [isCreating, setIsCreating] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [internalLoading, setInternalLoading] = useState(false)
    const [internalListes, setInternalListes] = useState<Service[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const loading = propLoading ?? internalLoading;
    const listes = propData ?? internalListes;
    const total = propTotal ?? internalListes.length;
    const totalPages = propTotalPages ?? Math.ceil(total / limit);
    const { showNotification } = useNotification();

    /* ===============================
        FETCH SERVICES (Only if not controlled)
    =============================== */

    const getAllServies = async () => {
        if (propData) return; // Skip if controlled
        try {
            setInternalLoading(true)
            const response = await getServices({ page, limit })

            if (response?.statusCode === 200 && response?.data) {
                setInternalListes(response.data.data)
            }
        } catch (error) {
            console.error("Error fetching services:", error)
        } finally {
            setInternalLoading(false)
        }
    }

    useEffect(() => {
        if (!propData) {
            getAllServies()
        }
    }, [page, propData])

    /* ===============================
        HANDLERS
    =============================== */

    const handleToggleActiv = async (row: Service, value: boolean) => {

        const response = await handleToggleActive(row.id, value)
        if (response?.statusCode === 200) {
            showNotification(response.message, "success");
            onSuccess?.();
        }

    }

    const handleChangeStatus = (row: Service, status: ServiceStatus) => {
        setInternalListes((prev) =>
            prev.map((p) =>
                p.id === row.id ? { ...p, status } : p
            )
        )
    }

    /* ===============================
        MAP SERVICE TO FORM DATA
    =============================== */

    const mapServiceToFormData = (service: Service) => ({
        id: service.id,
        title: service.title,
        description: service.description,
        type: service.type,
        status: service.status,
        frais: service.frais,
        price: service.price,
        reduction: service.reduction,
        tags: service.tags,
        latitude: service.latitude,
        longitude: service.longitude,
        categoryId: service.categoryId,
        categories: service.categories || [],
        imageUrls: service.imageUrls || [],
        files: service.files || [],
    })

    const handleAction = (action: string, row: Service) => {
        if (action === "edit") {
            setSelectedService(row)
            setIsEditing(true)
            setIsOpen(true)
        }

        if (action === "delete") {
            setServiceToDelete(row)
            setIsDeleteModalOpen(true)
        }

        if (action === "duplicate") {
            setInternalListes((prev) => [
                ...prev,
                { ...row, id: String(Date.now()) },
            ])
        }
    }

    /* ===============================
        CREATE SERVICE
    =============================== */

    const handleCreateService = async (formData: FormData) => {
        try {
            setIsCreating(true)
            let response: any;

            if (selectedService?.id && isEditing) {
                response = await updateService(selectedService.id, formData)
            } else {
                response = await createService(formData)
            }

            if (response.statusCode === 201 || response.statusCode === 200) {
                showNotification(response.message, "success");
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
                    await getAllServies();
                }

            } else {
                showNotification(response.message, "error");
            }

        } catch (error: any) {
            showNotification(error.message, "error");
        } finally {
            setIsCreating(false)
        }
    }

    /* ===============================
        DELETE SERVICE
    =============================== */
    const handleDeleteConfirm = async () => {
        if (!serviceToDelete) return;
        try {
            setIsDeleting(true)
            const response = await apiDeleteService(serviceToDelete.id)
            if (response.statusCode === 200) {
                showNotification("Service supprimé avec succès", "success")
                setInternalListes((prev) => prev.filter((s) => s.id !== serviceToDelete.id))
                onSuccess?.()
            } else {
                showNotification(response.message || "Erreur lors de la suppression", "error")
            }
        } catch (error: any) {
            showNotification(error.message || "Erreur serveur", "error")
        } finally {
            setIsDeleting(false)
            setIsDeleteModalOpen(false)
            setServiceToDelete(null)
        }
    }

    /* ===============================
        RENDER
    =============================== */

    const paginatedData = propData ? propData : listes.slice(
        (page - 1) * limit,
        page * limit
    )

    const { checkEligibility, loading: checkLoading } = useSubscriptionCheck();

    return (
        <>
            <div className="flex flex-col w-full md:max-w-5xl max-w-full px-0">

                {/* LOADING */}
                {loading && (
                    <div className="text-center py-10 text-muted-foreground">
                        <Icon icon="line-md:loading-twotone-loop" className="w-6 h-6 mr-2" />  Chargement...
                    </div>
                )}

                {/* CARD GRID */}

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-4xl mb-6">
                    <div className="flex items-center w-full md:max-w-md bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm focus-within:border-primary transition-all">
                        <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                        <input type="text" placeholder="Rechercher dans mes produits..." className="flex-1 bg-transparent text-foreground outline-none text-sm placeholder:text-muted-foreground" />
                    </div>


                    <Button disabled={checkLoading} onClick={async () => {
                        const canCreate = await checkEligibility('Service');
                        if (canCreate) {
                            setIsOpen(true);
                            setIsEditing(false);
                            setSelectedService(null)
                        }
                    }}
                        className="bg-primary text-primary-foreground hover:bg-secondary uppercase">
                        {checkLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-6 h-6 mr-2" /> : <Icon icon="solar:widget-add-bold" width="24" height="24" />}
                        Publier un service
                    </Button>
                </div>

                <SectionHeader
                    title="Boostez votre visibilité et revenus"
                    subtitle="Développez votre activité en ajoutant de nouveaux services afin d’améliorer votre visibilité et vos revenus."
                    className="mb-8"
                />


                {!loading && listes.length === 0 && <div className="text-center py-10 text-muted-foreground/60">Aucun service trouvé</div>}

                {!loading && listes.length > 0 && (
                    <>
                        {/* DASHBOARD HEADER */}
                        <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">

                            <div className="w-full px-2 md:px-0">
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
                                    {paginatedData.map((service: Service) => (
                                        <div key={service.id} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center transition-all w-full">
                                            {/* Image - Pleine largeur sans padding */}
                                            <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                                                <Image src={(service.images?.[0] && service.images?.[0] !== "") ? service.images[0] : (service.imageUrls?.[0] && service.imageUrls?.[0] !== "") ? service.imageUrls[0] : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={service.title} fill
                                                    unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-black text-foreground shadow-sm uppercase">
                                                    {service.category?.label || 'Expert'}
                                                </div>
                                            </div>

                                            {/* Contenu - Padding minimal */}
                                            <div className="px-0.5 pb-0 md:px-0 md:pb-0 w-full">
                                                <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors w-full text-left leading-tight">
                                                    {service.title}
                                                </h3>

                                                <div className="flex items-center justify-start gap-1 text-primary mb-2 md:mb-4 md:justify-center">
                                                    <Icon icon="solar:star-bold-duotone" className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                                                    <span className="text-[9px] md:text-xs font-black tracking-tight">4.9 • <span className="text-muted-foreground">Pro</span></span>
                                                </div>

                                                <div className="text-left">
                                                    <p className="text-secondary font-black text-sm md:text-sm whitespace-nowrap">
                                                        {service.price ? `${service.price.toLocaleString()} FCFA` : "10 000 FCFA"}
                                                    </p>
                                                    {service.frais && (
                                                        <p className="text-[9px] text-muted-foreground font-bold mt-1">
                                                            Est. {service.frais.toLocaleString()} FCFA
                                                        </p>
                                                    )}
                                                </div>


                                                <div className="w-full flex items-center justify-between mt-auto">


                                                    <div className="flex items-center justify-center w-full mt-3 gap-3">
                                                        {/* SWITCH */}
                                                        <Switch checked={service.status === "AVAILABLE"} onCheckedChange={(value) => handleToggleActiv(service, value)} />

                                                        {/* ACTION ICONS */}
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleAction("edit", service)} className="p-2 rounded-lg hover:bg-muted transition"  >
                                                                <Icon icon="solar:pen-new-square-bold-duotone" width={18} height={18} />
                                                            </button>

                                                            <button onClick={() => handleAction("duplicate", service)} className="p-2 rounded-lg hover:bg-muted transition"  >
                                                                <Icon icon="solar:copy-bold-duotone" width={18} height={18} />
                                                            </button>

                                                            <button onClick={() => handleAction("delete", service)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition"  >
                                                                <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} height={18} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </>

                )}


                {/* PAGINATION */}
                <div className="w-full overflow-x-auto mt-4 px-4">
                    <TablePagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>

            {/* MODAL */}
            <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setIsEditing(false) }} >
                <FormsServices
                    initialData={selectedService ? mapServiceToFormData(selectedService) : undefined}
                    onSubmit={handleCreateService}
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
                    setServiceToDelete(null)
                }}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    )
}


