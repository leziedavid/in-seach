"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getProductCategories } from "@/api/api";
import { Select2 } from "@/components/ui/Select2";
import ImageUploadGrid from "@/components/ui/ImageUploadGrid";
import { Product, CategoryProd } from "@/types/interface";

interface FormsMenuItemProps {
    initialData?: Product;
    onSubmit: (formData: FormData) => void | Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    onClose: () => void;
}

/**
 * Formulaire de plat de menu — inspiré de FormsProduit.tsx mais simplifié : pas d'état
 * du produit (NEUF/OCCASION...) ni de vente en gros, non pertinents pour la restauration.
 * Ajoute le temps de préparation. La disponibilité/quantité du jour réutilise le champ
 * générique Product.stock.
 */
export default function FormsMenuItem({ initialData, onSubmit, isSubmitting = false, isEditMode = false, onClose }: FormsMenuItemProps) {
    const [categories, setCategories] = useState<CategoryProd[]>([]);
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [price, setPrice] = useState<string>(initialData?.price?.toString() || "");
    const [discountPercent, setDiscountPercent] = useState<string>(initialData?.discountPercent?.toString() || "");
    const [stock, setStock] = useState<string>(initialData?.stock?.toString() ?? "20");
    const [preparationTime, setPreparationTime] = useState<string>(initialData?.preparationTime?.toString() || "");
    const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId || null);
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>(
        initialData?.files?.map(f => f.fileUrl) || initialData?.imageUrls || initialData?.images || []
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let isMounted = true;
        getProductCategories(true, 'RESTAURANT').then(res => {
            if (isMounted && res.statusCode === 200 && res.data) setCategories(res.data);
        }).catch(() => { });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setDescription(initialData.description || "");
            setPrice(initialData.price?.toString() || "");
            setDiscountPercent(initialData.discountPercent?.toString() || "");
            setStock(initialData.stock?.toString() ?? "20");
            setPreparationTime(initialData.preparationTime?.toString() || "");
            setCategoryId(initialData.categoryId || null);
            setIsActive(initialData.isActive ?? true);
            setImagePreviews(initialData.files?.map(f => f.fileUrl) || initialData.imageUrls || initialData.images || []);
        }
    }, [initialData]);

    const handleAddImages = (files: File[]) => {
        setImages(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(file);
        });
    };
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = "Le nom du plat est requis";
        if (!price || isNaN(Number(price)) || Number(price) <= 0) errs.price = "Le prix doit être positif";
        if (!categoryId) errs.categoryId = "Veuillez sélectionner une catégorie de menu";
        if (stock === "" || isNaN(Number(stock)) || Number(stock) < 0) errs.stock = "La quantité doit être ≥ 0";
        return errs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});

        const formData = new FormData();
        formData.append("name", name.trim());
        if (description) formData.append("description", description);
        formData.append("price", price);
        if (discountPercent) formData.append("discountPercent", discountPercent);
        formData.append("stock", stock);
        if (preparationTime) formData.append("preparationTime", preparationTime);
        formData.append("categoryId", categoryId || "");
        formData.append("isActive", String(isActive));
        images.forEach(file => formData.append("files", file));

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="px-4 space-y-5">
                <ImageUploadGrid title="Photo du plat" icon="solar:gallery-bold-duotone" max={3} previews={imagePreviews} onAdd={handleAddImages} onRemove={removeImage} />

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:chef-hat-bold-duotone" className="w-5 h-5 text-primary" />
                        Le plat
                    </h3>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom du plat *</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="ex: Attiéké Poisson" />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catégorie de menu *</label>
                        <Select2
                            options={categories}
                            labelExtractor={(cat) => cat.name}
                            valueExtractor={(cat) => cat.id}
                            selectedItem={categoryId}
                            onSelectionChange={(val) => setCategoryId(val)}
                            placeholder="ex: Plats, Entrées, Desserts, Boissons"
                        />
                        {errors.categoryId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.categoryId}</p>}
                        {categories.length === 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1">Aucune catégorie de menu n&apos;existe encore — contactez l&apos;administrateur pour en créer.</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium resize-none" placeholder="Ingrédients, préparation..." />
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:wad-of-money-bold-duotone" className="w-5 h-5 text-primary" />
                        Prix & disponibilité
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prix (FCFA) *</label>
                            <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="0" />
                            {errors.price && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.price}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Réduction (%) (optionnel)</label>
                            <input type="number" min="0" max="100" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="ex: 10" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantité disponible aujourd&apos;hui *</label>
                            <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="20" />
                            {errors.stock && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.stock}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Temps de préparation (min)</label>
                            <input type="number" min="0" value={preparationTime} onChange={e => setPreparationTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="ex: 20" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                        <div>
                            <p className="text-sm font-bold text-foreground">Disponible à la commande</p>
                            <p className="text-xs text-muted-foreground">Désactivez pour retirer temporairement ce plat du menu.</p>
                        </div>
                        <button type="button" onClick={() => setIsActive(v => !v)} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border flex items-center justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" /> : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                    {isEditMode ? "Mettre à jour" : "Ajouter au menu"}
                </button>
            </div>
        </form>
    );
}
