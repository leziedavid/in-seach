"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { getProductCategories } from "@/api/api";
import { Select2 } from "./Select2";
import { CategoryProd, Product } from "@/types/interface";
import RichTextEditor from "../rich-text-editor";

const productSchema = z.object({
    name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(100, "Le nom est trop long"),
    description: z.string().optional(),
    price: z.number().min(0.01, "Le prix est requis").positive("Le prix doit être positif"),
    discountPercent: z.number().optional(),
    stock: z.number().int().min(0, "Le stock est requis").nonnegative("Le stock ne peut pas être négatif"),
    categoryId: z.string().uuid("Veuillez sélectionner une catégorie"),
    isActive: z.boolean(),
    images: z.array(z.instanceof(File)).optional()
});

export type ProductFormData = z.infer<typeof productSchema>;

interface FormsProduitProps {
    initialData?: Partial<Product & { imageUrls?: string[] }>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function FormsProduit({ initialData, onSubmit, isSubmitting = false, isEditMode = false, isOpen, onClose }: FormsProduitProps) {
    const [categories, setCategories] = useState<CategoryProd[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
        initialData?.imageUrls ||
        (initialData?.files ? initialData.files.map(f => f.fileUrl) : (initialData?.imageUrl ? [initialData.imageUrl] : []))
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialData?.categoryId || null);

    const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            price: initialData?.price ?? 0,
            discountPercent: initialData?.discountPercent ?? undefined,
            stock: initialData?.stock ?? 0,
            categoryId: initialData?.categoryId || "",
            isActive: initialData?.isActive ?? true,
            images: [],
        }
    });

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const response = await getProductCategories();
                setCategories(response?.data || []);
            } catch (error) {
                console.error("Erreur chargement catégories produits:", error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategoryId) {
            setValue("categoryId", selectedCategoryId, { shouldValidate: true });
        }
    }, [selectedCategoryId, setValue]);

    const handleImageUpload = (files: FileList) => {
        const newFiles = Array.from(files);
        if (existingImageUrls.length + images.length + newFiles.length > 8) {
            return;
        }
        setImages(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number, isExisting: boolean) => {
        if (isExisting) {
            setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
        } else {
            setImages(prev => prev.filter((_, i) => i !== index));
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const onFormSubmit = async (formData: ProductFormData) => {
        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'images' && value !== undefined && value !== null) {
                submitData.append(key, value.toString());
            }
        });
        images.forEach((image) => { submitData.append('files', image); });
        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-20 scrollbar-hide">

                {/* Image Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6 ">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                            Catalogue Photos
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{existingImageUrls.length + images.length}/8</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        <label className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${(existingImageUrls.length + images.length) >= 8 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer border-primary/20'}`}>
                            <Icon icon="solar:camera-add-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] font-black text-muted-foreground mt-1 uppercase">Ajouter</span>
                            <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleImageUpload(e.target.files)} disabled={(existingImageUrls.length + images.length) >= 8} className="hidden" />
                        </label>
                        {existingImageUrls.map((url, i) => (
                            <div key={`ex-${i}`} className="relative h-24 rounded-2xl overflow-hidden group shadow-md">
                                <Image src={url} alt="Product" fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(i, true)} className="bg-red-500 text-white rounded-xl p-2 hover:scale-110 transition-transform">
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {imagePreviews.map((preview, i) => (
                            <div key={`pre-${i}`} className="relative h-24 rounded-2xl overflow-hidden group border-2 border-primary/30 shadow-md">
                                <Image src={preview} alt="New" fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(i, false)} className="bg-red-500 text-white rounded-xl p-2 hover:scale-110 transition-transform">
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6  space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:info-square-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Détails de l'article</h3>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom du produit</label>
                        <input {...register("name")} placeholder="Ex: Smartphone Pro Max" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Catégorie</label>
                        <Select2 options={categories} labelExtractor={(c) => c.name} valueExtractor={(c) => c.id} placeholder="Choisir une catégorie..." mode="single" selectedItem={selectedCategoryId} onSelectionChange={setSelectedCategoryId} />
                        {errors.categoryId && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.categoryId.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Stock disponible</label>
                            <input type="number" {...register("stock", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            {errors.stock && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.stock.message}</p>}
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" {...register("isActive")} id="isActive" className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary" />
                            <label htmlFor="isActive" className="text-[10px] font-black text-muted-foreground uppercase cursor-pointer">Produit actif / Visible</label>
                        </div>
                    </div>
                </div>

                {/* Price Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6  space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Icon icon="solar:tag-price-bold-duotone" className="text-emerald-600 w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Tarification</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Prix unitaire (FCFA)</label>
                            <input type="number" {...register("price", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            {errors.price && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.price.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Réduction (%)</label>
                            <input type="number" {...register("discountPercent", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-card rounded-[2rem] border border-border p-6  space-y-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Fiche Technique / Description</h3>
                    <div className="border border-border rounded-2xl overflow-hidden min-h-[200px]">
                        <Controller name="description" control={control} render={({ field }) => (
                            <RichTextEditor content={field.value} onChange={field.onChange} editable={true} />
                        )} />
                    </div>
                </div>

            </div>

            {/* Actions */}
            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3 z-10">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider h-12 flex-1">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all shadow-xl shadow-primary/20 h-12 flex-[2] flex items-center justify-center gap-2 uppercase tracking-widest">
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="animate-spin" /> : <><Icon icon="solar:check-circle-bold" /> {isEditMode ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}</>}
                </button>
            </div>
        </form>
    );
}
