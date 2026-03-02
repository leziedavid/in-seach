"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { getForSelectCategories } from "@/api/api";
import { Select2 } from "./Select2"; // Import du composant Select2
import { Category, ServiceStatus, ServiceType, UserLocation } from "@/types/interface";
import { getUserLocation } from "@/utils/location";
import RichTextEditor from "../rich-text-editor";

// Schéma de validation Zod basé sur le DTO
const serviceSchema = z.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100, "Le titre est trop long"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(1000, "Description trop longue"),
    type: z.nativeEnum(ServiceType),
    status: z.nativeEnum(ServiceStatus),
    price: z.number().positive("Le prix doit être positif").optional(),
    frais: z.number().nonnegative("Les frais doivent être positifs").optional(),
    reduction: z.number().min(0, "La réduction ne peut pas être négative").max(100, "La réduction ne peut pas dépasser 100%").optional(),
    tags: z.array(z.string()),
    latitude: z.number(),
    longitude: z.number(),
    categoryId: z.string().uuid("Veuillez sélectionner une catégorie"),
    images: z.array(z.instanceof(File))
        .refine((files) =>
            files.every(file => ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)),
            { message: 'Les fichiers doivent être des images PNG ou JPEG.' }
        )
        .refine((files) =>
            files.every(file => file.size <= 5 * 1024 * 1024),
            { message: 'Chaque fichier ne doit pas dépasser 5 Mo.' }
        )
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

interface FormsServicesProps {
    initialData?: Partial<ServiceFormData & { id?: string; imageUrls?: string[]; files?: any[] }>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function FormsServices({ initialData, onSubmit, isSubmitting = false, isEditMode = false, isOpen, onClose }: FormsServicesProps) {

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<{ url: string; isMain?: boolean }[]>(initialData?.imageUrls?.map(url => ({ url, isMain: false })) || initialData?.files?.map(file => ({ url: file.url, isMain: false })) || []);
    const [tagInput, setTagInput] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialData?.categoryId || null);
    const [address, setAddress] = useState<string>("");
    const [location, setLocation] = useState<UserLocation | null>(null);

    // Track the last auto-filled title to distinguish between auto-updates and manual edits
    const autoTitleRef = React.useRef<string | null>(null);

    const SERVICE_TYPE_OPTIONS = [
        { id: ServiceType.DEPANNAGE, label: "🔧 Dépannage" },
        { id: ServiceType.VENTE, label: "🛒 Vente" },
        { id: ServiceType.LOCATION, label: "📦 Location" },
        { id: ServiceType.INSTALLATION, label: "⚙️ Installation" },
        { id: ServiceType.CONSEIL, label: "💡 Conseil" },
    ];

    const SERVICE_STATUS_OPTIONS = [
        { id: ServiceStatus.AVAILABLE, label: "✅ Disponible" },
        { id: ServiceStatus.UNAVAILABLE, label: "❌ Indisponible" },
        { id: ServiceStatus.PENDING, label: "⏳ En attente" },
    ];


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
            latitude: initialData?.latitude || 48.8566,
            longitude: initialData?.longitude || 2.3522,
            categoryId: initialData?.categoryId || "",
            images: [],
        }
    });

    // Charger les catégories
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const response = await getForSelectCategories();
                const categoriesData = response?.data || [];
                setCategories(categoriesData);
            } catch (error) {
                console.error("Erreur chargement catégories:", error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // Mettre à jour categoryId dans le formulaire quand selectedCategoryId change
    // Et pré-remplir le titre lors de la création
    useEffect(() => {
        if (selectedCategoryId) {
            setValue("categoryId", selectedCategoryId, { shouldValidate: true });

            if (!isEditMode) {
                const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
                if (selectedCategory) {
                    const currentTitle = watch("title");
                    // On met à jour le titre uniquement s'il est vide ou s'il correspond au dernier titre auto-généré
                    if (!currentTitle || currentTitle === autoTitleRef.current) {
                        setValue("title", selectedCategory.label, { shouldValidate: true });
                        autoTitleRef.current = selectedCategory.label;
                    }
                }
            }
        }
    }, [selectedCategoryId, setValue, categories, isEditMode, watch]);

    // Gestion des images - Upload
    const handleImageUpload = (files: FileList) => {
        const newFiles = Array.from(files);
        const totalImages = existingImageUrls.length + images.length;
        if (totalImages + newFiles.length > 8) {
            alert("Vous ne pouvez pas ajouter plus de 8 images au total");
            return;
        }

        setImages(prev => [...prev, ...newFiles]);

        // Créer les prévisualisations
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    // Supprimer une image
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

    // Gestion des tags
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

    // Géolocalisation
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


    // Submit handler - prépare FormData pour l'envoi
    const onFormSubmit = async (formData: ServiceFormData) => {
        const submitData = new FormData();

        // Ajouter les champs texte
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'tags' && Array.isArray(value)) {
                    submitData.append(key, JSON.stringify(value));
                } else if (typeof value === 'boolean') {
                    submitData.append(key, String(value));
                } else if (typeof value === 'number') {
                    submitData.append(key, value.toString());
                } else {
                    submitData.append(key, value as string);
                }
            }
        });

        // Ajouter les nouvelles images
        images.forEach((image) => {
            submitData.append('images', image);
        });

        // Ajouter les URLs des images existantes à conserver
        // if (existingImageUrls.length > 0) {
        //     submitData.append('existingImageUrls', JSON.stringify(
        //         existingImageUrls.map(img => img.url)
        //     ));
        // }

        await onSubmit(submitData);
    };

    const watchTags = watch("tags") || [];
    const totalImages = existingImageUrls.length + images.length;

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="px-4 space-y-8">


                {/* Images Section - Selon votre modèle */}
                <div className="bg-card rounded-xl border border-border p-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Icon icon="solar:upload-bold-duotone" className="w-5 h-5" />
                            Images du service
                            {!isEditMode && <span className="text-red-500">*</span>}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                            {totalImages}/8 images
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                        {/* Upload Button */}
                        <label className={`relative h-32 rounded-lg border-2 border-dashed ${totalImages >= 8 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer'} transition-colors flex flex-col items-center justify-center bg-muted`}>
                            <Icon icon="solar:upload-bold-duotone" className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Ajouter une image</span>
                            <span className="text-xs text-muted-foreground/60 mt-1">JPG, PNG</span>
                            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} disabled={totalImages >= 8} multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                        </label>

                        {/* Images existantes */}
                        {existingImageUrls.map((image, index) => (
                            <div key={`existing-${index}`} className="relative h-32 rounded-lg overflow-hidden group">
                                <Image
                                    src={(image.url && image.url !== "") ? image.url : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'}
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

                        {/* Nouvelles images */}
                        {imagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="relative h-32 rounded-lg overflow-hidden group">
                                <Image
                                    src={(preview && preview !== "") ? preview : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'}
                                    alt={`Nouvelle image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index, false)}
                                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                                    Nouvelle image {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>

                    {errors.images && (
                        <p className="text-red-500 text-sm mt-2">{errors.images.message}</p>
                    )}
                    {!isEditMode && totalImages === 0 && (
                        <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
                            <Icon icon="solar:danger-bold-duotone" className="w-4 h-4" />
                            * Au moins une image est requise lors de la création
                        </p>
                    )}
                </div>

                {/* Informations principales */}
                <div className="bg-card rounded-xl border border-border p-2 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                            <Icon icon="solar:stars-bold-duotone" className="text-secondary w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">Informations générales</h3>
                    </div>

                    {/* Catégorie avec Select2 */}
                    <div className="bg-card rounded-xl border border-border p-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Icon icon="solar:tag-bold-duotone" className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground">Catégorie</h3>
                                <p className="text-xs text-muted-foreground">Sélectionnez la catégorie principale</p>
                            </div>
                        </div>


                        {isLoadingCategories ? (
                            <div className="flex items-center justify-center py-8">
                                <Icon icon="solar:refresh-bold-duotone" className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Select2<Category>
                                options={categories}
                                labelExtractor={(cat) => cat.label}
                                valueExtractor={(cat) => cat.id}
                                placeholder="Choisir une catégorie..."
                                mode="single"
                                selectedItem={selectedCategoryId}
                                onSelectionChange={setSelectedCategoryId}
                            />
                        )}

                        {errors.categoryId && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-2">
                                <Icon icon="solar:danger-bold-duotone" className="w-3 h-3" />
                                {errors.categoryId.message}
                            </p>
                        )}
                    </div>


                    {/* Titre */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-foreground flex items-center gap-2">
                            Titre du service
                            <span className="text-red-500">*</span>
                        </label>

                        <input type="text"  {...register("title")} placeholder="ex: Plomberie - Intervention rapide"
                            className={`w-full px-3 py-2 rounded-sm border ${errors.title ? 'border-red-500 bg-destructive/10' : 'border-border'}
                            bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground`}
                            inputMode={'text'}
                            style={{ fontSize: '16px' }}
                            suppressHydrationWarning
                        />

                        {!isEditMode && (
                            <p className="text-[11px] text-amber-600/80 font-medium mt-1.5 flex items-start gap-1.5 px-0.5 leading-relaxed">
                                <Icon icon="solar:info-circle-bold-duotone" className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>Laisser le titre par défaut (nom de la catégorie) permet à votre service d'être mieux référencé et trouvé plus facilement.</span>
                            </p>
                        )}

                        {errors.title && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                                <Icon icon="solar:danger-bold-duotone" className="w-3 h-3" />
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    {/* Prix et réduction */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Prix */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-foreground flex items-center gap-1">
                                <Icon icon="solar:wad-of-money-bold-duotone" className="w-3 h-3" />
                                Prix (CFA) à partie de ...
                            </label>

                            <div className="relative">
                                <input type="number"  {...register("price", { valueAsNumber: true })} placeholder="5000"
                                    className="w-full px-3 py-2 pl-9 rounded-sm border border-border bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground"
                                    inputMode={'numeric'}
                                    style={{ fontSize: '16px' }}
                                    suppressHydrationWarning
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Icon icon="solar:wad-of-money-bold-duotone" className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>


                        {/* Réduction */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-foreground flex items-center gap-1">
                                <Icon icon="solar:sale-bold-duotone" className="w-3 h-3" />
                                Réduction (%)
                            </label>

                            <input type="number" {...register("reduction", { valueAsNumber: true })}
                                placeholder="10"
                                className="w-full px-3 py-2 rounded-sm border border-border bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground"
                                inputMode={'numeric'}
                                style={{ fontSize: '16px' }}
                                suppressHydrationWarning
                            />
                        </div>


                        {/* Frais Estimatif */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-foreground flex items-center gap-1">
                                <Icon icon="solar:wad-of-money-bold-duotone" className="w-3 h-3" />
                                Frais  de service (TP) estimatif (CFA)
                            </label>

                            <div className="relative">
                                <input type="number" {...register("frais", { valueAsNumber: true })} placeholder="4500"
                                    className="w-full px-3 py-2 pl-9 rounded-sm border border-border bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground"
                                    inputMode={'numeric'}
                                    style={{ fontSize: '16px' }}
                                    suppressHydrationWarning
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Icon icon="solar:wad-of-money-bold-duotone" className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            {errors.frais && <p className="text-xs text-red-500 mt-1">{errors.frais.message}</p>}
                        </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-foreground">Type de service</label>
                            <Select2<{ id: ServiceType; label: string }>
                                options={SERVICE_TYPE_OPTIONS}
                                labelExtractor={(o) => o.label}
                                valueExtractor={(o) => o.id}
                                placeholder="Type de service"
                                mode="single"
                                selectedItem={watch("type")}
                                onSelectionChange={(v) => setValue("type", v as ServiceType)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-foreground">Statut</label>
                            <Select2<{ id: ServiceStatus; label: string }>
                                options={SERVICE_STATUS_OPTIONS}
                                labelExtractor={(o) => o.label}
                                valueExtractor={(o) => o.id}
                                placeholder="Statut"
                                mode="single"
                                selectedItem={watch("status")}
                                onSelectionChange={(v) => setValue("status", v as ServiceStatus)}
                            />
                        </div>
                    </div>

                </div>

                {/* Tags */}
                <div className="bg-card rounded-xl border border-border p-2 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Icon icon="solar:tag-bold-duotone" className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Tags</h3>
                            <p className="text-xs text-muted-foreground">Mots-clés pour améliorer la recherche</p>
                        </div>
                    </div>


                    <div className="flex flex-wrap gap-2 mb-3">
                        {watchTags.map((tag: string, index: number) => (
                            <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-sm text-xs font-bold text-muted-foreground" >
                                #{tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors"  >
                                    <Icon icon="solar:close-circle-bold-duotone" className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>


                    <div className="flex gap-2">
                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="Ajouter un tag (ex: urgent, premium...)"
                            className="flex-1 px-3 py-2 rounded-sm border border-border bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground"
                            inputMode={'text'}
                            style={{ fontSize: '16px' }}
                            suppressHydrationWarning
                        />
                        <button type="button" onClick={addTag} aria-label="Ajouter" className="px-5 bg-primary text-white rounded-sm text-sm font-black hover:bg-secondary transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Icon icon="solar:plus-circle-bold-duotone" className="w-4.5 h-4.5" />
                            <span>Ajouter</span>
                        </button>
                    </div>

                </div>

                {/* Localisation */}
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
                    {/* Header : icône + titre + bouton */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Icon icon="solar:map-point-bold-duotone" className="text-green-600 dark:text-green-400 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground">Localisation</h3>
                                <p className="text-xs text-muted-foreground">Coordonnées GPS du service</p>
                            </div>
                        </div>


                        {/* Bouton responsive */}
                        <button type="button" onClick={getCurrentLocation} disabled={locationLoading} className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-xs sm:text-sm font-black hover:bg-green-500/20 transition-all active:scale-95 w-full sm:w-auto" >
                            {locationLoading ? (
                                <Icon icon="solar:refresh-bold-duotone" className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Icon icon="solar:map-point-bold-duotone" className="w-3.5 h-3.5" />
                            )}
                            <span className="truncate">Utiliser ma position</span>
                        </button>

                    </div>

                    {/* Inputs Latitude / Longitude */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-foreground mb-2 block">Latitude</label>
                            <input type="number" step="any" readOnly {...register("latitude", { valueAsNumber: true })}
                                className="w-full p-3 rounded-sm border-2 border-border bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground"
                                inputMode={'numeric'}
                                style={{ fontSize: '16px' }}
                                suppressHydrationWarning
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-foreground mb-2 block">Longitude</label>
                            <input type="number" step="any" readOnly {...register("longitude", { valueAsNumber: true })}
                                className="w-full p-3 rounded-sm border-2 border-border bg-muted outline-none focus:border-primary transition-all text-sm font-medium text-foreground"
                                inputMode={'numeric'}
                                style={{ fontSize: '16px' }}
                                suppressHydrationWarning />
                        </div>

                    </div>

                    {address && (
                        <div className="mb-8 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2 md:mb-8 md:px-4 md:py-2">
                            <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm text-foreground/80 md:text-sm">{address}</span>
                        </div>
                    )}
                </div>


                <div className="bg-card">
                    <div>
                        <label className="text-xs font-black text-foreground flex items-center gap-2">
                            Description détaillée
                            <span className="text-red-500">*</span>
                        </label>

                        <Controller name="description" control={control} render={({ field }: { field: any }) => (<RichTextEditor content={field.value || ""} onChange={field.onChange} editable={true} />)} />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                        )}
                    </div>
                </div>
            </div>
            {/* Bouton de soumission */}

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

        </form>
    );

}