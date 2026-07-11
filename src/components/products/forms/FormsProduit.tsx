"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { getProductCategories } from "@/api/api";
import { Select2 } from "@/components/ui/Select2";
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import("@/components/ui/editor"), { ssr: false, loading: () => <div className="min-h-[200px] border rounded-lg animate-pulse bg-muted" /> });
import { Product, CategoryProd, ProductCondition, productConditionLabels, SubCategoryProd } from "@/types/interface";

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
    const [discountPercent, setDiscountPercent] = useState<string>(initialData?.discountPercent?.toString() || "");
    const [stock, setStock] = useState<string>(initialData?.stock?.toString() || "");
    const [etat, setEtat] = useState<ProductCondition>(initialData?.etat || ProductCondition.NEUF);
    const [typeVente, setTypeVente] = useState<'UNITE' | 'GROS'>(initialData?.typeVente || 'UNITE');
    const [prixVenteGros, setPrixVenteGros] = useState<string>(initialData?.prixVenteGros?.toString() || "");
    const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId || null);
    const [subCategoryId, setSubCategoryId] = useState<string | null>(initialData?.subCategoryId || null);
    const selectedCategory = React.useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId]);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>(
        initialData?.files?.map(f => f.fileUrl) ||
        initialData?.imageUrls ||
        initialData?.images ||
        []
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let isMounted = true;
        getProductCategories().then(res => {
            if (isMounted && res.statusCode === 200 && res.data) {
                setCategories(res.data);
                // Si on a des données initiales, on s'assure que la sous-catégorie est bien synchronisée
                // une fois que les catégories (et donc leurs sous-catégories) sont chargées.
                if (initialData?.subCategoryId) {
                    setSubCategoryId(initialData.subCategoryId);
                }
            }
        }).catch(() => { });
        return () => { isMounted = false; };
    }, [initialData]);

    // Sync state with initialData for edit mode
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setDescription(initialData.description || "");
            setPrice(initialData.price?.toString() || "");
            setDiscountPercent(initialData.discountPercent?.toString() || "");
            setStock(initialData.stock?.toString() || "");
            setEtat(initialData.etat || ProductCondition.NEUF);
            setTypeVente(initialData.typeVente || 'UNITE');
            setPrixVenteGros(initialData.prixVenteGros?.toString() || "");
            setCategoryId(initialData.categoryId || null);
            setSubCategoryId(initialData.subCategoryId || null);
            setImagePreviews(
                initialData.files?.map(f => f.fileUrl) ||
                initialData.imageUrls ||
                initialData.images ||
                []
            );
        }
    }, [initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (imagePreviews.length + files.length > 3) return;
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
        if (typeVente === 'GROS' && (!prixVenteGros || isNaN(Number(prixVenteGros)) || Number(prixVenteGros) <= 0)) {
            errs.prixVenteGros = "Le prix de gros est requis et doit être positif";
        }
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
        formData.append("etat", etat);
        formData.append("typeVente", typeVente);
        if (typeVente === 'GROS' && prixVenteGros) formData.append("prixVenteGros", prixVenteGros);
        formData.append("categoryId", categoryId || "");
        if (subCategoryId) formData.append("subCategoryId", subCategoryId);
        images.forEach(file => formData.append("files", file));

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="px-4 space-y-5">

                {/* Images */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                            Photos du produit
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{imagePreviews.length}/3</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {imagePreviews.map((src, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                                <Image
                                    src={src}
                                    alt={`preview-${i}`}
                                    fill
                                    className="object-cover"
                                    unoptimized />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                                >
                                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <label className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors bg-muted ${imagePreviews.length >= 3 ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary cursor-pointer'}`}>
                            <Icon icon="solar:upload-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-black mt-1">AJOUTER</span>
                            <input type="file" accept="image/*" multiple onChange={handleImageChange} disabled={imagePreviews.length >= 3} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* 1. Catégorisation & État */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:tag-bold-duotone" className="w-5 h-5 text-primary" />
                        Classification
                    </h3>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom du produit *</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: iPhone 15 Pro"
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catégorie *</label>
                            <Select2
                                options={categories}
                                labelExtractor={(cat) => cat.name}
                                valueExtractor={(cat) => cat.id}
                                selectedItem={categoryId}
                            onSelectionChange={(val) => {
                                setCategoryId(val);
                                setSubCategoryId(null);
                            }}
                            placeholder="Choisir une catégorie"
                            />
                            {errors.categoryId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.categoryId}</p>}
                        </div>

                        {selectedCategory?.subCategories && selectedCategory.subCategories.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sous-catégorie</label>
                                <Select2
                                    options={selectedCategory.subCategories}
                                    labelExtractor={(sub) => sub.name}
                                    valueExtractor={(sub) => sub.id}
                                    selectedItem={subCategoryId}
                                    onSelectionChange={(val) => setSubCategoryId(val)}
                                    placeholder="Choisir une sous-catégorie"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">État du produit *</label>
                        <Select2
                            options={Object.values(ProductCondition)}
                            labelExtractor={(condition) => productConditionLabels[condition as ProductCondition]}
                            valueExtractor={(condition) => condition}
                            selectedItem={etat}
                            onSelectionChange={(val) => setEtat(val as ProductCondition || ProductCondition.NEUF)}
                            placeholder="Sélectionner l'état"
                        />
                    </div>
                </div>

                {/* 2. Prix & Promotion */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:wad-of-money-bold-duotone" className="w-5 h-5 text-primary" />
                        Prix & Vente
                    </h3>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type de vente *</label>
                        <div className="flex gap-4">
                            <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${typeVente === 'UNITE' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                                <input type="radio" name="typeVente" value="UNITE" checked={typeVente === 'UNITE'} onChange={() => setTypeVente('UNITE')} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${typeVente === 'UNITE' ? 'border-primary' : 'border-muted-foreground'}`}>
                                    {typeVente === 'UNITE' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <span className="text-sm font-bold text-foreground">Vente à l'unité</span>
                            </label>
                            <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${typeVente === 'GROS' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                                <input type="radio" name="typeVente" value="GROS" checked={typeVente === 'GROS'} onChange={() => setTypeVente('GROS')} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${typeVente === 'GROS' ? 'border-primary' : 'border-muted-foreground'}`}>
                                    {typeVente === 'GROS' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <span className="text-sm font-bold text-foreground">Vente en gros</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prix de vente (FCFA) *</label>
                            <input
                                type="number"
                                min="0"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                placeholder="0"
                            />
                            {errors.price && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.price}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Réduction (%) (Optionnel)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={discountPercent}
                                onChange={e => setDiscountPercent(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium text-primary font-bold"
                                placeholder="ex: 10"
                            />
                            {discountPercent && Number(discountPercent) > 0 && price && Number(price) > 0 && (
                                <p className="text-[10px] text-green-600 font-bold mt-1">
                                    Prix promo calculé : {(Number(price) - (Number(price) * Number(discountPercent)) / 100).toLocaleString()} FCFA
                                </p>
                            )}
                        </div>
                    </div>

                    {typeVente === 'GROS' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prix de vente en gros (FCFA) *</label>
                            <input
                                type="number"
                                min="0"
                                value={prixVenteGros}
                                onChange={e => setPrixVenteGros(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                placeholder="Prix pour achat en lot"
                            />
                            {errors.prixVenteGros && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.prixVenteGros}</p>}
                        </div>
                    )}
                </div>

                {/* 3. Stock */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:clipboard-list-bold-duotone" className="w-5 h-5 text-primary" />
                        Gestion des stocks
                    </h3>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantité disponible *</label>
                        <input
                            type="number"
                            min="0"
                            value={stock}
                            onChange={e => setStock(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="0"
                        />
                        {errors.stock && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.stock}</p>}
                    </div>
                </div>

                {/* 4. Description */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:notes-bold-duotone" className="w-5 h-5 text-primary" />
                        Description détaillée
                    </h3>
                    <div className="space-y-1">
                        <RichTextEditor
                            content={description as string}
                            onChange={(val) => setDescription(val)}
                            editable={true}
                        />
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
