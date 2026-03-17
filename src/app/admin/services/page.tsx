'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminGetServices, adminToggleServiceActive, adminDeleteService, adminUpdateService } from '@/api/api';
import { Briefcase, MapPin, Trash2, Edit2, Eye, Calendar } from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { Service } from '@/types/interface';
import FormsServices from '@/components/Forms/FormsServices';
import Image from 'next/image';
import { Modal } from '@/components/modal/MotionModal';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    // Modal state
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchServices = async (p: number) => {
        setLoading(true);
        try {
            const res = await adminGetServices({ page: p, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setServices(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des services", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices(page);
    }, [page]);

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
        imageUrls: service.imageUrls || [],
        files: service.files || [],
    });

    const handleEditClick = (service: Service) => {
        setSelectedService(service);
        setIsOpen(true);
    };

    const handleUpdateService = async (data: FormData) => {
        if (!selectedService) return;
        setIsSubmitting(true);
        try {
            const res = await adminUpdateService(selectedService.id, data);
            if (res.statusCode === 200) {
                addNotification("Service mis à jour avec succès", "success");
                setIsOpen(false);
                fetchServices(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour du service", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (service: Service, value: boolean) => {
        try {
            const res = await adminToggleServiceActive(service.id, value);
            if (res.statusCode === 200) {
                addNotification("Statut du service mis à jour", "success");
                fetchServices(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la modification du statut", "error");
        }
    };

    const handleDelete = async (service: Service) => {
        if (!confirm(`Supprimer définitivement le service "${service.title}" ?`)) return;
        try {
            const res = await adminDeleteService(service.id);
            if (res.statusCode === 200) {
                addNotification("Service supprimé", "success");
                fetchServices(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    const columns: ColumnDef<Service>[] = [
        {
            accessorKey: 'title',
            header: 'Service',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-muted rounded-xl overflow-hidden border border-border/50 flex-shrink-0">
                        {row.original.files && row.original.files[0] ? (
                            <Image
                                src={row.original.files[0].fileUrl}
                                alt={row.original.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-black text-sm line-clamp-1">{row.original.title}</div>
                        <div className="text-muted-foreground text-[10px] font-mono flex items-center gap-2">
                            <Badge variant="secondary" className="px-1.5 py-0 text-[8px] h-4 rounded-md uppercase font-bold tracking-wider">
                                {row.original.category?.label || "Service"}
                            </Badge>
                            {row.original.code}
                        </div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'user.fullName',
            header: 'Prestataire',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-[9px] font-black text-primary border border-primary/20">
                        {row.original.user?.fullName?.[0] || "?"}
                    </div>
                    <div className="text-xs font-bold truncate max-w-[100px]">{row.original.user?.fullName || "Inconnu"}</div>
                </div>
            )
        },
        {
            accessorKey: 'price',
            header: 'Tarif / Lieu',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <div className="text-xs font-black text-primary">
                        {row.original.price}€ / {row.original.duration}min
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                        <MapPin className="w-2.5 h-2.5" />
                        {row.original.ville || "Distance"}
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Services</h1>
                    <p className="text-muted-foreground font-medium">Gestion du catalogue de prestations et des prestataires.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold border-border/50 bg-card shadow-sm">
                        Catégories
                    </Button>
                </div>
            </header>

            {/* <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden"> */}
            <div className="p-2">
                <GenericTable
                    columns={columns}
                    data={services}
                    loading={loading}
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    searchKey="title"
                    enableSwitch={true}
                    getActive={(row) => row.status === 'AVAILABLE'}
                    onToggleActive={handleToggle}
                    actions={[
                        {
                            icon: Edit2,
                            label: "Modifier",
                            value: "edit"
                        },
                        {
                            icon: Trash2,
                            label: "Supprimer",
                            value: "delete",
                            variant: "destructive"
                        }
                    ]}
                    onAction={(action, row) => {
                        if (action === "edit") handleEditClick(row);
                        if (action === "delete") handleDelete(row);
                    }}
                    emptyMessage="Aucun service trouvé"
                />
            </div>
            {/* </div> */}

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                {selectedService && (
                    <FormsServices
                        initialData={selectedService ? mapServiceToFormData(selectedService) : undefined}
                        onSubmit={handleUpdateService}
                        isSubmitting={isSubmitting}
                        isEditMode={true}
                        onClose={() => setIsOpen(false)}
                        isOpen={isOpen}
                    />
                )}
            </Modal>
        </div>
    );
}


