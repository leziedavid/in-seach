"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { getForSelectCategories } from "@/api/api";
import { Select2 } from "@/components/ui/Select2";
import { Category, ServiceStatus, ServiceType, UserLocation } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import("@/components/ui/editor"), { ssr: false, loading: () => <div className="min-h-[200px] border rounded-lg animate-pulse bg-muted" /> });
const UserMap = dynamic(() => import("@/components/ui/Maps"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-40 bg-muted animate-pulse flex items-center justify-center rounded-2xl">
            <Icon icon="solar:map-bold-duotone" width={32} className="text-muted-foreground" />
        </div>
    ),
});
import { useTranslation } from "@/utils/langue/hooks";

const serviceSchema = (t: any) => z.object({
    title: z.string().min(3, t("akwaba.forms.service.errors.title_min")).max(100, t("akwaba.forms.service.errors.title_max")),
    description: z.string().min(10, t("akwaba.forms.service.errors.desc_min")).max(2000, t("akwaba.forms.service.errors.desc_max")),
    type: z.nativeEnum(ServiceType),
    status: z.nativeEnum(ServiceStatus),
    price: z.number().positive(t("akwaba.forms.service.errors.price_positive")).optional(),
    frais: z.number().nonnegative(t("akwaba.forms.service.errors.frais_positive")).optional(),
    reduction: z.number().min(0, t("akwaba.forms.service.errors.reduction_range")).max(100, t("akwaba.forms.service.errors.reduction_range")).optional(),
    tags: z.array(z.string()),
    latitude: z.number({ message: t("akwaba.forms.service.errors.location_required") }).refine(val => val !== 0, t("akwaba.forms.service.errors.location_placeholder")),
    longitude: z.number({ message: t("akwaba.forms.service.errors.location_required") }).refine(val => val !== 0, t("akwaba.forms.service.errors.location_placeholder")),
    categoryIds: z.array(z.string().uuid(t("akwaba.forms.service.errors.cat_required"))).min(1, t("akwaba.forms.service.errors.cat_required")),
    images: z.array(z.instanceof(File)).optional(),
});

export type ServiceFormData = z.infer<ReturnType<typeof serviceSchema>>;

interface FormsServicesProps {
    initialData?: Partial<ServiceFormData & { id?: string; imageUrls?: string[]; files?: any[]; categories?: any[] }>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function FormsServices({ initialData, onSubmit, isSubmitting = false, isEditMode = false, isOpen, onClose }: FormsServicesProps) {
    const { t } = useTranslation();
    const { getUserLocation } = useUserLocation();

    const SERVICE_TYPE_OPTIONS = [
        { id: ServiceType.DEPANNAGE, label: t("akwaba.forms.service.types.repair") },
        { id: ServiceType.VENTE, label: t("akwaba.forms.service.types.sale") },
        { id: ServiceType.LOCATION, label: t("akwaba.forms.service.types.rental") },
        { id: ServiceType.INSTALLATION, label: t("akwaba.forms.service.types.installation") },
        { id: ServiceType.CONSEIL, label: t("akwaba.forms.service.types.consulting") },
    ];

    const SERVICE_STATUS_OPTIONS = [
        { id: ServiceStatus.AVAILABLE, label: t("akwaba.forms.service.status.available") },
        { id: ServiceStatus.UNAVAILABLE, label: t("akwaba.forms.service.status.unavailable") },
        { id: ServiceStatus.PENDING, label: t("akwaba.forms.service.status.pending") },
    ];

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
        resolver: zodResolver(serviceSchema(t)),
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
                            {t("akwaba.forms.service.photos_title")}
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{existingImageUrls.length + images.length}/8</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        <label className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${(existingImageUrls.length + images.length) >= 8 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer border-primary/20'}`}>
                            <Icon icon="solar:camera-add-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] font-black text-muted-foreground mt-1 uppercase">{t("akwaba.forms.annonce.add_photo")}</span>
                            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} multiple disabled={(existingImageUrls.length + images.length) >= 8} className="hidden" />
                        </label>
                        {existingImageUrls.map((img, i) => (
                            <div key={`exist-${i}`} className="relative h-24 rounded-2xl overflow-hidden group shadow-md">
                                <Image
                                    src={img.url}
                                    alt="Service"
                                    fill
                                    className="object-cover"
                                    unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(i, true)} className="bg-red-500 text-white rounded-xl p-2">
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {imagePreviews.map((preview, i) => (
                            <div key={`new-${i}`} className="relative h-24 rounded-2xl overflow-hidden group border-2 border-primary/30 shadow-md">
                                <Image
                                    src={preview}
                                    alt="New"
                                    fill
                                    className="object-cover"
                                    unoptimized />
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
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.service.config_title")}</h3>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.service.title_label")}</label>
                        <input {...register("title")} placeholder={t("akwaba.forms.service.title_placeholder")} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.type")}</label>
                            <Select2 options={SERVICE_TYPE_OPTIONS} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} selectedItem={watch("type")} onSelectionChange={(v) => setValue("type", v as ServiceType)} placeholder={t("akwaba.forms.annonce.type_placeholder")} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.status_label")}</label>
                            <Select2 options={SERVICE_STATUS_OPTIONS} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} selectedItem={watch("status")} onSelectionChange={(v) => setValue("status", v as ServiceStatus)} placeholder={t("akwaba.forms.annonce.status_placeholder")} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.service.category")}</label>
                        <Select2 options={categories} labelExtractor={(cat) => cat.label} valueExtractor={(cat) => cat.id} placeholder={t("akwaba.forms.service.category_placeholder")} mode="multiple" selectedItem={selectedCategoryIds} onSelectionChange={(v) => setSelectedCategoryIds(v as string[])} />
                        {errors.categoryIds && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.categoryIds.message}</p>}
                    </div>
                </div>

                {/* Price Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6  space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Icon icon="solar:tag-price-bold-duotone" className="text-emerald-600 w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.finances")}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.service.price_label")}</label>
                            <input type="number" {...register("price", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.frais_label", "Frais TP (FCFA)")}</label>
                            <input type="number" {...register("frais", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.reduction_label", "Réduction (%)")}</label>
                            <input type="number" {...register("reduction", { valueAsNumber: true })} placeholder="0" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>
                    </div>
                </div>

                {/* Location & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-[2rem] border border-border p-6  space-y-4">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tight flex items-center justify-between">
                            {t("akwaba.forms.annonce.location_title")}
                            <button type="button" onClick={getCurrentLocation} disabled={locationLoading} className="text-primary hover:underline flex items-center gap-1 disabled:opacity-50">
                                {locationLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-3.5 h-3.5" /> : <Icon icon="solar:gps-bold-duotone" className="w-3.5 h-3.5" />}
                                {locationLoading ? '...' : t("akwaba.forms.annonce.location_gps")}
                            </button>
                        </h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Icon icon="solar:map-point-bold-duotone" className="text-primary w-5 h-5" />
                            {address || t("akwaba.forms.annonce.location_select")}
                        </div>
                        {!!watch("latitude") && !!watch("longitude") && (
                            <div className="rounded-2xl overflow-hidden h-40">
                                <UserMap lat={watch("latitude")!} lng={watch("longitude")!} userName={watch("title") || undefined} />
                            </div>
                        )}
                        {(errors.latitude || errors.longitude) && <p className="text-red-500 text-[10px] font-bold uppercase">{t("akwaba.forms.service.errors.location_required")}</p>}
                    </div>

                    <div className="bg-card rounded-[2rem] border border-border p-6  space-y-4">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.tags_title")}</h3>
                        <div className="flex gap-2">
                            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder={t("akwaba.forms.annonce.tag_placeholder")} className="flex-1 h-10 px-3 rounded-xl border border-border bg-muted/30 text-xs font-bold outline-none" />
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
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.service.description_title")}</h3>
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
                    {t("akwaba.forms.service.cancel")}
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all shadow-xl shadow-primary/20 h-12 flex-[2] flex items-center justify-center gap-2 uppercase tracking-widest">
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="animate-spin" /> : <><Icon icon="solar:check-circle-bold" /> {isEditMode ? t("akwaba.forms.service.submit_update") : t("akwaba.forms.service.submit_publish")}</>}
                </button>
            </div>
        </form>
    );
}