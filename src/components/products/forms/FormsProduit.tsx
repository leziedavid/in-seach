"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { getProductCategories } from "@/api/api";
import { Product, CategoryProd, ProductCondition, productConditionLabels } from "@/types/interface";

interface FormsProduitProps {
    initialData?: Product;
    onSubmit: (formData: FormData) => void | Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen?: boolean;
    onClose: () => void;
}

export default function FormsProduit({
    initialData,
    onSubmit,
    isSubmitting = false,
    isEditMode = false,
    onClose,
}: FormsProduitProps) {
    const [categories, setCategories] = useState<CategoryProd[]>([]);
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [price, setPrice] = useState<string>(initialData?.price?.toString() || "");
    const [pricePromo, setPricePromo] = useState<string>(initialData?.pricePromo?.toString() || "");
    const [stock, setStock] = useState<string>(initialData?.stock?.toString() || "");
    const [sku, setSku] = useState(initialData?.sku || "");
    const [etat, setEtat] = useState<ProductCondition>(initialData?.etat || ProductCondition.NEUF);
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>(
        initialData?.files?.map(f => f.fileUrl) ||
        initialData?.imageUrls ||
        initialData?.images ||
        []
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        getProductCategories().then(res => {
            if (res.statusCode === 200 && res.data) setCategories(res.data);
        }).catch(() => {});
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setImages(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => {
                setImagePreviews(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = "Le nom est requis";
        if (!price || isNaN(Number(price)) || Number(price) <= 0) errs.price = "Le prix doit être positif";
        if (!stock || isNaN(Number(stock)) || Number(stock) < 0) errs.stock = "Le stock doit être ≥ 0";
        if (!categoryId) errs.categoryId = "Veuillez sélectionner une catégorie";
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
        if (pricePromo) formData.append("pricePromo", pricePromo);
        formData.append("stock", stock);
        if (sku) formData.append("sku", sku);
        formData.append("etat", etat);
        formData.append("categoryId", categoryId);
        images.forEach(file => formData.append("files", file));

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="px-4 space-y-5">

                {/* Images */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                        <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                        Photos du produit
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {imagePreviews.map((src, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                                <Image src={src} alt={`preview-${i}`} fill className="object-cover" unoptimized />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                                >
                                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted">
                            <Icon icon="solar:upload-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-black mt-1">AJOUTER</span>
                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Infos de base */}
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2">
                        <Icon icon="solar:box-bold-duotone" className="w-5 h-5 text-primary" />
                        Informations du produit
                    </h3>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom du produit *</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: iPhone 14 Pro Max"
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Description</label>
                        <textarea
                            value={description as string}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium resize-none"
                            placeholder="Décrivez votre produit..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Prix (FCFA) *</label>
                            <input
                                type="number"
                                min="0"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                                placeholder="15000"
                            />
                            {errors.price && <p className="text-[10px] text-red-500 font-bold">{errors.price}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Prix promo</label>
                            <input
                                type="number"
                                min="0"
                                value={pricePromo}
                                onChange={e => setPricePromo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                                placeholder="12000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Stock *</label>
                            <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                                placeholder="10"
                            />
                            {errors.stock && <p className="text-[10px] text-red-500 font-bold">{errors.stock}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold">SKU</label>
                            <input
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                                placeholder="PRD-001"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">État du produit *</label>
                        <select
                            value={etat}
                            onChange={e => setEtat(e.target.value as ProductCondition)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                        >
                            {Object.values(ProductCondition).map(condition => (
                                <option key={condition} value={condition}>
                                    {productConditionLabels[condition]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Catégorie *</label>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                        >
                            <option value="">Sélectionner une catégorie</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {errors.categoryId && <p className="text-[10px] text-red-500 font-bold">{errors.categoryId}</p>}
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting
                        ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" />
                        : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    }
                    {isEditMode ? "Mettre à jour" : "Publier le produit"}
                </button>
            </div>
        </form>
    );
}
