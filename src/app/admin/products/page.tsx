'use client';

import React, { useEffect, useState } from 'react';
import { adminGetProducts, adminDeleteProduct, adminUpdateProduct, adminGetCategoriesProduct, adminCreateCategoryProduct, adminUpdateCategoryProduct, adminDeleteCategoryProduct, adminGetSubCategoriesProduct, adminCreateSubCategoryProduct, adminUpdateSubCategoryProduct, adminDeleteSubCategoryProduct, adminToggleProductStatus, adminToggleCategoryProductStatus, adminToggleSubCategoryProductStatus } from '@/api/api';
import { ShoppingBag, Package, Trash2, Edit2, Box, Tag, Calendar, Plus, Layers, Grid, ListTree, ChefHat } from 'lucide-react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import Image from "next/image";
import { Product, CategoryProd, SubCategoryProd, productConditionLabels } from '@/types/interface';
import { Modal } from '@/components/ui/MotionModal';
import FormsProduit from '@/components/products/forms/FormsProduit';
import CategoryProductForm from '@/components/products/forms/CategoryProductForm';
import SubCategoryProductForm from '@/components/products/forms/SubCategoryProductForm';
import { GenericTable } from '@/components/ui/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from "@/utils/langue/hooks";

type TabType = 'products' | 'categories' | 'sub-categories';
type CategoryScope = 'MARKETPLACE' | 'RESTAURANT';

export default function AdminProductsPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('products');
    // Sous-onglet de la section "Catégories" — distingue les catégories marchandises
    // (Boutique) des catégories de menu (Restaurant), qui partagent la même table
    // CategoryProduct côté backend (voir CategoryProduct.scope).
    const [categoryScope, setCategoryScope] = useState<CategoryScope>('MARKETPLACE');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<CategoryProd[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategoryProd[]>([]);
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

    // Modal state for Sub-categories
    const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryProd | null>(null);
    const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);

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
            addNotification(t("admin.products.error_load"), "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async (scope: CategoryScope = categoryScope) => {
        setLoading(true);
        try {
            const res = await adminGetCategoriesProduct(scope);
            if (res.statusCode === 200 && res.data) {
                setCategories(res.data);
            }
        } catch (error) {
            addNotification(t("admin.products.error_load"), "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubCategories = async () => {
        setLoading(true);
        try {
            const res = await adminGetSubCategoriesProduct();
            if (res.statusCode === 200 && res.data) {
                setSubCategories(res.data);
            }
        } catch (error) {
            addNotification(t("admin.products.error_load"), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts(page);
        } else if (activeTab === 'categories') {
            fetchCategories(categoryScope);
        } else {
            fetchSubCategories();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, activeTab, categoryScope]);

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
                addNotification(t("admin.products.success_update"), "success");
                setIsProductModalOpen(false);
                fetchProducts(page);
            }
        } catch (error) {
            addNotification(t("admin.products.error_update"), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (product: Product) => {
        if (!confirm(t("admin.products.confirm_delete_product", { name: product.name }))) return;
        try {
            const res = await adminDeleteProduct(product.id);
            if (res.statusCode === 200) {
                addNotification(t("admin.products.success_delete"), "success");
                fetchProducts(page);
            }
        } catch (error) {
            addNotification(t("admin.products.error_delete"), "error");
        }
    };

    const handleToggleProduct = async (product: Product, value: boolean) => {
        try {
            const res = await adminToggleProductStatus(product.id, value);
            if (res.statusCode === 200) {
                addNotification(t("admin.products.success_update"), "success");
                fetchProducts(page);
            }
        } catch (error) {
            addNotification(t("admin.products.error_status"), "error");
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

    const handleToggleCategory = async (category: CategoryProd, value: boolean) => {
        try {
            const res = await adminToggleCategoryProductStatus(category.id, value);
            if (res.statusCode === 200) {
                addNotification(t("admin.products.success_update"), "success");
                fetchCategories();
            }
        } catch (error) {
            addNotification(t("admin.products.error_status"), "error");
        }
    };

    const handleCategorySubmit = async (data: { name: string; status: boolean; scope: CategoryScope }) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedCategory) {
                res = await adminUpdateCategoryProduct(selectedCategory.id, data);
            } else {
                res = await adminCreateCategoryProduct(data);
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? t("admin.products.edit_category") : t("admin.products.new_category"), "success");
                setIsCategoryModalOpen(false);
                fetchCategories();
            }
        } catch (error) {
            addNotification(t("admin.products.error_save_category"), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (category: CategoryProd) => {
        if (!confirm(t("admin.products.confirm_delete_product", { name: category.name }))) return;
        try {
            const res = await adminDeleteCategoryProduct(category.id);
            if (res.statusCode === 200) {
                addNotification(t("admin.products.success_delete"), "success");
                fetchCategories();
            }
        } catch (error) {
            const msg = (error as any)?.message || t("admin.products.error_delete");
            addNotification(msg, "error");
        }
    };

    // --- Sub-category Handlers ---
    const handleCreateSubCategoryClick = () => {
        setSelectedSubCategory(null);
        setIsEditing(false);
        setIsSubCategoryModalOpen(true);
    };

    const handleEditSubCategoryClick = (subCategory: SubCategoryProd) => {
        setSelectedSubCategory(subCategory);
        setIsEditing(true);
        setIsSubCategoryModalOpen(true);
    };

    const handleSubCategorySubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedSubCategory) {
                res = await adminUpdateSubCategoryProduct(selectedSubCategory.id, data);
            } else {
                res = await adminCreateSubCategoryProduct(data);
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? t("admin.products.edit_sub_category") : t("admin.products.new_sub_category"), "success");
                setIsSubCategoryModalOpen(false);
                fetchSubCategories();
            }
        } catch (error) {
            const msg = (error as any)?.response?.data?.message || t("admin.products.error_save_sub_category");
            addNotification(msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubCategory = async (subCategory: SubCategoryProd) => {
        if (!confirm(t("admin.products.confirm_delete_product", { name: subCategory.name }))) return;
        try {
            const res = await adminDeleteSubCategoryProduct(subCategory.id);
            if (res.statusCode === 200) {
                addNotification(t("admin.products.success_delete"), "success");
                fetchSubCategories();
            }
        } catch (error) {
            const msg = (error as any)?.message || t("admin.products.error_delete");
            addNotification(msg, "error");
        }
    };

    const handleToggleSubCategory = async (subCategory: SubCategoryProd, value: boolean) => {
        try {
            const res = await adminToggleSubCategoryProductStatus(subCategory.id, value);
            if (res.statusCode === 200) {
                addNotification(t("admin.products.success_update"), "success");
                fetchSubCategories();
            }
        } catch (error) {
            addNotification(t("admin.products.error_status"), "error");
        }
    };

    const productColumns: ColumnDef<Product>[] = [
        {
            accessorKey: 'name',
            header: t("admin.menu.products"),
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-muted rounded-xl overflow-hidden border border-border/50 flex-shrink-0">
                        {row.original.files && row.original.files[0] ? (
                            <Image
                                src={row.original.files[0].fileUrl}
                                alt={row.original.name}
                                fill
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
            header: t("common.category"),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs font-semibold">
                    <Tag className="w-3 h-3 text-primary" />
                    {row.original.category?.name || t("admin.dashboard.available")}
                </div>
            )
        },
        {
            accessorKey: 'price',
            header: t("common.price"),
            cell: ({ row }) => (
                <div className="font-black text-sm tabular-nums">
                    {row.original.price} CFA
                </div>
            )
        },
        {
            accessorKey: 'stock',
            header: t("common.stock"),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Box className="w-3 h-3 text-muted-foreground" />
                    <span className={`text-xs font-bold ${row.original.stock < 5 ? 'text-rose-500' : 'text-foreground'}`}>
                        {t("admin.products.units_count", { count: row.original.stock })}
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'isActive',
            header: t("common.status"),
            cell: ({ row }) => (
                <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ${row.original.isActive
                    ? 'text-green-600 border-green-200 bg-green-50'
                    : 'text-rose-600 border-rose-200 bg-rose-50'
                    }`}>
                    {row.original.isActive ? t("common.active") : t("common.inactive")}
                </Badge>
            )
        },
        {
            accessorKey: 'etat',
            header: t("admin.products.state"),
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-widest bg-blue-50 text-blue-600 border-blue-200">
                    {productConditionLabels[row.original.etat] || row.original.etat}
                </Badge>
            )
        },
        {
            accessorKey: 'user',
            header: t("admin.products.seller"),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                        {row.original.user?.fullName?.[0] || 'U'}
                    </div>
                    <span className="text-xs font-bold">{row.original.user?.fullName || t("admin.products.unknown_seller")}</span>
                </div>
            )
        },
        {
            accessorKey: 'createdAt',
            header: t("admin.products.added_at"),
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
            header: t("admin.products.category_name"),
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
            accessorKey: 'subCategories',
            header: t("admin.products.sub_categories"),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-0.5 rounded-full text-[10px] font-black">
                        {t("admin.products.items_count", { count: row.original.subCategories?.length || 0 })}
                    </Badge>
                </div>
            )
        }
    ];

    const subCategoryColumns: ColumnDef<SubCategoryProd>[] = [
        {
            accessorKey: 'name',
            header: t("admin.products.sub_category_name"),
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 border border-blue-500/20">
                        <ListTree className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.name}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">{row.original.slug}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'categoryId',
            header: t("common.back"),
            cell: ({ row }) => {
                const parent = categories.find(c => c.id === row.original.categoryId);
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                            {parent?.name || t("admin.dashboard.available")}
                        </Badge>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">{t("admin.products.title")}</h1>
                    <p className="text-muted-foreground font-medium text-sm">{t("admin.products.subtitle")}</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                    <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {t("admin.products.articles")}
                    </button>
                    <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Layers className="w-3.5 h-3.5" />
                        {t("admin.products.categories")}
                    </button>
                    <button onClick={() => setActiveTab('sub-categories')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'sub-categories' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <ListTree className="w-3.5 h-3.5" />
                        {t("admin.products.sub_categories")}
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
                            {t("admin.products.export_csv")}
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
                            enableSwitch={true}
                            getActive={(row) => row.isActive}
                            onToggleActive={handleToggleProduct}
                            actions={[
                                { icon: Edit2, label: t("common.edit"), value: "edit" },
                                { icon: Trash2, label: t("common.delete"), value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditProductClick(row);
                                if (action === "delete") handleDeleteProduct(row);
                            }}
                            emptyMessage={t("common.no_results")}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                            <button
                                onClick={() => setCategoryScope('MARKETPLACE')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${categoryScope === 'MARKETPLACE' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Marketplace
                            </button>
                            <button
                                onClick={() => setCategoryScope('RESTAURANT')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${categoryScope === 'RESTAURANT' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ChefHat className="w-3.5 h-3.5" />
                                Restaurant
                            </button>
                        </div>
                        <Button onClick={handleCreateCategoryClick} className="rounded-xl font-bold gap-2">
                            <Plus className="w-4 h-4" /> {t("admin.products.new_category")}
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
                            onPageChange={() => { }}
                            searchKey="name"
                            enableSwitch={true}
                            getActive={(row) => row.status}
                            onToggleActive={handleToggleCategory}
                            actions={[
                                { icon: Edit2, label: t("common.edit"), value: "edit" },
                                { icon: Trash2, label: t("common.delete"), value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditCategoryClick(row);
                                if (action === "delete") handleDeleteCategory(row);
                            }}
                            emptyMessage={t("common.no_results")}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'sub-categories' && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleCreateSubCategoryClick} className="rounded-xl font-bold gap-2">
                            <Plus className="w-4 h-4" /> {t("admin.products.new_sub_category")}
                        </Button>
                    </div>

                    <div className="bg-card rounded-lg border border-border/50 shadow-xs overflow-hidden p-2">
                        <GenericTable
                            columns={subCategoryColumns}
                            data={subCategories}
                            loading={loading}
                            totalItems={subCategories.length}
                            currentPage={1}
                            itemsPerPage={100}
                            onPageChange={() => { }}
                            searchKey="name"
                            enableSwitch={true}
                            getActive={(row) => row.status}
                            onToggleActive={handleToggleSubCategory}
                            actions={[
                                { icon: Edit2, label: t("common.edit"), value: "edit" },
                                { icon: Trash2, label: t("common.delete"), value: "delete", variant: "destructive" }
                            ]}
                            onAction={(action, row) => {
                                if (action === "edit") handleEditSubCategoryClick(row);
                                if (action === "delete") handleDeleteSubCategory(row);
                            }}
                            emptyMessage={t("common.no_results")}
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
                        <h2 className="text-xl font-black px-2 pt-2 mb-1">{t("admin.products.edit_product")}</h2>
                        <p className="text-muted-foreground px-2 mb-6 text-sm font-medium tracking-tight">{t("admin.products.success_update")}</p>
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
                    <h2 className="text-xl font-black mb-1">{isEditing ? t("admin.products.edit_category") : t("admin.products.new_category")}</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">{t("admin.products.category_name")}</p>
                    <CategoryProductForm
                        initialData={selectedCategory || undefined}
                        defaultScope={categoryScope}
                        onSubmit={handleCategorySubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        onClose={() => setIsCategoryModalOpen(false)}
                    />
                </div>
            </Modal>

            {/* MODAL: SOUS-CATEGORIE */}
            <Modal
                isOpen={isSubCategoryModalOpen}
                onClose={() => setIsSubCategoryModalOpen(false)}
            >
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? t("admin.products.edit_sub_category") : t("admin.products.new_sub_category")}</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">{t("admin.products.sub_category_name")}</p>
                    <SubCategoryProductForm
                        initialData={selectedSubCategory || undefined}
                        categories={categories}
                        onSubmit={handleSubCategorySubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        onClose={() => setIsSubCategoryModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
}
