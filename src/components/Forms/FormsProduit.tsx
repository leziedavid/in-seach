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
    images: z.array(z.instanceof(File)).refine((files) => files.every(file => ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)), { message: 'Les fichiers doivent être des images (PNG, JPEG, WEBP).' }).refine((files) => files.every(file => file.size <= 5 * 1024 * 1024), { message: 'Chaque fichier ne doit pas dépasser 5 Mo.' })
});

export interface ProductFormData {
    name: string;
    description?: string;
    price: number;
    discountPercent?: number;
    stock: number;
    categoryId: string;
    isActive: boolean;
    images: File[];
}

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
        const totalImages = existingImageUrls.length + images.length;
        if (totalImages + newFiles.length > 1) {
            alert("Vous ne pouvez ajouter qu'une image");
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

    const onFormSubmit: SubmitHandler<ProductFormData> = async (formData) => {
        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'images' && value !== undefined && value !== null) {
                submitData.append(key, value.toString());
            }
        });

        images.forEach((image) => {
            submitData.append('files', image);
        });

        await onSubmit(submitData);
    };

    const totalImages = existingImageUrls.length + images.length;

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">

                {/* Image Section */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                            Images du produit
                        </h3>
                        <span className="text-xs text-muted-foreground">{totalImages}/1 images</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <label className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted transition-colors ${totalImages >= 1 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer'}`}>
                            <Icon icon="solar:upload-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] mt-1">Ajouter</span>
                            <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleImageUpload(e.target.files)} disabled={totalImages >= 1} className="hidden" />
                        </label>

                        {existingImageUrls.map((url, index) => (
                            <div key={`ex-${index}`} className="relative h-24 rounded-lg overflow-hidden group">
                                <Image src={url} alt="Product" fill className="object-cover" unoptimized />
                                <button type="button" onClick={() => removeImage(index, true)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {imagePreviews.map((preview, index) => (
                            <div key={`pre-${index}`} className="relative h-24 rounded-lg overflow-hidden group border border-primary/30">
                                <Image src={preview} alt="New" fill className="object-cover" unoptimized />
                                <button type="button" onClick={() => removeImage(index, false)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Info */}
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom du produit *</label>
                        <input {...register("name")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all" placeholder="ex: iPhone 15 Pro"
                            inputMode={'text'}
                            style={{ fontSize: '16px' }}
                            suppressHydrationWarning
                        />
                        {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Prix (CFA) *</label>
                            <input type="number" {...register("price", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all" placeholder="0"
                                inputMode={'numeric'}
                                style={{ fontSize: '16px' }}
                                suppressHydrationWarning
                            />
                            {errors.price && <p className="text-[10px] text-red-500">{errors.price.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Stock *</label>
                            <input type="number" {...register("stock", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all" placeholder="0"
                                inputMode={'numeric'}
                                style={{ fontSize: '16px' }}
                                suppressHydrationWarning
                            />
                            {errors.stock && <p className="text-[10px] text-red-500">{errors.stock.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Promotion (%)</label>
                            <input type="number" {...register("discountPercent", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all" placeholder="ex: 20"
                                inputMode={'numeric'}
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground">Prix Promotionnel</label>
                            <div className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm italic text-muted-foreground">
                                {watch("price") && watch("discountPercent") ? 
                                    (watch("price") - ((watch("price") || 0) * (watch("discountPercent") || 0) / 100)).toLocaleString() : 
                                    "Aucune promo"}
                            </div>
                        </div>
                    </div>


                    <div className="space-y-1">
                        <label className="text-xs font-bold">Catégorie *</label>
                        {isLoadingCategories ? (
                            <div className="h-10 animate-pulse bg-muted rounded-lg" />
                        ) : (
                            <Select2<CategoryProd>
                                options={categories}
                                labelExtractor={(c) => c.name}
                                valueExtractor={(c) => c.id}
                                placeholder="Choisir une catégorie..."
                                mode="single"
                                selectedItem={selectedCategoryId}
                                onSelectionChange={setSelectedCategoryId} />
                        )}
                        {errors.categoryId && <p className="text-[10px] text-red-500">{errors.categoryId.message}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" {...register("isActive")} id="isActive" className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                        <label htmlFor="isActive" className="text-xs font-medium">Produit actif (visible par les clients)</label>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold">Description</label>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor content={field.value || ""} onChange={field.onChange} editable={true} />
                        )}
                    />
                </div>
            </div>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border flex items-center justify-end gap-3 rounded-b-xl">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" /> : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                    {isEditMode ? 'Mettre à jour' : 'Ajouter le produit'}
                </button>
            </div>
        </form>
    );
}
