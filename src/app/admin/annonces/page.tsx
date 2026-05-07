"use client";

import React, { useEffect, useState } from 'react';
import {
    adminGetAnnonces, adminToggleAnnonceActive, adminDeleteAnnonce, adminUpdateAnnonce,
    adminGetCategorieAnnonces, adminCreateCategorieAnnonce, adminUpdateCategorieAnnonce, adminDeleteCategorieAnnonce,
    adminGetTypeAnnonces, adminCreateTypeAnnonce, adminUpdateTypeAnnonce, adminDeleteTypeAnnonce,
    adminGetEquipmentNames, adminCreateEquipmentName, adminUpdateEquipmentName, adminDeleteEquipmentName,
    adminGetVehicleTypes, adminCreateVehicleType, adminUpdateVehicleType, adminDeleteVehicleType,
    adminGetTechnicalSheetDefaults, adminCreateTechnicalSheetDefault, adminUpdateTechnicalSheetDefault, adminDeleteTechnicalSheetDefault
} from '@/api/api';

import { Radio, MapPin, Trash2, Edit2, Plus, Layers, Tag as TagIcon, Box, Car, ShieldCheck, ClipboardList } from 'lucide-react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Annonce, AnnonceStatus, CategorieAnnonce, TypeAnnonce } from '@/types/interface';
import FormsAnnonce from '@/components/annonces/forms/FormsAnnonce';
import CategoryAnnonceForm from '@/components/annonces/forms/CategoryAnnonceForm';
import TypeAnnonceForm from '@/components/annonces/forms/TypeAnnonceForm';
import SimpleEntityForm from '@/components/common/SimpleEntityForm';
import TechnicalSheetConfigForm from '@/components/common/TechnicalSheetConfigForm';
import Image from 'next/image';
import { Modal } from '@/components/ui/MotionModal';
import { GenericTable } from '@/components/ui/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TabType = 'annonces' | 'categories' | 'types' | 'equipments' | 'vehicle_types' | 'tech_sheets';

export default function AdminAnnoncesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('annonces');
    const [annonces, setAnnonces] = useState<Annonce[]>([]);
    const [categories, setCategories] = useState<CategorieAnnonce[]>([]);
    const [types, setTypes] = useState<TypeAnnonce[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
    const [techSheets, setTechSheets] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    // Modal states
    const [isAnnonceModalOpen, setIsAnnonceModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [isVehicleTypeModalOpen, setIsVehicleTypeModalOpen] = useState(false);
    const [isTechSheetModalOpen, setIsTechSheetModalOpen] = useState(false);

    const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategorieAnnonce | null>(null);
    const [selectedType, setSelectedType] = useState<TypeAnnonce | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
    const [selectedVehicleType, setSelectedVehicleType] = useState<any | null>(null);
    const [selectedTechSheet, setSelectedTechSheet] = useState<any | null>(null);

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

    const fetchEquipments = async () => {
        setLoading(true);
        try {
            const res = await adminGetEquipmentNames();
            if (res.statusCode === 200 && res.data) setEquipments(res.data);
        } catch (error) {
            addNotification("Erreur lors du chargement des équipements", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleTypes = async () => {
        setLoading(true);
        try {
            const res = await adminGetVehicleTypes();
            if (res.statusCode === 200 && res.data) setVehicleTypes(res.data);
        } catch (error) {
            addNotification("Erreur lors du chargement des types de véhicules", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTechSheets = async () => {
        setLoading(true);
        try {
            const res = await adminGetTechnicalSheetDefaults();
            if (res.statusCode === 200 && res.data) setTechSheets(res.data);
        } catch (error) {
            addNotification("Erreur lors du chargement des fiches techniques", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'annonces') fetchAnnonces(page);
        else if (activeTab === 'categories') fetchCategories();
        else if (activeTab === 'types') fetchTypes();
        else if (activeTab === 'equipments') fetchEquipments();
        else if (activeTab === 'vehicle_types') fetchVehicleTypes();
        else if (activeTab === 'tech_sheets') fetchTechSheets();
    }, [page, activeTab]);

    const mapAnnonceToFormData = (annonce: Annonce) => {
        const { images, ...rest } = annonce;
        return {
            ...rest,
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
            technicalSheets: annonce.technicalSheets || [],
            equipments: annonce.equipments || [],
            imageUrls: images || [],
            files: images || [],
            images: [], // Ensure it matches the File[] type expected by the schema (here as empty)
        };
    };

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

    // --- Equipment Handlers ---
    const handleCreateEquipmentClick = () => {
        setSelectedEquipment(null);
        setIsEditing(false);
        setIsEquipmentModalOpen(true);
    };

    const handleEditEquipmentClick = (eq: any) => {
        setSelectedEquipment(eq);
        setIsEditing(true);
        setIsEquipmentModalOpen(true);
    };

    const handleEquipmentSubmit = async (data: { name: string }) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedEquipment) res = await adminUpdateEquipmentName(selectedEquipment.id, data);
            else res = await adminCreateEquipmentName(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Équipement mis à jour" : "Équipement ajouté", "success");
                setIsEquipmentModalOpen(false);
                fetchEquipments();
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEquipment = async (eq: any) => {
        if (!confirm(`Supprimer l'équipement "${eq.name}" ?`)) return;
        try {
            await adminDeleteEquipmentName(eq.id);
            addNotification("Équipement supprimé", "success");
            fetchEquipments();
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    // --- Vehicle Type Handlers ---
    const handleCreateVehicleTypeClick = () => {
        setSelectedVehicleType(null);
        setIsEditing(false);
        setIsVehicleTypeModalOpen(true);
    };

    const handleEditVehicleTypeClick = (vt: any) => {
        setSelectedVehicleType(vt);
        setIsEditing(true);
        setIsVehicleTypeModalOpen(true);
    };

    const handleVehicleTypeSubmit = async (data: { name: string }) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedVehicleType) res = await adminUpdateVehicleType(selectedVehicleType.id, data);
            else res = await adminCreateVehicleType(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Type de véhicule mis à jour" : "Type de véhicule ajouté", "success");
                setIsVehicleTypeModalOpen(false);
                fetchVehicleTypes();
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVehicleType = async (vt: any) => {
        if (!confirm(`Supprimer le type "${vt.name}" ?`)) return;
        try {
            await adminDeleteVehicleType(vt.id);
            addNotification("Type de véhicule supprimé", "success");
            fetchVehicleTypes();
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    // --- Technical Sheet Handlers ---
    const handleCreateTechSheetClick = () => {
        setSelectedTechSheet(null);
        setIsEditing(false);
        setIsTechSheetModalOpen(true);
    };

    const handleEditTechSheetClick = (ts: any) => {
        setSelectedTechSheet(ts);
        setIsEditing(true);
        setIsTechSheetModalOpen(true);
    };

    const handleTechSheetSubmit = async (data: { key: string; category?: string }) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedTechSheet) res = await adminUpdateTechnicalSheetDefault(selectedTechSheet.id, data);
            else res = await adminCreateTechnicalSheetDefault(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Champ technique mis à jour" : "Champ technique ajouté", "success");
                setIsTechSheetModalOpen(false);
                fetchTechSheets();
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTechSheet = async (ts: any) => {
        if (!confirm(`Supprimer le champ "${ts.key}" ?`)) return;
        try {
            await adminDeleteTechnicalSheetDefault(ts.id);
            addNotification("Champ supprimé", "success");
            fetchTechSheets();
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    // --- Column Definitions ---
    const annonceColumns: ColumnDef<Annonce>[] = [
        {
            accessorKey: 'title',
            header: 'Annonce',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-muted rounded-xl overflow-hidden border border-border/50 flex-shrink-0">
                        {row.original.files && row.original.files[0]?.fileUrl ? (
                            <Image src={row.original.files[0].fileUrl} alt={row.original.title} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Radio className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-black text-sm line-clamp-1">{row.original.title}</div>
                        <div className="text-muted-foreground text-[10px] font-mono flex items-center gap-2">
                            <Plus className="w-2.5 h-2.5" />
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
                    <ClipboardList className="w-3 h-3" />
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
        }
    ];

    const entityColumns = (label: string): ColumnDef<any>[] => [
        {
            accessorKey: 'name',
            header: label,
            cell: ({ row }) => <div className="font-black text-sm">{row.original.name}</div>
        },
        {
            accessorKey: 'createdAt',
            header: 'Ajouté le',
            cell: ({ row }) => <div className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</div>
        }
    ];

    const techSheetColumns: ColumnDef<any>[] = [
        {
            accessorKey: 'key',
            header: 'Champ technique',
            cell: ({ row }) => <div className="font-black text-sm">{row.original.key}</div>
        },
        {
            accessorKey: 'category',
            header: 'Catégorie',
            cell: ({ row }) => (
                <Badge variant="outline" className="px-1.5 py-0 text-[8px] h-4 rounded-md uppercase font-bold tracking-wider w-fit border-border/50">
                    {row.original.category === 'vehicle' ? 'Véhicules' : row.original.category === 'real_estate' ? 'Immobilier' : 'Autre'}
                </Badge>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col xxl:flex-row xxl:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Annonces & Catalogue</h1>
                    <p className="text-muted-foreground font-medium text-sm">Gestion complète du catalogue : annonces, catégories, types et spécifications.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 p-1 bg-muted rounded-xl w-fit">
                    {[
                        { id: 'annonces', label: 'Annonces', icon: Radio },
                        { id: 'categories', label: 'Catégories', icon: Layers },
                        { id: 'types', label: 'Types', icon: TagIcon },
                        { id: 'equipments', label: 'Équipements', icon: ShieldCheck },
                        { id: 'vehicle_types', label: 'Types Véhicules', icon: Car },
                        { id: 'tech_sheets', label: 'Fiches Tech', icon: ClipboardList }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {loading && <div className="flex items-center justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div></div>}

            <div className="animate-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'annonces' && (
                    <GenericTable 
                        columns={annonceColumns} data={annonces} loading={loading} totalItems={total} currentPage={page} itemsPerPage={10} 
                        onPageChange={setPage} searchKey="title" enableSwitch={true} getActive={(row) => row.status === AnnonceStatus.ACTIVE} onToggleActive={handleToggle}
                        actions={[{ icon: Edit2, label: "Modifier", value: "edit" }, { icon: Trash2, label: "Supprimer", value: "delete", variant: "destructive" }]} 
                        onAction={(action, row) => action === "edit" ? handleEditAnnonceClick(row) : handleDeleteAnnonce(row)}
                    />
                )}

                {(['categories', 'types', 'equipments', 'vehicle_types', 'tech_sheets'] as TabType[]).includes(activeTab) && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button 
                                onClick={() => {
                                    if (activeTab === 'categories') handleCreateCategoryClick();
                                    else if (activeTab === 'types') handleCreateTypeClick();
                                    else if (activeTab === 'equipments') handleCreateEquipmentClick();
                                    else if (activeTab === 'vehicle_types') handleCreateVehicleTypeClick();
                                    else if (activeTab === 'tech_sheets') handleCreateTechSheetClick();
                                }} 
                                className="rounded-xl font-bold gap-2"
                            >
                                <Plus className="w-4 h-4" /> Nouveau
                            </Button>
                        </div>
                        <GenericTable
                            columns={
                                activeTab === 'categories' ? categoryColumns : 
                                activeTab === 'types' ? typeColumns : 
                                activeTab === 'equipments' ? entityColumns('Équipement') : 
                                activeTab === 'vehicle_types' ? entityColumns('Type Véhicule') : 
                                techSheetColumns
                            }
                            data={
                                activeTab === 'categories' ? categories : 
                                activeTab === 'types' ? types : 
                                activeTab === 'equipments' ? equipments : 
                                activeTab === 'vehicle_types' ? vehicleTypes : 
                                techSheets
                            }
                            loading={loading} searchKey={activeTab === 'tech_sheets' ? 'key' : activeTab === 'categories' || activeTab === 'types' ? 'label' : 'name'}
                            actions={[{ icon: Edit2, label: "Modifier", value: "edit" }, { icon: Trash2, label: "Supprimer", value: "delete", variant: "destructive" }]}
                            onAction={(action, row) => {
                                if (action === "edit") {
                                    if (activeTab === 'categories') handleEditCategoryClick(row);
                                    else if (activeTab === 'types') handleEditTypeClick(row);
                                    else if (activeTab === 'equipments') handleEditEquipmentClick(row);
                                    else if (activeTab === 'vehicle_types') handleEditVehicleTypeClick(row);
                                    else if (activeTab === 'tech_sheets') handleEditTechSheetClick(row);
                                } else {
                                    if (activeTab === 'categories') handleDeleteCategory(row);
                                    else if (activeTab === 'types') handleDeleteType(row);
                                    else if (activeTab === 'equipments') handleDeleteEquipment(row);
                                    else if (activeTab === 'vehicle_types') handleDeleteVehicleType(row);
                                    else if (activeTab === 'tech_sheets') handleDeleteTechSheet(row);
                                }
                            }}
                        />
                    </div>
                )}
            </div>

            {/* MODALS */}
            <Modal isOpen={isAnnonceModalOpen} onClose={() => setIsAnnonceModalOpen(false)}>
                {selectedAnnonce && (
                    <div className="p-4">
                        <h2 className="text-xl font-black px-2 pt-2 mb-1">Modifier l'annonce</h2>
                        <FormsAnnonce initialData={mapAnnonceToFormData(selectedAnnonce)} onSubmit={handleUpdateAnnonce} isSubmitting={isSubmitting} isEditMode={true} onClose={() => setIsAnnonceModalOpen(false)} isOpen={isAnnonceModalOpen} />
                    </div>
                )}
            </Modal>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer la catégorie' : 'Nouvelle catégorie'}</h2>
                    <CategoryAnnonceForm initialData={selectedCategory || undefined} onSubmit={handleCategorySubmit} isSubmitting={isSubmitting} isEditing={isEditing} onClose={() => setIsCategoryModalOpen(false)} />
                </div>
            </Modal>

            <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer le type' : 'Nouveau type'}</h2>
                    <TypeAnnonceForm initialData={selectedType || undefined} onSubmit={handleTypeSubmit} isSubmitting={isSubmitting} isEditing={isEditing} onClose={() => setIsTypeModalOpen(false)} />
                </div>
            </Modal>

            <Modal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer l\'équipement' : 'Nouvel équipement'}</h2>
                    <SimpleEntityForm initialData={selectedEquipment || undefined} onSubmit={handleEquipmentSubmit} isSubmitting={isSubmitting} isEditing={isEditing} onClose={() => setIsEquipmentModalOpen(false)} label="Nom de l'équipement" />
                </div>
            </Modal>

            <Modal isOpen={isVehicleTypeModalOpen} onClose={() => setIsVehicleTypeModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer le type' : 'Nouveau type de véhicule'}</h2>
                    <SimpleEntityForm initialData={selectedVehicleType || undefined} onSubmit={handleVehicleTypeSubmit} isSubmitting={isSubmitting} isEditing={isEditing} onClose={() => setIsVehicleTypeModalOpen(false)} label="Nom du type" />
                </div>
            </Modal>

            <Modal isOpen={isTechSheetModalOpen} onClose={() => setIsTechSheetModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer le champ' : 'Nouveau champ technique'}</h2>
                    <TechnicalSheetConfigForm initialData={selectedTechSheet || undefined} onSubmit={handleTechSheetSubmit} isSubmitting={isSubmitting} isEditing={isEditing} onClose={() => setIsTechSheetModalOpen(false)} />
                </div>
            </Modal>
        </div>
    );
}
