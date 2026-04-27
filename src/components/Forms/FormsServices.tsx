"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { getForSelectCategories } from "@/api/api";
import { Select2 } from "./Select2";
import { Category, ServiceStatus, ServiceType, UserLocation } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import RichTextEditor from "../rich-text-editor";

const serviceSchema = z.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100, "Le titre est trop long"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(2000, "Description trop longue"),
    type: z.nativeEnum(ServiceType),
    status: z.nativeEnum(ServiceStatus),
    price: z.number().positive("Le prix doit être positif").optional(),
    frais: z.number().nonnegative("Les frais doivent être positifs").optional(),
    reduction: z.number().min(0, "La réduction ne peut pas être négative").max(100, "La réduction ne peut pas dépasser 100%").optional(),
    tags: z.array(z.string()),
    latitude: z.number({ message: "La localisation est obligatoire" }).refine(val => val !== 0, "Veuillez renseigner votre position"),
    longitude: z.number({ message: "La localisation est obligatoire" }).refine(val => val !== 0, "Veuillez renseigner votre position"),
    categoryIds: z.array(z.string().uuid("Veuillez sélectionner une catégorie")).min(1, "Veuillez sélectionner au moins une catégorie"),
    images: z.array(z.instanceof(File)).optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

interface FormsServicesProps {
    initialData?: Partial<ServiceFormData & { id?: string; imageUrls?: string[]; files?: any[]; categories?: any[] }>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

const SERVICE_TYPE_OPTIONS = [
    { id: ServiceType.DEPANNAGE, label: "🔧 DÉPANNAGE" },
    { id: ServiceType.VENTE, label: "🛒 VENTE" },
    { id: ServiceType.LOCATION, label: "📦 LOCATION" },
    { id: ServiceType.INSTALLATION, label: "⚙️ INSTALLATION" },
    { id: ServiceType.CONSEIL, label: "💡 CONSEIL" },
];

const SERVICE_STATUS_OPTIONS = [
    { id: ServiceStatus.AVAILABLE, label: "✅ DISPONIBLE" },
    { id: ServiceStatus.UNAVAILABLE, label: "❌ INDISPONIBLE" },
    { id: ServiceStatus.PENDING, label: "⏳ EN ATTENTE" },
];

export default function FormsServices({ initialData, onSubmit, isSubmitting = false, isEditMode = false, isOpen, onClose }: FormsServicesProps) {
    const { getUserLocation } = useUserLocation();

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<{ url: string; isMain?: boolean }[]>(
        initialData?.imageUrls?.map(url => ({ url, isMain: false })) ||
        initialData?.files?.map(file => ({ url: file.fileUrl, isMain: false })) || []
    );
    const [tagInput, setTagInput] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
        initialData?.categoryIds ||
        initialData?.categories?.map((c) => c.id) ||
        ((initialData as any)?.categoryId ? [(initialData as any).categoryId] : [])
    );
    const [address, setAddress] = useState<string>("");

    const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            type: initialData?.type as ServiceType || ServiceType.DEPANNAGE,
            status: initialData?.status as ServiceStatus || ServiceStatus.AVAILABLE,
            price: initialData?.price || undefined,
            frais: initialData?.frais || undefined,
            reduction: initialData?.reduction || 0,
            tags: initialData?.tags || [],
            latitude: initialData?.latitude || undefined,
            longitude: initialData?.longitude || undefined,
            categoryIds: initialData?.categoryIds || initialData?.categories?.map((c) => c.id) || [],
        }
    });

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const response = await getForSelectCategories();
                setCategories(response?.data || []);
            } catch (error) {
                console.error("Erreur chargement catégories:", error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        setValue("categoryIds", selectedCategoryIds, { shouldValidate: true });
    }, [selectedCategoryIds, setValue]);

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

    const addTag = () => {
        if (tagInput.trim()) {
            const currentTags = watch("tags") || [];
            if (!currentTags.includes(tagInput.trim())) {
                setValue("tags", [...currentTags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const currentTags = watch("tags") || [];
        setValue("tags", currentTags.filter((tag: string) => tag !== tagToRemove));
    };

    const getCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const loc = await getUserLocation();
            if (loc && loc.lat !== null && loc.lng !== null) {
                setValue("latitude", loc.lat);
                setValue("longitude", loc.lng);
                setAddress(`${loc.city || ""}, ${loc.country || ""}`);
            }
        } catch (error) {
            console.error("Error getting location:", error);
        } finally {
            setLocationLoading(false);
        }
    };

    const onFormSubmit = async (formData: ServiceFormData) => {
        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'images' && key !== 'tags' && key !== 'categoryIds') {
                submitData.append(key, value.toString());
            }
        });
        if (formData.categoryIds) formData.categoryIds.forEach(id => submitData.append('categoryIds', id));
        if (formData.tags) formData.tags.forEach(tag => submitData.append('tags', tag));
        images.forEach((image) => { submitData.append('files', image); });
        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-20 scrollbar-hide">

                {/* Images Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6 ">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                            Photos du Service
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{existingImageUrls.length + images.length}/8</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        <label className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${(existingImageUrls.length + images.length) >= 8 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer border-primary/20'}`}>
                            <Icon icon="solar:camera-add-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] font-black text-muted-foreground mt-1 uppercase">Ajouter</span>
                            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} multiple disabled={(existingImageUrls.length + images.length) >= 8} className="hidden" />
                        </label>
                        {existingImageUrls.map((img, i) => (
                            <div key={`exist-${i}`} className="relative h-24 rounded-2xl overflow-hidden group shadow-md">
                                <Image src={img.url} alt="Service" fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(i, true)} className="bg-red-500 text-white rounded-xl p-2">
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {imagePreviews.map((preview, i) => (
                            <div key={`new-${i}`} className="relative h-24 rounded-2xl overflow-hidden group border-2 border-primary/30 shadow-md">
                                <Image src={preview} alt="New" fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(i, false)} className="bg-red-500 text-white rounded-xl p-2">
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
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Configuration</h3>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Titre du service</label>
                        <input {...register("title")} placeholder="Ex: Maintenance Climatisation" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Type de service</label>
                            <Select2 options={SERVICE_TYPE_OPTIONS} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} selectedItem={watch("type")} onSelectionChange={(v) => setValue("type", v as ServiceType)} placeholder="Choisir le type..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Statut</label>
                            <Select2 options={SERVICE_STATUS_OPTIONS} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} selectedItem={watch("status")} onSelectionChange={(v) => setValue("status", v as ServiceStatus)} placeholder="Statut..." />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Catégorie</label>
                        <Select2 options={categories} labelExtractor={(cat) => cat.label} valueExtractor={(cat) => cat.id} placeholder="Choisir des catégories..." mode="multiple" selectedItem={selectedCategoryIds} onSelectionChange={(v) => setSelectedCategoryIds(v as string[])} />
                        {errors.categoryIds && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.categoryIds.message}</p>}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Prix de base (FCFA)</label>
                            <input type="number" {...register("price", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Frais TP (FCFA)</label>
                            <input type="number" {...register("frais", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Réduction (%)</label>
                            <input type="number" {...register("reduction", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>
                    </div>
                </div>

                {/* Location & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-[2rem] border border-border p-6  space-y-4">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tight flex items-center justify-between">
                            Localisation
                            <button type="button" onClick={getCurrentLocation} className="text-primary hover:underline">{locationLoading ? '...' : 'Utiliser GPS'}</button>
                        </h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Icon icon="solar:map-point-bold-duotone" className="text-primary w-5 h-5" />
                            {address || "Non renseignée"}
                        </div>
                        {(errors.latitude || errors.longitude) && <p className="text-red-500 text-[10px] font-bold uppercase">Position requise</p>}
                    </div>

                    <div className="bg-card rounded-[2rem] border border-border p-6  space-y-4">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tight">Mots-clés / Tags</h3>
                        <div className="flex gap-2">
                            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Nouveau tag..." className="flex-1 h-10 px-3 rounded-xl border border-border bg-muted/30 text-xs font-bold outline-none" />
                            <button type="button" onClick={addTag} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center"><Icon icon="solar:add-circle-bold" /></button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(watch("tags") || []).map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg flex items-center gap-1">
                                    {tag}
                                    <Icon icon="solar:close-circle-bold" className="cursor-pointer" onClick={() => removeTag(tag)} />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6  space-y-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Description détaillée</h3>
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
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="animate-spin" /> : <><Icon icon="solar:check-circle-bold" /> {isEditMode ? 'Mettre à jour' : 'Publier le service'}</>}
                </button>
            </div>
        </form>
    );
}