'use client';

import React, { useEffect, useState } from 'react';
import { 
    adminGetServices, 
    adminToggleServiceActive, 
    adminDeleteService, 
    adminUpdateService,
    adminGetCategories,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory
} from '@/api/api';
import { 
    Briefcase, MapPin, Trash2, Edit2, Box, Tag, 
    Calendar, Plus, Layers, Grid, Image as ImageIcon
} from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { Service, Category } from '@/types/interface';
import FormsServices from '@/components/Forms/FormsServices';
import CategoryServiceForm from '@/components/Forms/CategoryServiceForm';
import Image from 'next/image';
import { Modal } from '@/components/modal/MotionModal';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TabType = 'services' | 'categories';

export default function AdminServicesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('services');
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    // Modal state for Services
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    
    // Modal state for Categories
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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

    const fetchCategories = async (p: number = 1) => {
        setLoading(true);
        try {
            const res = await adminGetCategories({ page: p, limit: 100 });
            if (res.statusCode === 200 && res.data) {
                setCategories(res.data.data);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des catégories", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'services') {
            fetchServices(page);
        } else {
            fetchCategories();
        }
    }, [page, activeTab]);

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

    // --- Service Handlers ---
    const handleEditServiceClick = (service: Service) => {
        setSelectedService(service);
        setIsEditing(true);
        setIsServiceModalOpen(true);
    };

    const handleUpdateService = async (data: FormData) => {
        if (!selectedService) return;
        setIsSubmitting(true);
        try {
            const res = await adminUpdateService(selectedService.id, data);
            if (res.statusCode === 200) {
                addNotification("Service mis à jour avec succès", "success");
                setIsServiceModalOpen(false);
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

    const handleDeleteService = async (service: Service) => {
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

    // --- Category Handlers ---
    const handleCreateCategoryClick = () => {
        setSelectedCategory(null);
        setIsEditing(false);
        setIsCategoryModalOpen(true);
    };

    const handleEditCategoryClick = (category: Category) => {
        setSelectedCategory(category);
        setIsEditing(true);
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedCategory) {
                res = await adminUpdateCategory(selectedCategory.id, formData);
            } else {
                res = await adminCreateCategory(formData);
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Catégorie mise à jour" : "Catégorie créée", "success");
                setIsCategoryModalOpen(false);
                fetchCategories();
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", "error");
            }
        } catch (error) {
            addNotification("Erreur réseau lors de l'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        if (!confirm(`Voulez-vous vraiment supprimer la catégorie "${category.label}" ?`)) return;
        try {
            const res = await adminDeleteCategory(category.id);
            if (res.statusCode === 200) {
                addNotification("Catégorie supprimée", "success");
                fetchCategories();
            } else {
                addNotification(res.message || "Erreur lors de la suppression", "error");
            }
        } catch (error) {
            addNotification("Erreur réseau lors de la suppression", "error");
        }
    };

    const serviceColumns: ColumnDef<Service>[] = [
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
                                unoptimized
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

    const categoryColumns: ColumnDef<Category>[] = [
        {
            accessorKey: 'label',
            header: 'Catégorie',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 bg-primary/10 rounded-xl overflow-hidden flex items-center justify-center text-primary border border-primary/20">
                        {row.original.iconName ? (
                            <Image src={row.original.iconName} alt={row.original.label} fill className="object-cover p-1" unoptimized />
                        ) : (
                            <Tag className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.label}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">{row.original.id}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'services',
            header: 'Services liés',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-black text-muted-foreground">
                        {row.original._count?.services || 0} services
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
                    <p className="text-muted-foreground font-medium text-sm">Gestion du catalogue de prestations et des catégories.</p>
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'services' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Briefcase className="w-3.5 h-3.5" />
                        Services
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Catégories
                    </button>
                </div>
            </header>

            {loading && services.length === 0 && categories.length === 0 && (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                </div>
            )}

            {activeTab === 'services' && (
                <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <div className="p-2">
                        <GenericTable
                            columns={serviceColumns}
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
                                { icon: Edit2, label: "Modifier", value: "edit" },
                                { icon: Trash2, label: "Supprimer", value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditServiceClick(row);
                                if (action === "delete") handleDeleteService(row);
                            }}
                            emptyMessage="Aucun service trouvé"
                        />
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleCreateCategoryClick} className="rounded-xl font-bold gap-2">
                            <Plus className="w-4 h-4" /> Nouvelle Catégorie
                        </Button>
                    </div>

                    <div className="bg-card rounded-lg border border-border/50 shadow-xs overflow-hidden p-2">
                        <GenericTable
                            columns={categoryColumns}
                            data={categories}
                            loading={loading}
                            totalItems={categories.length}
                            currentPage={1}
                            itemsPerPage={100}
                            onPageChange={() => {}}
                            searchKey="label"
                            actions={[
                                { icon: Edit2, label: "Modifier", value: "edit" },
                                { icon: Trash2, label: "Supprimer", value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditCategoryClick(row);
                                if (action === "delete") handleDeleteCategory(row);
                            }}
                            emptyMessage="Aucune catégorie de service définie."
                        />
                    </div>
                </div>
            )}

            {/* MODAL: SERVICE */}
            <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)}>
                {selectedService && (
                    <div className="p-4">
                        <h2 className="text-xl font-black px-2 pt-2 mb-1">Modifier le service</h2>
                        <p className="text-muted-foreground px-2 mb-6 text-sm font-medium tracking-tight">Mise à jour des informations de la prestation.</p>
                        <FormsServices
                            initialData={selectedService ? mapServiceToFormData(selectedService) : undefined}
                            onSubmit={handleUpdateService}
                            isSubmitting={isSubmitting}
                            isEditMode={true}
                            onClose={() => setIsServiceModalOpen(false)}
                            isOpen={isServiceModalOpen}
                        />
                    </div>
                )}
            </Modal>

            {/* MODAL: CATEGORIE */}
            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer la catégorie' : 'Nouvelle catégorie'}</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">Choisissez un label et une icône représentative.</p>
                    <CategoryServiceForm
                        initialData={selectedCategory || undefined}
                        onSubmit={handleCategorySubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        onClose={() => setIsCategoryModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
}


