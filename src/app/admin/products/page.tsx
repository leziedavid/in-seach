'use client';

import React, { useEffect, useState } from 'react';
import { adminGetProducts, adminDeleteProduct, adminUpdateProduct } from '@/api/api';
import { ShoppingBag, Package, Trash2, Edit2, Box, Tag, DollarSign, Calendar } from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import Image from 'next/image';
import { Product } from '@/types/interface';
import { Modal } from '@/components/modal/MotionModal';
import FormsProduit from '@/components/Forms/FormsProduit';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminProductsPage() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const { addNotification } = useNotification();

    // Modal state
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const fetchProducts = async (p: number) => {
        setLoading(true);
        try {
            const res = await adminGetProducts({ page: p, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setProducts(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des produits", "error");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchProducts(page);
    }, [page]);

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsOpen(true);
    };

    const handleUpdateProduct = async (data: FormData) => {
        if (!selectedProduct) return;
        setIsSubmitting(true);
        try {
            const res = await adminUpdateProduct(selectedProduct.id, data);
            if (res.statusCode === 200) {
                addNotification("Produit mis à jour avec succès", "success");
                setIsOpen(false);
                fetchProducts(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour du produit", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`Voulez-vous vraiment supprimer le produit "${product.name}" ?`)) return;
        try {
            const res = await adminDeleteProduct(product.id);
            if (res.statusCode === 200) {
                addNotification("Produit supprimé", "success");
                fetchProducts(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: 'name',
            header: 'Produit',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-muted rounded-xl overflow-hidden border border-border/50 flex-shrink-0">
                        {row.original.files && row.original.files[0] ? (
                            <Image
                                src={row.original.files[0].fileUrl}
                                alt={row.original.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-black text-sm line-clamp-1">{row.original.name}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">{row.original.id.substring(0, 8)}...</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'category.name',
            header: 'Catégorie',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs font-semibold">
                    <Tag className="w-3 h-3 text-primary" />
                    {row.original.category?.name || "Général"}
                </div>
            )
        },
        {
            accessorKey: 'price',
            header: 'Prix',
            cell: ({ row }) => (
                <div className="font-black text-sm tabular-nums">
                    {row.original.price}€
                </div>
            )
        },
        {
            accessorKey: 'stock',
            header: 'Stock',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Box className="w-3 h-3 text-muted-foreground" />
                    <span className={`text-xs font-bold ${row.original.stock < 5 ? 'text-rose-500' : 'text-foreground'}`}>
                        {row.original.stock} pcs
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'isActive',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ${row.original.isActive
                    ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                    : 'text-rose-600 border-rose-200 bg-rose-50'
                    }`}>
                    {row.original.isActive ? 'Actif' : 'Inactif'}
                </Badge>
            )
        },
        {
            accessorKey: 'createdAt',
            header: 'Ajouté le',
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
                    <h1 className="text-3xl font-black tracking-tight mb-1">Produits</h1>
                    <p className="text-muted-foreground font-medium">Inventaire complet et gestion des stocks de la plateforme.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold border-border/50 bg-card shadow-sm">
                        Exporter
                    </Button>
                </div>
            </header>

            {/* <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden"> */}
            <div className="p-2">
                <GenericTable
                    columns={columns}
                    data={products}
                    loading={loading}
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    searchKey="name"
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
                    emptyMessage="Aucun produit trouvé"
                />
            </div>
            {/* </div> */}

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            >
                {selectedProduct && (
                    <FormsProduit
                        initialData={selectedProduct}
                        onSubmit={handleUpdateProduct}
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
