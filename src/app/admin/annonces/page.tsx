'use client';

import React, { useEffect, useState } from 'react';
import { 
    adminGetAnnonces, 
    adminToggleAnnonceActive, 
    adminDeleteAnnonce, 
    adminUpdateAnnonce,
    adminGetCategorieAnnonces,
    adminCreateCategorieAnnonce,
    adminUpdateCategorieAnnonce,
    adminDeleteCategorieAnnonce,
    adminGetTypeAnnonces,
    adminCreateTypeAnnonce,
    adminUpdateTypeAnnonce,
    adminDeleteTypeAnnonce
} from '@/api/api';
import { 
    Radio, MapPin, Trash2, Edit2, Eye, Calendar, User, 
    Plus, Layers, Tag as TagIcon, Box, Grid
} from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { Annonce, AnnonceStatus, CategorieAnnonce, TypeAnnonce } from '@/types/interface';
import FormsAnnonce from '@/components/Forms/FormsAnnonce';
import CategoryAnnonceForm from '@/components/Forms/CategoryAnnonceForm';
import TypeAnnonceForm from '@/components/Forms/TypeAnnonceForm';
import Image from 'next/image';
import { Modal } from '@/components/modal/MotionModal';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TabType = 'annonces' | 'categories' | 'types';

export default function AdminAnnoncesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('annonces');
    const [annonces, setAnnonces] = useState<Annonce[]>([]);
    const [categories, setCategories] = useState<CategorieAnnonce[]>([]);
    const [types, setTypes] = useState<TypeAnnonce[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    // Modal states
    const [isAnnonceModalOpen, setIsAnnonceModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    
    const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategorieAnnonce | null>(null);
    const [selectedType, setSelectedType] = useState<TypeAnnonce | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchAnnonces = async (p: number) => {
        setLoading(true);
        try {
            const res = await adminGetAnnonces({ page: p, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setAnnonces(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des annonces", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await adminGetCategorieAnnonces({ page: 1, limit: 100 });
            if (res.statusCode === 200 && res.data) {
                setCategories(res.data.data);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des catégories", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await adminGetTypeAnnonces({ page: 1, limit: 100 });
            if (res.statusCode === 200 && res.data) {
                setTypes(res.data.data);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des types", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'annonces') fetchAnnonces(page);
        else if (activeTab === 'categories') fetchCategories();
        else if (activeTab === 'types') fetchTypes();
    }, [page, activeTab]);

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
    });

    // --- Annonce Handlers ---
    const handleEditAnnonceClick = (annonce: Annonce) => {
        setSelectedAnnonce(annonce);
        setIsAnnonceModalOpen(true);
    };

    const handleUpdateAnnonce = async (data: FormData) => {
        if (!selectedAnnonce) return;
        setIsSubmitting(true);
        try {
            const res = await adminUpdateAnnonce(selectedAnnonce.id, data);
            if (res.statusCode === 200) {
                addNotification("Annonce mise à jour avec succès", "success");
                setIsAnnonceModalOpen(false);
                fetchAnnonces(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour de l'annonce", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (annonce: Annonce, value: boolean) => {
        try {
            const res = await adminToggleAnnonceActive(annonce.id, value);
            if (res.statusCode === 200) {
                addNotification("Statut de l'annonce mis à jour", "success");
                fetchAnnonces(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la modification du statut", "error");
        }
    };

    const handleDeleteAnnonce = async (annonce: Annonce) => {
        if (!confirm(`Supprimer l'annonce "${annonce.title}" ?`)) return;
        try {
            const res = await adminDeleteAnnonce(annonce.id);
            if (res.statusCode === 200) {
                addNotification("Annonce supprimée", "success");
                fetchAnnonces(page);
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

    const handleEditCategoryClick = (category: CategorieAnnonce) => {
        setSelectedCategory(category);
        setIsEditing(true);
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedCategory) {
                res = await adminUpdateCategorieAnnonce(selectedCategory.id, formData);
            } else {
                res = await adminCreateCategorieAnnonce(formData);
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

    const handleDeleteCategory = async (category: CategorieAnnonce) => {
        if (!confirm(`Supprimer la catégorie "${category.label}" ?`)) return;
        try {
            const res = await adminDeleteCategorieAnnonce(category.id);
            if (res.statusCode === 200) {
                addNotification("Catégorie supprimée", "success");
                fetchCategories();
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    // --- Type Handlers ---
    const handleCreateTypeClick = () => {
        setSelectedType(null);
        setIsEditing(false);
        setIsTypeModalOpen(true);
    };

    const handleEditTypeClick = (type: TypeAnnonce) => {
        setSelectedType(type);
        setIsEditing(true);
        setIsTypeModalOpen(true);
    };

    const handleTypeSubmit = async (data: { label: string }) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedType) {
                res = await adminUpdateTypeAnnonce(selectedType.id, data);
            } else {
                res = await adminCreateTypeAnnonce(data);
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Type mis à jour" : "Type créé", "success");
                setIsTypeModalOpen(false);
                fetchTypes();
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", "error");
            }
        } catch (error) {
            addNotification("Erreur réseau lors de l'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteType = async (type: TypeAnnonce) => {
        if (!confirm(`Supprimer le type "${type.label}" ?`)) return;
        try {
            const res = await adminDeleteTypeAnnonce(type.id);
            if (res.statusCode === 200) {
                addNotification("Type supprimé", "success");
                fetchTypes();
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    const annonceColumns: ColumnDef<Annonce>[] = [
        {
            accessorKey: 'title',
            header: 'Annonce',
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
                                <Radio className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-black text-sm line-clamp-1">{row.original.title}</div>
                        <div className="text-muted-foreground text-[10px] font-mono flex items-center gap-2">
                            <User className="w-2.5 h-2.5" />
                            {row.original.user?.fullName || "Inconnu"}
                        </div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'categorie.label',
            header: 'Catégorie / Type',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[8px] h-4 rounded-md uppercase font-bold tracking-wider w-fit">
                        {row.original.categorie?.label || "Catégorie"}
                    </Badge>
                    <Badge variant="outline" className="px-1.5 py-0 text-[8px] h-4 rounded-md uppercase font-bold tracking-wider w-fit border-border/50">
                        {row.original.type?.label || "Type"}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: 'ville',
            header: 'Localisation',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <MapPin className="w-3 h-3 text-primary/70" />
                    {row.original.ville || "Non précisé"}
                </div>
            )
        },
        {
            accessorKey: 'createdAt',
            header: 'Publié le',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
                    <span className="text-[10px] opacity-50 px-1.5 py-0.5 bg-muted rounded font-mono ml-auto">#{row.original.code}</span>
                </div>
            )
        }
    ];

    const categoryColumns: ColumnDef<CategorieAnnonce>[] = [
        {
            accessorKey: 'label',
            header: 'Catégorie',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 bg-primary/10 rounded-xl overflow-hidden flex items-center justify-center text-primary border border-primary/20">
                        {row.original.iconName ? (
                            <Image src={row.original.iconName} alt={row.original.label} fill className="object-cover p-1" unoptimized />
                        ) : (
                            <TagIcon className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.label}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">/{row.original.slug}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: '_count.annonces',
            header: 'Annonces liées',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-muted rounded-full text-[10px] font-black text-muted-foreground w-fit">
                    {row.original._count?.annonces || 0} annonces
                </div>
            )
        }
    ];

    const typeColumns: ColumnDef<TypeAnnonce>[] = [
        {
            accessorKey: 'label',
            header: 'Type',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary border border-secondary/20">
                        <Box className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.label}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">/{row.original.slug}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: '_count.annonces',
            header: 'Annonces liées',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-muted rounded-full text-[10px] font-black text-muted-foreground w-fit">
                    {row.original._count?.annonces || 0} annonces
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Annonces</h1>
                    <p className="text-muted-foreground font-medium text-sm">Gestion du catalogue, catégories et types d'annonces.</p>
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                    <button
                        onClick={() => setActiveTab('annonces')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'annonces' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Radio className="w-3.5 h-3.5" />
                        Annonces
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Catégories
                    </button>
                    <button
                        onClick={() => setActiveTab('types')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'types' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <TagIcon className="w-3.5 h-3.5" />
                        Types
                    </button>
                </div>
            </header>

            {loading && annonces.length === 0 && categories.length === 0 && types.length === 0 && (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                </div>
            )}

            {activeTab === 'annonces' && (
                <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <div className="p-2">
                        <GenericTable
                            columns={annonceColumns}
                            data={annonces}
                            loading={loading}
                            totalItems={total}
                            currentPage={page}
                            itemsPerPage={10}
                            onPageChange={setPage}
                            searchKey="title"
                            enableSwitch={true}
                            getActive={(row) => row.status === AnnonceStatus.ACTIVE}
                            onToggleActive={handleToggle}
                            actions={[
                                { icon: Edit2, label: "Modifier", value: "edit" },
                                { icon: Trash2, label: "Supprimer", value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditAnnonceClick(row);
                                if (action === "delete") handleDeleteAnnonce(row);
                            }}
                            emptyMessage="Aucune annonce trouvée"
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
                            emptyMessage="Aucune catégorie définie."
                        />
                    </div>
                </div>
            )}

            {activeTab === 'types' && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleCreateTypeClick} className="rounded-xl font-bold gap-2">
                            <Plus className="w-4 h-4" /> Nouveau Type
                        </Button>
                    </div>
                    <div className="bg-card rounded-lg border border-border/50 shadow-xs overflow-hidden p-2">
                        <GenericTable
                            columns={typeColumns}
                            data={types}
                            loading={loading}
                            totalItems={types.length}
                            currentPage={1}
                            itemsPerPage={100}
                            onPageChange={() => {}}
                            searchKey="label"
                            actions={[
                                { icon: Edit2, label: "Modifier", value: "edit" },
                                { icon: Trash2, label: "Supprimer", value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditTypeClick(row);
                                if (action === "delete") handleDeleteType(row);
                            }}
                            emptyMessage="Aucun type défini."
                        />
                    </div>
                </div>
            )}

            {/* MODALS */}
            <Modal isOpen={isAnnonceModalOpen} onClose={() => setIsAnnonceModalOpen(false)}>
                {selectedAnnonce && (
                    <div className="p-4">
                        <h2 className="text-xl font-black px-2 pt-2 mb-1">Modifier l'annonce</h2>
                        <p className="text-muted-foreground px-2 mb-6 text-sm font-medium tracking-tight">Mise à jour des informations de l'annonce.</p>
                        <FormsAnnonce
                            initialData={selectedAnnonce ? mapAnnonceToFormData(selectedAnnonce) : undefined}
                            onSubmit={handleUpdateAnnonce}
                            isSubmitting={isSubmitting}
                            isEditMode={true}
                            onClose={() => setIsAnnonceModalOpen(false)}
                            isOpen={isAnnonceModalOpen}
                        />
                    </div>
                )}
            </Modal>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer la catégorie' : 'Nouvelle catégorie'}</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">Label, slug et icône de la catégorie.</p>
                    <CategoryAnnonceForm
                        initialData={selectedCategory || undefined}
                        onSubmit={handleCategorySubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        onClose={() => setIsCategoryModalOpen(false)}
                    />
                </div>
            </Modal>

            <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer le type' : 'Nouveau type'}</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">Format des annonces (Offre, Demande...).</p>
                    <TypeAnnonceForm
                        initialData={selectedType || undefined}
                        onSubmit={handleTypeSubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        onClose={() => setIsTypeModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
}
