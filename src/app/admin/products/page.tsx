'use client';

import React, { useEffect, useState } from 'react';
import { 
    adminGetProducts, 
    adminDeleteProduct, 
    adminUpdateProduct,
    adminGetCategoriesProduct,
    adminCreateCategoryProduct,
    adminUpdateCategoryProduct,
    adminDeleteCategoryProduct
} from '@/api/api';
import { 
    ShoppingBag, Package, Trash2, Edit2, Box, Tag, 
    Calendar, Plus, Layers, Grid
} from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import Image from 'next/image';
import { Product, CategoryProd } from '@/types/interface';
import { Modal } from '@/components/modal/MotionModal';
import FormsProduit from '@/components/Forms/FormsProduit';
import CategoryProductForm from '@/components/Forms/CategoryProductForm';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TabType = 'products' | 'categories';

export default function AdminProductsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<CategoryProd[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    // Modal state for Products
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    
    // Modal state for Categories
    const [selectedCategory, setSelectedCategory] = useState<CategoryProd | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await adminGetCategoriesProduct();
            if (res.statusCode === 200 && res.data) {
                setCategories(res.data);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des catégories", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts(page);
        } else {
            fetchCategories();
        }
    }, [page, activeTab]);

    // --- Product Handlers ---
    const handleEditProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsEditing(true);
        setIsProductModalOpen(true);
    };

    const handleUpdateProduct = async (data: FormData) => {
        if (!selectedProduct) return;
        setIsSubmitting(true);
        try {
            const res = await adminUpdateProduct(selectedProduct.id, data);
            if (res.statusCode === 200) {
                addNotification("Produit mis à jour avec succès", "success");
                setIsProductModalOpen(false);
                fetchProducts(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour du produit", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (product: Product) => {
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

    // --- Category Handlers ---
    const handleCreateCategoryClick = () => {
        setSelectedCategory(null);
        setIsEditing(false);
        setIsCategoryModalOpen(true);
    };

    const handleEditCategoryClick = (category: CategoryProd) => {
        setSelectedCategory(category);
        setIsEditing(true);
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (data: { name: string }) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedCategory) {
                res = await adminUpdateCategoryProduct(selectedCategory.id, data);
            } else {
                res = await adminCreateCategoryProduct(data);
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Catégorie mise à jour" : "Catégorie créée", "success");
                setIsCategoryModalOpen(false);
                fetchCategories();
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement de la catégorie", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (category: CategoryProd) => {
        if (!confirm(`Voulez-vous vraiment supprimer la catégorie "${category.name}" ?`)) return;
        try {
            const res = await adminDeleteCategoryProduct(category.id);
            if (res.statusCode === 200) {
                addNotification("Catégorie supprimée", "success");
                fetchCategories();
            }
        } catch (error) {
            const msg = (error as any)?.message || "Erreur lors de la suppression. Vérifiez si des produits y sont liés.";
            addNotification(msg, "error");
        }
    };

    const productColumns: ColumnDef<Product>[] = [
        {
            accessorKey: 'name',
            header: 'Produit',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-muted rounded-xl overflow-hidden border border-border/50 flex-shrink-0">
                        {row.original.files && row.original.files[0] ? (
                            <Image src={row.original.files[0].fileUrl} alt={row.original.name} fill
                                className="object-cover"
                                unoptimized />
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
            accessorKey: 'user',
            header: 'Vendeur',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                        {row.original.user?.fullName?.[0] || 'U'}
                    </div>
                    <span className="text-xs font-bold">{row.original.user?.fullName || "Inconnu"}</span>
                </div>
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

    const categoryColumns: ColumnDef<CategoryProd>[] = [
        {
            accessorKey: 'name',
            header: 'Nom de la catégorie',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.name}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">{row.original.id}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'id',
            header: 'ID Technique',
            cell: ({ row }) => (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    {row.original.id}
                </span>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Produits</h1>
                    <p className="text-muted-foreground font-medium text-sm">Gestion du catalogue, du stock et des catégories.</p>
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Articles
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

            {loading && products.length === 0 && categories.length === 0 && (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <div className="flex justify-end mb-4">
                        <Button variant="outline" className="rounded-xl font-bold border-border/50 bg-card shadow-sm">
                            Exporter CSV
                        </Button>
                    </div>
                    
                    <div className="bg-card rounded-lg border border-border/50 shadow-xs overflow-hidden p-2">
                        <GenericTable
                            columns={productColumns}
                            data={products}
                            loading={loading}
                            totalItems={total}
                            currentPage={page}
                            itemsPerPage={10}
                            onPageChange={setPage}
                            searchKey="name"
                            actions={[
                                { icon: Edit2, label: "Modifier", value: "edit" },
                                { icon: Trash2, label: "Supprimer", value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditProductClick(row);
                                if (action === "delete") handleDeleteProduct(row);
                            }}
                            emptyMessage="Aucun produit trouvé"
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
                            searchKey="name"
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

            {/* MODAL: PRODUIIT */}
            <Modal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
            >
                {selectedProduct && (
                    <div className="p-4">
                        <h2 className="text-xl font-black px-2 pt-2 mb-1">Modifier le produit</h2>
                        <p className="text-muted-foreground px-2 mb-6 text-sm font-medium tracking-tight">Mise à jour des informations de l'article.</p>
                        <FormsProduit
                            initialData={selectedProduct}
                            onSubmit={handleUpdateProduct}
                            isSubmitting={isSubmitting}
                            isEditMode={true}
                            onClose={() => setIsProductModalOpen(false)}
                            isOpen={isProductModalOpen}
                        />
                    </div>
                )}
            </Modal>

            {/* MODAL: CATEGORIE */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer la catégorie' : 'Nouvelle catégorie'}</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">Définissez un nom clair pour regrouper vos produits.</p>
                    <CategoryProductForm
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
