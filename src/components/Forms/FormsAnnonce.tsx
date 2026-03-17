"use client";

import { useForm, Controller } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { getForSelectCategorieAnnonces, getForSelectTypeAnnonces } from "@/api/api";
import { Select2 } from "./Select2";
import { AnnonceStatus, TypeAnnonce, CategorieAnnonce, UserLocation } from "@/types/interface";
import { getUserLocation } from "@/utils/location";
import RichTextEditor from "../rich-text-editor";

// Schéma de validation Zod basé sur le modèle Annonce
const annonceSchema = z.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100, "Le titre est trop long"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(1000, "Description trop longue"),
    price: z.number().positive("Le prix doit être positif").optional(),
    status: z.nativeEnum(AnnonceStatus),
    options: z.array(z.string()),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    typeId: z.string().uuid("Veuillez sélectionner un type d'annonce"),
    categorieId: z.string().uuid("Veuillez sélectionner une catégorie"),
    images: z.array(z.instanceof(File)).refine((files) => files.every(file => ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)), { message: 'Les fichiers doivent être des images PNG ou JPEG.' }).refine((files) => files.every(file => file.size <= 5 * 1024 * 1024), { message: 'Chaque fichier ne doit pas dépasser 5 Mo.' })
});

export type AnnonceFormData = z.infer<typeof annonceSchema>;

interface FormsAnnonceProps {
    initialData?: Partial<AnnonceFormData & { id?: string; imageUrls?: string[]; files?: any[] }>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function FormsAnnonce({ initialData, onSubmit, isSubmitting = false, isEditMode = false, isOpen, onClose }: FormsAnnonceProps) {

    const [categories, setCategories] = useState<CategorieAnnonce[]>([]);
    const [types, setTypes] = useState<TypeAnnonce[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<{ url: string; isMain?: boolean }[]>(
        initialData?.imageUrls?.map(url => ({ url, isMain: false })) ||
        initialData?.files?.map(file => ({ url: file.fileUrl, isMain: false })) || []
    );
    const [optionInput, setOptionInput] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialData?.categorieId || null);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialData?.typeId || null);
    const [address, setAddress] = useState<string>("");
    const [location, setLocation] = useState<UserLocation | null>(null);

    const ANNONCE_STATUS_OPTIONS = [
        { id: AnnonceStatus.ACTIVE, label: "✅ Active" },
        { id: AnnonceStatus.DRAFT, label: "📝 Brouillon" },
        { id: AnnonceStatus.SOLD, label: "💰 Vendu" },
        { id: AnnonceStatus.CANCELLED, label: "❌ Annulée" },
    ];

    const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm<AnnonceFormData>({
        resolver: zodResolver(annonceSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            status: initialData?.status as AnnonceStatus || AnnonceStatus.ACTIVE,
            price: initialData?.price || undefined,
            options: initialData?.options || [],
            latitude: initialData?.latitude || 6.3654, // Default Cotonou
            longitude: initialData?.longitude || 2.4183,
            typeId: initialData?.typeId || "",
            categorieId: initialData?.categorieId || "",
            images: [],
        }
    });

    // Charger les catégories et les types
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingCategories(true);
            setIsLoadingTypes(true);
            try {
                const [categoriesRes, typesRes] = await Promise.all([
                    getForSelectCategorieAnnonces(),
                    getForSelectTypeAnnonces()
                ]);
                setCategories(categoriesRes?.data || []);
                setTypes(typesRes?.data || []);
            } catch (error) {
                console.error("Erreur chargement données:", error);
            } finally {
                setIsLoadingCategories(false);
                setIsLoadingTypes(false);
            }
        };
        fetchData();
    }, []);

    // Sync select fields with form state
    useEffect(() => {
        if (selectedCategoryId) setValue("categorieId", selectedCategoryId, { shouldValidate: true });
    }, [selectedCategoryId, setValue]);

    useEffect(() => {
        if (selectedTypeId) setValue("typeId", selectedTypeId, { shouldValidate: true });
    }, [selectedTypeId, setValue]);

    // Images management
    const handleImageUpload = (files: FileList) => {
        const newFiles = Array.from(files);
        const totalImagesCount = existingImageUrls.length + images.length;
        if (totalImagesCount + newFiles.length > 8) {
            alert("Vous ne pouvez pas ajouter plus de 8 images");
            return;
        }

        setImages(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreviews(prev => [...prev, e.target?.result as string]);
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

    // Définir comme image principale
    const setAsMainImage = (index: number, isExisting: boolean) => {
        if (isExisting) {
            setExistingImageUrls(prev => prev.map((img, i) => ({
                ...img,
                isMain: i === index
            })));
        }
    };

    // Options (Tags) management
    const addOption = () => {
        if (optionInput.trim()) {
            const currentOptions = watch("options") || [];
            if (!currentOptions.includes(optionInput.trim())) {
                setValue("options", [...currentOptions, optionInput.trim()]);
            }
            setOptionInput("");
        }
    };

    const removeOption = (optionToRemove: string) => {
        const currentOptions = watch("options") || [];
        setValue("options", currentOptions.filter((opt: string) => opt !== optionToRemove));
    };

    // Location
    const getCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const loc = await getUserLocation();
            if (loc && loc.lat !== null && loc.lng !== null) {
                setLocation(loc);
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

    const onFormSubmit = async (formData: AnnonceFormData) => {
        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'images' && key !== 'options') {
                if (typeof value === 'boolean') {
                    submitData.append(key, String(value));
                } else if (typeof value === 'number') {
                    submitData.append(key, value.toString());
                } else {
                    submitData.append(key, value as string);
                }
            }
        });

        // Append options individually
        if (formData.options && Array.isArray(formData.options)) {
            formData.options.forEach(option => submitData.append('options', option));
        }

        images.forEach(image => submitData.append('files', image));
        if (existingImageUrls.length > 0) {
            submitData.append('existingImageUrls', JSON.stringify(existingImageUrls.map(img => img.url)));
        }

        await onSubmit(submitData);
    };

    const watchOptions = watch("options") || [];
    const totalImages = existingImageUrls.length + images.length;

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">

            <div className="px-4 space-y-8">
                {/* <pre>{JSON.stringify(initialData, null, 2)}</pre> */}

                {/* Images Section */}
                <div className="bg-card rounded-xl border border-border p-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Icon icon="solar:upload-bold-duotone" className="w-5 h-5" />
                            Images de l'annonce
                            {!isEditMode && <span className="text-red-500">*</span>}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                            {totalImages}/8 images
                        </span>
                    </div>


                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                        <label className={`relative h-32 rounded-lg border-2 border-dashed ${totalImages >= 8 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer'} transition-colors flex flex-col items-center justify-center bg-muted`}>
                            <Icon icon="solar:upload-bold-duotone" className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Ajouter une image</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                                disabled={totalImages >= 8}
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                        </label>


                        {existingImageUrls.map((image, index) => (
                            <div key={`existing-${index}`} className="relative h-32 rounded-lg overflow-hidden group">
                                <Image
                                    src={(image.url && image.url !== "")
                                        ? image.url
                                        : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'}
                                    alt={`Image existante ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                    unoptimized
                                />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAsMainImage(index, true)}
                                        className="bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-colors"
                                        title="Définir comme image principale"
                                    >
                                        <Icon icon="solar:star-bold-duotone" className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index, true)}
                                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
                                    </button>
                                </div>

                                {image.isMain ? (
                                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Icon icon="solar:star-bold-duotone" className="w-3 h-3 fill-white" />
                                        Principale
                                    </div>
                                ) : index === 0 && existingImageUrls.length > 0 && !existingImageUrls.some(img => img.isMain) ? (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                                        Image {index + 1}
                                    </div>
                                ) : null}
                            </div>
                        ))}

                        {imagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="relative h-32 rounded-lg overflow-hidden group">
                                <Image src={(preview && preview !== "") ? preview : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={`Nouvelle ${index}`} fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(index, false)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors">
                                        <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images.message}</p>}
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card rounded-xl border border-border p-2 ">
                    <div className="space-y-1">
                        <label className="text-xs font-black text-foreground">Catégorie</label>
                        <Select2<CategorieAnnonce>
                            options={categories}
                            labelExtractor={(o) => o.label}
                            valueExtractor={(o) => o.id}
                            placeholder="Choisir une catégorie"
                            mode="single"
                            selectedItem={selectedCategoryId}
                            onSelectionChange={setSelectedCategoryId}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-black text-foreground">Type d'annonce</label>
                        <Select2<TypeAnnonce>
                            options={types}
                            labelExtractor={(o) => o.label}
                            valueExtractor={(o) => o.id}
                            placeholder="Type d'annonce"
                            mode="single"
                            selectedItem={selectedTypeId}
                            onSelectionChange={setSelectedTypeId}
                        />
                    </div>
                </div>


                {/* Informations principales */}
                <div className="bg-card rounded-xl border border-border p-2 ">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                            <Icon icon="solar:stars-bold-duotone" className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">Détails de l'annonce</h3>
                    </div>


                    <div className="space-y-1">
                        <label className="text-xs font-black text-foreground">Titre</label>
                        <input type="text" {...register("title")} placeholder="ex: iPhone 15 Pro Max - État neuf"
                            className={`w-full px-3 py-2 rounded-sm border ${errors.title ? 'border-red-500 bg-destructive/10' : 'border-border'} bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground`}
                            inputMode={'text'}
                            style={{ fontSize: '16px' }}
                            suppressHydrationWarning
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-foreground">Prix (CFA)</label>
                            <div className="relative">
                                <input type="number" {...register("price", { valueAsNumber: true })} placeholder="Prix de vente"
                                    className="w-full px-3 py-2 pl-9 rounded-sm border border-border bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground"
                                    inputMode={'numeric'}
                                    style={{ fontSize: '16px' }}
                                    suppressHydrationWarning
                                />
                                <Icon icon="solar:wad-of-money-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                            </div>
                            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                        </div>


                        <div className="space-y-1">
                            <label className="text-xs font-black text-foreground">Statut</label>
                            <Select2<{ id: AnnonceStatus; label: string }>
                                options={ANNONCE_STATUS_OPTIONS}
                                labelExtractor={(o) => o.label}
                                valueExtractor={(o) => o.id}
                                placeholder="Statut"
                                mode="single"
                                selectedItem={watch("status")}
                                onSelectionChange={(v) => setValue("status", v as AnnonceStatus)}
                            />
                        </div>

                    </div>

                </div>

                {/* Options / Caractéristiques */}
                <div className="bg-card rounded-xl border border-border p-2 ">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <Icon icon="solar:tag-bold-duotone" className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Options & Caractéristiques</h3>
                            <p className="text-xs text-muted-foreground">Ex: Wifi, Parking, Climatisation, Neuf...</p>
                        </div>
                    </div>


                    <div className="flex flex-wrap gap-2 mb-3">
                        {watchOptions.map((opt: string, index: number) => (
                            <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-sm text-xs font-bold text-muted-foreground">
                                {opt}
                                <button type="button" onClick={() => removeOption(opt)} className="hover:text-destructive text-muted-foreground">
                                    <Icon icon="solar:close-circle-bold-duotone" className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>


                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                            placeholder="Ajouter une option..."
                            className="flex-1 px-3 py-2 rounded-sm border border-border bg-muted outline-none focus:border-primary text-sm font-medium text-foreground"
                            inputMode={'text'}
                            style={{ fontSize: '16px' }}
                            suppressHydrationWarning
                        />

                        <button type="button" onClick={addOption} className="px-6 bg-primary text-white rounded-sm text-sm font-black hover:bg-secondary transition-all flex items-center gap-2">
                            <Icon icon="solar:plus-circle-bold-duotone" className="w-4.5 h-4.5" />
                            Ajouter
                        </button>
                    </div>
                </div>

                {/* Localisation */}
                <div className="bg-card rounded-xl border border-border p-2 ">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                                <Icon icon="solar:map-point-bold-duotone" className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-foreground">Localisation</h3>
                        </div>

                        <button type="button" onClick={getCurrentLocation} disabled={locationLoading} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-sm font-black hover:bg-green-500/20">
                            {locationLoading ? <Icon icon="solar:refresh-bold-duotone" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="solar:map-point-bold-duotone" className="w-3.5 h-3.5" />}
                            Utiliser ma position
                        </button>

                    </div>
                    {address && <p className="text-xs text-muted-foreground font-bold ml-1">{address}</p>}

                </div>

                {/* Description */}
                <div className="bg-card rounded-xl border border-border p-2">
                    <label className="text-xs font-black text-foreground mb-3 block">Description détaillée</label>

                    <Controller name="description" control={control} render={({ field }: { field: any }) => (
                        <RichTextEditor content={field.value || ""} onChange={field.onChange} editable={true} />
                    )} />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/95 p-2 md:p-6  mt-8 h-full">
                    <div className="flex items-center justify-end gap-4">
                        {/* add onClose button */}
                        <button type="button" onClick={onClose} className="bg-red-500 flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto px-0 sm:px-6 py-3 rounded-xl border-2 border-border text-muted-foreground hover:bg-red-600 transition-all active:scale-95" title="Fermer" >
                            <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5 sm:hidden text-white" /> {/* Icône visible sur mobile */}
                            <span className="hidden sm:inline font-black text-sm text-white">Fermer</span> {/* Texte visible sur sm+ */}
                        </button>

                        {/* Bouton Réinitialiser avec icône */}
                        <button type="button" onClick={() => reset()} className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto px-0 sm:px-6 py-3 rounded-xl border-2 border-border text-muted-foreground hover:bg-muted transition-all active:scale-95" title="Réinitialiser" >
                            <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 sm:hidden" /> {/* Icône visible sur mobile */}
                            <span className="hidden sm:inline font-black text-sm">Réinitialiser</span> {/* Texte visible sur sm+ */}
                        </button>

                        {/* Bouton Soumettre */}
                        <button type="submit" disabled={isSubmitting || (!isEditMode && totalImages === 0)} className="flex items-center justify-center gap-2 sm:gap-3 px-6 py-3 bg-primary text-white rounded-xl text-sm font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-primary/25" >
                            {isSubmitting ? (
                                <>
                                    <Icon icon="solar:refresh-bold-duotone" className="w-4.5 h-4.5 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Icon icon="solar:check-circle-bold-duotone" className="w-4.5 h-4.5" />
                                    {isEditMode ? 'Mettre à jour' : 'Publier le service'}
                                </>
                            )}
                        </button>

                    </div>
                </div>

            </div>

        </form>
    );
}
