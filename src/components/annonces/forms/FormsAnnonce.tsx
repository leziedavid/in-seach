
"use client"

import { useForm, Controller } from "react-hook-form";
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { getForSelectCategorieAnnonces, getForSelectTypeAnnonces, getForSelectRealEstateOptions, getForSelectVehicleTypes, getForSelectEquipmentNames, } from "@/api/api";
import { Select2 } from "@/components/ui/Select2";
import { AnnonceStatus, TypeAnnonce, CategorieAnnonce, TechnicalSheet, Equipment } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import("@/components/ui/editor"), { ssr: false, loading: () => <div className="min-h-[200px] border rounded-lg animate-pulse bg-muted" /> });
import { useTranslation } from "@/utils/langue/hooks";

// ─── Pre-defined technical sheet fields ───────────────────────────────────────

type TechField = { key: string; options?: string[]; hideForTerrain?: boolean };

// ─── Zod schema ───────────────────────────────────────────────────────────────

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

const annonceSchema = (t: any) => z.object({
    title: z.string().min(3, t("akwaba.forms.annonce.errors.title_min")).max(100, t("akwaba.forms.annonce.errors.title_max")),
    description: z.string().refine(
        (val) => stripHtml(val).length >= 10,
        t("akwaba.forms.annonce.errors.desc_min")
    ),
    price: z.number().positive(t("akwaba.forms.annonce.errors.price_positive")).optional(),
    status: z.nativeEnum(AnnonceStatus),
    options: z.array(z.string()),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    typeId: z.string().optional(),
    categorieIds: z.array(z.string()).optional(),
    images: z.array(z.instanceof(File)).optional(),
    realEstateOptionId: z.string().optional().nullable(),
    vehicleTypeId: z.string().optional().nullable(),
});

export type AnnonceFormData = z.infer<ReturnType<typeof annonceSchema>>;

interface FormsAnnonceProps {
    initialData?: Partial<AnnonceFormData & {
        id?: string;
        imageUrls?: string[];
        files?: any[];
        categories?: any[];
        technicalSheets?: TechnicalSheet[];
        equipments?: Equipment[];
    }>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function FormsAnnonce({ initialData, onSubmit, isSubmitting = false, isEditMode = false, isOpen, onClose, }: FormsAnnonceProps) {
    const { t } = useTranslation();

    const IMMOBILIER_FIELDS: TechField[] = [
        { key: "akwaba.tech.fields.rooms", options: ["akwaba.tech.options.studio", "1", "2", "3", "4", "5+"], hideForTerrain: true },
        { key: "akwaba.tech.fields.furnishing", options: ["akwaba.tech.options.furnished", "akwaba.tech.options.unfurnished", "akwaba.tech.options.partial_furnished"], hideForTerrain: true },
        { key: "akwaba.tech.fields.property_type", options: ["akwaba.tech.options.villa", "akwaba.tech.options.duplex", "akwaba.tech.options.triplex", "akwaba.tech.options.house", "akwaba.tech.options.apartment", "akwaba.tech.options.studio", "akwaba.tech.options.terrain"] },
        { key: "akwaba.tech.fields.bedrooms", options: ["1", "2", "3", "4", "5", "6+"], hideForTerrain: true },
        { key: "akwaba.tech.fields.bathrooms", options: ["1", "2", "3", "4+"], hideForTerrain: true },
        { key: "akwaba.tech.fields.living_area" },
        { key: "akwaba.tech.fields.land_area" },
        { key: "akwaba.tech.fields.water", options: ["akwaba.tech.options.individual", "akwaba.tech.options.shared", "akwaba.tech.options.not_available"], hideForTerrain: true },
        { key: "akwaba.tech.fields.electricity", options: ["akwaba.tech.options.cie", "akwaba.tech.options.generator", "akwaba.tech.options.not_available"], hideForTerrain: true },
        { key: "akwaba.tech.fields.standing", options: ["akwaba.tech.options.standard", "akwaba.tech.options.mid_standing", "akwaba.tech.options.high_standing"], hideForTerrain: true },
    ];

    const VEHICULE_FIELDS: TechField[] = [
        { key: "akwaba.tech.fields.state", options: ["akwaba.tech.options.new", "akwaba.tech.options.very_good", "akwaba.tech.options.good", "akwaba.tech.options.correct", "akwaba.tech.options.to_review"] },
        { key: "akwaba.tech.fields.fuel", options: ["akwaba.tech.options.gasoline", "akwaba.tech.options.diesel", "akwaba.tech.options.hybrid", "akwaba.tech.options.electric", "akwaba.tech.options.lpg"] },
        { key: "akwaba.tech.fields.transmission", options: ["akwaba.tech.options.automatic", "akwaba.tech.options.manual"] },
        { key: "akwaba.tech.fields.color" },
        { key: "akwaba.tech.fields.model" },
    ];

    const { getUserLocation } = useUserLocation();

    // ── Select data ──────────────────────────────────────────────────────────
    const [categories, setCategories] = useState<CategorieAnnonce[]>([]);
    const [types, setTypes] = useState<TypeAnnonce[]>([]);
    const [reOptions, setReOptions] = useState<any[]>([]);
    const [vTypes, setVTypes] = useState<any[]>([]);
    const [equipmentNames, setEquipmentNames] = useState<string[]>([]);

    // ── Image management ─────────────────────────────────────────────────────
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<{ url: string }[]>(
        initialData?.imageUrls?.map(url => ({ url })) ||
        initialData?.files?.map(f => ({ url: f.fileUrl })) || []
    );

    // ── UI state ─────────────────────────────────────────────────────────────
    const [optionInput, setOptionInput] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);
    const [address, setAddress] = useState("");
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialData?.categorieIds || initialData?.categories?.map((c) => c.id) || []);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialData?.typeId || null);

    // ── Technical sheets — local state (key → value) ──────────────────────
    const [techValues, setTechValues] = useState<Record<string, string>>(() => {
        if (initialData?.technicalSheets) {
            return Object.fromEntries(initialData.technicalSheets.map(ts => [ts.key, ts.value]));
        }
        return {};
    });

    // ── Equipments — local state (name → isAvailable) ────────────────────
    const [equipmentState, setEquipmentState] = useState<Record<string, boolean>>(() => {
        if (initialData?.equipments) {
            return Object.fromEntries(initialData.equipments.map(eq => [eq.name, eq.isAvailable]));
        }
        return {};
    });

    const ANNONCE_STATUS_OPTIONS = [
        { id: AnnonceStatus.ACTIVE, label: t("akwaba.bookings.status.accepted") },
        { id: AnnonceStatus.DRAFT, label: t("akwaba.forms.annonce.status.draft") },
        { id: AnnonceStatus.SOLD, label: t("akwaba.forms.annonce.status.sold") },
        { id: AnnonceStatus.CANCELLED, label: t("akwaba.forms.annonce.status.cancelled") },
    ];

    const { register, handleSubmit, setValue, watch, control, reset, formState: { errors } } =
        useForm<AnnonceFormData>({
            resolver: zodResolver(annonceSchema(t)),
            defaultValues: {
                title: initialData?.title || "",
                description: initialData?.description || "",
                status: (initialData?.status as AnnonceStatus) || AnnonceStatus.ACTIVE,
                price: initialData?.price || undefined,
                options: initialData?.options || [],
                latitude: initialData?.latitude || undefined,
                longitude: initialData?.longitude || undefined,
                typeId: initialData?.typeId || "",
                categorieIds: initialData?.categorieIds || initialData?.categories?.map((c) => c.id) || [],
                realEstateOptionId: initialData?.realEstateOptionId || null,
                vehicleTypeId: initialData?.vehicleTypeId || null,
            },
        });

    // ── Sync form and local states when initialData changes (Edit Mode) ──
    const syncingInitialData = useRef(false);

    useEffect(() => {
        if (isEditMode && initialData) {
            syncingInitialData.current = true;
            const catIds = initialData.categorieIds || initialData.categories?.map((c) => c.id) || [];

            // 1. Reset React Hook Form
            reset({
                title: initialData.title || "",
                description: initialData.description || "",
                status: (initialData.status as AnnonceStatus) || AnnonceStatus.ACTIVE,
                price: initialData.price || undefined,
                options: initialData.options || [],
                latitude: initialData.latitude || undefined,
                longitude: initialData.longitude || undefined,
                typeId: initialData.typeId || "",
                categorieIds: catIds,
                realEstateOptionId: initialData.realEstateOptionId || null,
                vehicleTypeId: initialData.vehicleTypeId || null,
            });

            // 2. Sync local UI states
            setSelectedCategoryIds(catIds);
            setSelectedTypeId(initialData.typeId || null);

            // 3. Sync Technical Sheets
            if (initialData.technicalSheets) {
                const sheetMap = Object.fromEntries(initialData.technicalSheets.map(ts => [ts.key, ts.value]));
                setTechValues(sheetMap);
            }

            // 4. Sync Equipments
            if (initialData.equipments) {
                const existing = Object.fromEntries(initialData.equipments.map(eq => [eq.name, eq.isAvailable]));
                setEquipmentState(existing);
            }

            // 5. Sync Images
            setExistingImageUrls(
                initialData.imageUrls?.map(url => ({ url })) ||
                initialData.files?.map(f => ({ url: f.fileUrl })) || []
            );

            // Allow detection effects to stabilize, then release sync flag
            setTimeout(() => {
                syncingInitialData.current = false;
            }, 100);
        }
    }, [initialData, isEditMode, reset]);

    // ── Category helpers (slug & label based detection) ───────────────────────
    const selectedCats = (categories ?? []).filter(
        c => c?.id && Array.isArray(selectedCategoryIds) && selectedCategoryIds.includes(c.id)
    );
    const isImmobilier = selectedCats.some(
        c => c?.slug?.includes("immo") || c?.label?.toLowerCase()?.includes("immo") || c?.label?.toLowerCase()?.includes("immobilier")
    );
    const isVehicule = selectedCats.some(
        c => c?.slug?.includes("vehicule") || c?.slug?.includes("voiture") || c?.label?.toLowerCase()?.includes("véhicule") || c?.label?.toLowerCase()?.includes("voiture")
    );
    const realEstateOptionId = watch("realEstateOptionId");
    const selectedReOption = (reOptions ?? []).find(o => o?.id && o.id === realEstateOptionId);
    const isTerrain = isImmobilier && (selectedReOption?.name?.toLowerCase()?.trim() === "terrain");

    const currentTechFields: TechField[] = isImmobilier ? IMMOBILIER_FIELDS.filter(f => !isTerrain || !f.hideForTerrain) : isVehicule ? VEHICULE_FIELDS : [];

    // ── Smart category change cleanup ─────────────────────────────────────
    const isFirstRun = useRef(true);
    const prevCategoryKey = useRef<string>("");

    useEffect(() => {
        if (syncingInitialData.current) return; // Skip during sync

        if (isFirstRun.current) {
            isFirstRun.current = false;
            prevCategoryKey.current = isImmobilier ? "immobilier" : isVehicule ? "vehicule" : "";
            return;
        }

        const key = isImmobilier ? "immobilier" : isVehicule ? "vehicule" : "";
        if (key === prevCategoryKey.current) return;
        prevCategoryKey.current = key;

        // Reset tech state when actually changing category types
        setTechValues({});
        if (!isImmobilier) setValue("realEstateOptionId", null);
        if (!isVehicule) setValue("vehicleTypeId", null);
    }, [isImmobilier, isVehicule, setValue]);

    // ── Fetch all reference data ───────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesRes, typesRes, reRes, vRes, eqRes] = await Promise.all([
                    getForSelectCategorieAnnonces(),
                    getForSelectTypeAnnonces(),
                    getForSelectRealEstateOptions(),
                    getForSelectVehicleTypes(),
                    getForSelectEquipmentNames(),
                ]);
                setCategories(categoriesRes?.data || []);
                setTypes(typesRes?.data || []);
                setReOptions(reRes?.data?.data || []);
                setVTypes(vRes?.data || []);

                const names: string[] = (eqRes?.data || []).map((e: any) => e.name);
                setEquipmentNames(names);

                // Merging logic for equipments: full list from DB + status from initialData
                if (isEditMode && initialData?.equipments) {
                    const existing = Object.fromEntries(initialData.equipments.map(eq => [eq.name, eq.isAvailable]));
                    setEquipmentState(prev => {
                        const merged: Record<string, boolean> = { ...prev };
                        names.forEach(n => {
                            if (existing[n] !== undefined) merged[n] = existing[n];
                            else if (merged[n] === undefined) merged[n] = false;
                        });
                        return merged;
                    });
                } else if (!isEditMode && names.length > 0) {
                    setEquipmentState(prev => {
                        const init: Record<string, boolean> = { ...prev };
                        names.forEach(n => { if (init[n] === undefined) init[n] = false; });
                        return init;
                    });
                }
            } catch (error) {
                console.error("Erreur chargement données:", error);
            }
        };
        fetchData();
    }, [initialData, isEditMode]);

    useEffect(() => {
        if (!syncingInitialData.current) {
            setValue("categorieIds", selectedCategoryIds, { shouldValidate: true });
        }
    }, [selectedCategoryIds, setValue]);

    useEffect(() => {
        if (!syncingInitialData.current) {
            setValue("typeId", selectedTypeId ?? "", { shouldValidate: false });
        }
    }, [selectedTypeId, setValue]);

    // ── Image handlers ────────────────────────────────────────────────────────
    const handleImageUpload = (files: FileList) => {
        const newFiles = Array.from(files);
        if (existingImageUrls.length + images.length + newFiles.length > 8) return;
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

    // ── Options helpers ───────────────────────────────────────────────────────
    const addOption = () => {
        if (optionInput.trim()) {
            const current = watch("options") || [];
            if (!current.includes(optionInput.trim())) setValue("options", [...current, optionInput.trim()]);
            setOptionInput("");
        }
    };
    const removeOption = (opt: string) => {
        setValue("options", (watch("options") || []).filter((o: string) => o !== opt));
    };

    // ── Location ──────────────────────────────────────────────────────────────
    const getCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const loc = await getUserLocation();
            if (loc && loc.lat !== null && loc.lng !== null) {
                setValue("latitude", loc.lat);
                setValue("longitude", loc.lng);
                setAddress(`${loc.city || ""}, ${loc.country || ""}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLocationLoading(false);
        }
    };

    // ── Form submit ───────────────────────────────────────────────────────────
    const onFormSubmit = async (formData: AnnonceFormData) => {
        const finalTypeId = formData.typeId || selectedTypeId || "";
        const finalCategorieIds = (formData.categorieIds?.length ? formData.categorieIds : selectedCategoryIds) ?? [];

        const submitData = new FormData();
        const SKIP_KEYS = new Set(["images", "options", "categorieIds", "typeId", "realEstateOptionId", "vehicleTypeId"]);
        Object.entries(formData).forEach(([key, value]) => {
            if (!SKIP_KEYS.has(key) && value !== undefined && value !== null && value !== "") {
                submitData.append(key, value.toString());
            }
        });
        // UUID fields — only append when non-empty valid strings
        if (finalTypeId) submitData.append("typeId", finalTypeId);
        finalCategorieIds.forEach(id => submitData.append("categorieIds", id));
        if (formData.options) formData.options.forEach(opt => submitData.append("options", opt));
        const reId = formData.realEstateOptionId;
        if (reId) submitData.append("realEstateOptionId", reId);
        const vId = formData.vehicleTypeId;
        if (vId) submitData.append("vehicleTypeId", vId);

        // Technical sheets from local state (only non-empty values)
        const techArray = currentTechFields
            .filter(f => techValues[f.key]?.trim())
            .map(f => ({
                key: f.key,
                value: techValues[f.key],
                category: isImmobilier ? "real_estate" : isVehicule ? "vehicle" : "other",
            }));
        submitData.append("technicalSheets", JSON.stringify(techArray));

        // Equipments from local state (all names with their availability)
        const eqArray = equipmentNames.map(name => ({ name, isAvailable: equipmentState[name] ?? false }));
        if (eqArray.length > 0) submitData.append("equipments", JSON.stringify(eqArray));

        images.forEach(img => submitData.append("files", img));
        await onSubmit(submitData);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-20 scrollbar-hide">


                {/* ── Images ─────────────────────────────────────────────── */}
                <div className="bg-card rounded-[2rem] border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                            {t("akwaba.forms.annonce.photos_title")}
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t("akwaba.forms.annonce.max_photos", { count: existingImageUrls.length + images.length })}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        <label className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${(existingImageUrls.length + images.length) >= 8 ? "opacity-50 cursor-not-allowed" : "border-border hover:border-primary cursor-pointer border-primary/20"}`}>
                            <Icon icon="solar:camera-add-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] font-black text-muted-foreground mt-1 uppercase">{t("akwaba.forms.annonce.add_photo")}</span>
                            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} multiple disabled={(existingImageUrls.length + images.length) >= 8} className="hidden" />
                        </label>
                        {existingImageUrls.map((img, i) => (
                            <div key={`exist-${i}`} className="relative h-24 rounded-2xl overflow-hidden group shadow-md">
                                <Image src={img.url} alt="Annonce" fill className="object-cover" unoptimized />
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

                {/* ── Configuration ──────────────────────────────────────── */}
                <div className="bg-card rounded-[2rem] border border-border p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:info-square-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.config_title")}</h3>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.title_label")}</label>
                        <input {...register("title")} placeholder={t("akwaba.forms.annonce.title_placeholder")} className={`w-full h-12 px-4 rounded-xl border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm ${errors.title ? "border-red-500" : "border-border"}`} />
                        {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.category")}</label>
                            <Select2 options={categories} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} placeholder={t("akwaba.forms.annonce.category_placeholder")} mode="multiple" selectedItem={selectedCategoryIds} onSelectionChange={(v) => setSelectedCategoryIds(v as string[])} />
                            {errors.categorieIds && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.categorieIds.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.type")}</label>
                            <Select2 options={types} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} placeholder={t("akwaba.forms.annonce.type_placeholder")} mode="single" selectedItem={selectedTypeId} onSelectionChange={setSelectedTypeId} />
                            {errors.typeId && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.typeId.message}</p>}
                        </div>
                    </div>

                    {isImmobilier && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.real_estate_option")}</label>
                            <Select2 options={reOptions} labelExtractor={(o) => o.name} valueExtractor={(o) => o.id} placeholder={t("akwaba.forms.annonce.real_estate_placeholder")} mode="single" selectedItem={watch("realEstateOptionId") ?? null} onSelectionChange={(v) => setValue("realEstateOptionId", v as string)} />
                        </div>
                    )}

                    {isVehicule && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.vehicle_type")}</label>
                            <Select2 options={vTypes} labelExtractor={(o) => o.name} valueExtractor={(o) => o.id} placeholder={t("akwaba.forms.annonce.vehicle_type_placeholder")} mode="single" selectedItem={watch("vehicleTypeId") ?? null} onSelectionChange={(v) => setValue("vehicleTypeId", v as string)} />
                        </div>
                    )}
                </div>

                {/* ── Fiche Technique ────────────────────────────────────── */}
                <div className="bg-card rounded-[2rem] border border-border p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Icon icon="solar:document-list-bold-duotone" className="text-blue-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.tech_sheet_title")}</h3>
                            {isTerrain && (
                                <p className="text-[10px] font-bold text-amber-500 uppercase mt-0.5">{t("akwaba.forms.annonce.terrain_note")}</p>
                            )}
                        </div>
                    </div>

                    {currentTechFields.length === 0 ? (
                        <p className="text-[10px] font-bold text-muted-foreground uppercase text-center py-6 border-2 border-dashed border-border rounded-2xl">
                            {t("akwaba.forms.annonce.tech_sheet_empty")}
                        </p>
                    ) : (
                        <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
                            {currentTechFields.map((field) => (
                                <div key={field.key} className="flex items-center gap-4 px-4 py-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                                    <label className="text-sm text-muted-foreground font-medium w-44 flex-shrink-0">
                                        {t(field.key as any)}
                                    </label>
                                    {field.options ? (
                                        <select
                                            value={techValues[field.key] || ""}
                                            onChange={(e) => setTechValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            className="flex-1 h-9 px-3 rounded-xl border border-border bg-card text-sm font-bold outline-none focus:border-primary transition-all"
                                        >
                                            <option value="">{t("akwaba.forms.annonce.choose_option")}</option>
                                            {field.options.map(opt => (
                                                <option key={opt} value={opt}>{t(opt as any)}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={techValues[field.key] || ""}
                                            onChange={(e) => setTechValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            placeholder={t("akwaba.forms.annonce.enter_value")}
                                            className="flex-1 h-9 px-3 rounded-xl border border-border bg-card text-sm font-bold outline-none focus:border-primary transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Équipements & Commodités (immobilier non-terrain uniquement) ── */}
                {isImmobilier && !isTerrain && <div className="bg-card rounded-[2rem] border border-border p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Icon icon="solar:checklist-bold-duotone" className="text-purple-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.equipments_title")}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                                {t("akwaba.forms.annonce.equipments_selected", { count: Object.values(equipmentState).filter(Boolean).length })}
                            </p>
                        </div>
                    </div>

                    {equipmentNames.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 py-6 border-2 border-dashed border-border rounded-2xl">
                            <Icon icon="solar:refresh-bold-duotone" className="animate-spin text-muted-foreground w-4 h-4" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("akwaba.forms.annonce.loading_equipments")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {equipmentNames.map(name => {
                                const isOn = equipmentState[name] ?? false;
                                return (
                                    <button key={name} type="button" onClick={() => setEquipmentState(prev => ({ ...prev, [name]: !prev[name] }))} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isOn
                                        ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}  >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isOn ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"
                                            }`}>
                                            {isOn && <Icon icon="solar:check-bold" className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-xs font-bold transition-colors ${isOn ? "text-primary" : "text-muted-foreground"}`}>
                                            {name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>}

                {/* ── Prix & Statut ──────────────────────────────────────── */}
                <div className="bg-card rounded-[2rem] border border-border p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Icon icon="solar:tag-price-bold-duotone" className="text-orange-600 w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.finances")}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.price_label")}</label>
                            <input type="number" {...register("price", { setValueAs: (v) => v === "" || v === null ? undefined : Number(v) })} placeholder={t("akwaba.forms.annonce.price_placeholder")} className={`w-full h-12 px-4 rounded-xl border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm ${errors.price ? "border-red-500" : "border-border"}`} />
                            {errors.price && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.price.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">{t("akwaba.forms.annonce.status_label")}</label>
                            <Select2 options={ANNONCE_STATUS_OPTIONS} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} selectedItem={watch("status") ?? null} onSelectionChange={(v) => setValue("status", v as AnnonceStatus)} placeholder={t("akwaba.forms.annonce.status_placeholder")} />
                            {errors.status && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.status.message}</p>}
                        </div>
                    </div>
                </div>

                {/* ── Emplacement & Tags ─────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-[2rem] border border-border p-6 space-y-4">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tight flex items-center justify-between">
                            {t("akwaba.forms.annonce.location_title")}
                            <button type="button" onClick={getCurrentLocation} className="text-primary hover:underline">
                                {locationLoading ? "…" : t("akwaba.forms.annonce.location_gps")}
                            </button>
                        </h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Icon icon="solar:map-point-bold-duotone" className="text-primary w-5 h-5" />
                            {address || t("akwaba.forms.annonce.location_select")}
                        </div>
                    </div>

                    <div className="bg-card rounded-[2rem] border border-border p-6 space-y-4">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.tags_title")}</h3>
                        <div className="flex gap-2">
                            <input value={optionInput} onChange={(e) => setOptionInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addOption())} placeholder={t("akwaba.forms.annonce.tag_placeholder")} className="flex-1 h-10 px-3 rounded-xl border border-border bg-muted/30 text-xs font-bold outline-none" />
                            <button type="button" onClick={addOption} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <Icon icon="solar:add-circle-bold" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(watch("options") || []).map((opt: string) => (
                                <span key={opt} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg flex items-center gap-1">
                                    {opt}
                                    <Icon icon="solar:close-circle-bold" className="cursor-pointer" onClick={() => removeOption(opt)} />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Description ───────────────────────────────────────── */}
                <div className="bg-card rounded-[2rem] border border-border p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                            <Icon icon="solar:pen-new-square-bold-duotone" className="text-teal-600 w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t("akwaba.forms.annonce.description_title")}</h3>
                    </div>
                    <div className={`border rounded-2xl overflow-hidden min-h-[200px] ${errors.description ? "border-red-500" : "border-border"}`}>
                        <Controller name="description" control={control} render={({ field }) => (
                            <RichTextEditor content={field.value} onChange={field.onChange} editable={true} />
                        )} />
                    </div>
                    {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.description.message}</p>}
                </div>

            </div>

            {/* ── Actions ────────────────────────────────────────────────── */}
            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3 z-10">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider h-12 flex-1">
                    {t("akwaba.forms.annonce.cancel")}
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all shadow-xl shadow-primary/20 h-12 flex-[2] flex items-center justify-center gap-2 uppercase tracking-widest">
                    {isSubmitting
                        ? <Icon icon="solar:refresh-bold-duotone" className="animate-spin" />
                        : <><Icon icon="solar:check-circle-bold" /> {isEditMode ? t("akwaba.forms.annonce.submit_update") : t("akwaba.forms.annonce.submit_publish")}</>
                    }
                </button>
            </div>
        </form>
    );
}
