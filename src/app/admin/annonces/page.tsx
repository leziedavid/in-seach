'use client';

import React, { useEffect, useState } from 'react';
import { adminGetAnnonces, adminToggleAnnonceActive, adminDeleteAnnonce, adminUpdateAnnonce } from '@/api/api';
import { Radio, MapPin, Trash2, Edit2, Eye, Calendar, User } from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { Annonce, AnnonceStatus } from '@/types/interface';
import FormsAnnonce from '@/components/Forms/FormsAnnonce';
import Image from 'next/image';
import { Modal } from '@/components/modal/MotionModal';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminAnnoncesPage() {
    const [annonces, setAnnonces] = useState<Annonce[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    // Modal state
    const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    useEffect(() => {
        fetchAnnonces(page);
    }, [page]);

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

    const handleEditClick = (annonce: Annonce) => {
        setSelectedAnnonce(annonce);
        setIsOpen(true);
    };

    const handleUpdateAnnonce = async (data: FormData) => {
        if (!selectedAnnonce) return;
        setIsSubmitting(true);
        try {
            const res = await adminUpdateAnnonce(selectedAnnonce.id, data);
            if (res.statusCode === 200) {
                addNotification("Annonce mise à jour avec succès", "success");
                setIsOpen(false);
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

    const handleDelete = async (annonce: Annonce) => {
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

    const columns: ColumnDef<Annonce>[] = [
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
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Annonces</h1>
                    <p className="text-muted-foreground font-medium">Modération et gestion des annonces publiées par la communauté.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold border-border/50 bg-card shadow-sm">
                        Modération
                    </Button>
                </div>
            </header>

            {/* <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden"> */}
            <div className="p-2">
                <GenericTable
                    columns={columns}
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
                    emptyMessage="Aucune annonce trouvée"
                />
            </div>
            {/* </div> */}

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                {selectedAnnonce && (
                    <FormsAnnonce
                        initialData={selectedAnnonce ? mapAnnonceToFormData(selectedAnnonce) : undefined}
                        onSubmit={handleUpdateAnnonce}
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
