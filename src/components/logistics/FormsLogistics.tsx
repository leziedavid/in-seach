"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Select2 } from "../Forms/Select2";
import { TransportType } from "@/types/interface";
import RichTextEditor from "../rich-text-editor";

const logisticsSchema = z.object({
    label: z.string().min(3, "Le libellé doit contenir au moins 3 caractères").max(100, "Le libellé est trop long"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(2000, "Description trop longue"),
    transportType: z.nativeEnum(TransportType),
});

export type LogisticsFormData = z.infer<typeof logisticsSchema>;

interface FormsLogisticsProps {
    initialData?: Partial<LogisticsFormData & { id: string; images: any[] }>;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

const TRANSPORT_TYPE_OPTIONS = [
    { id: TransportType.MARITIME, label: "🚢 MARITIME" },
    { id: TransportType.AERIEN, label: "✈️ AÉRIEN" },
    { id: TransportType.HORS_GABARIT, label: "🚛 HORS GABARIT" },
    { id: TransportType.SANTE, label: "🚑 SANTÉ" },
    { id: TransportType.LOGISTIQUE_STOCKAGE, label: "🏬 STOCKAGE" },
    { id: TransportType.DOUANE, label: "👮 DOUANE" },
];

export default function FormsLogistics({ initialData, onSubmit, isSubmitting = false, isEditMode = false, isOpen, onClose }: FormsLogisticsProps) {
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<any[]>(initialData?.images || []);

    const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm<LogisticsFormData>({
        resolver: zodResolver(logisticsSchema),
        defaultValues: {
            label: initialData?.label || "",
            description: initialData?.description || "",
            transportType: initialData?.transportType as TransportType || TransportType.MARITIME,
        }
    });

    const handleImageUpload = (files: FileList) => {
        const newFiles = Array.from(files);
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
            setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setImages(prev => prev.filter((_, i) => i !== index));
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const onFormSubmit = async (values: LogisticsFormData) => {
        const submitData = new FormData();
        submitData.append('label', values.label);
        submitData.append('description', values.description);
        submitData.append('transportType', values.transportType);

        images.forEach((image) => {
            submitData.append('files', image);
        });

        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 flex flex-col h-full">

            <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-20 scrollbar-hide">

                {/* Images Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                            Photos du service
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{existingImages.length + images.length}/5</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        <label className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${(existingImages.length + images.length) >= 5 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer border-primary/20'}`}>
                            <Icon icon="solar:camera-add-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] font-black text-muted-foreground mt-1 uppercase">Ajouter</span>
                            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} multiple disabled={(existingImages.length + images.length) >= 5} className="hidden" />
                        </label>

                        {existingImages.map((img, i) => (
                            <div key={`exist-${i}`} className="relative h-24 rounded-2xl overflow-hidden group shadow-md">
                                <Image src={img.url} alt="Service" fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(i, true)} className="bg-red-500 text-white rounded-xl p-2 hover:scale-110 transition-transform">
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {imagePreviews.map((preview, i) => (
                            <div key={`new-${i}`} className="relative h-24 rounded-2xl overflow-hidden group border-2 border-primary/30 shadow-md">
                                <Image src={preview} alt="New" fill className="object-cover" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => removeImage(i, false)} className="bg-red-500 text-white rounded-xl p-2 hover:scale-110 transition-transform">
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5 font-black uppercase tracking-tighter">Nouveau</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:info-square-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Configuration du service</h3>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Libellé du service</label>
                        <input {...register("label")} placeholder="Ex: Livraison Express Maritime" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        {errors.label && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase">{errors.label.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Type de transport</label>
                        <Select2
                            options={TRANSPORT_TYPE_OPTIONS}
                            labelExtractor={(o) => o.label}
                            valueExtractor={(o) => o.id}
                            selectedItem={watch("transportType")}
                            onSelectionChange={(v) => setValue("transportType", v as TransportType)}
                            placeholder="Sélectionnez le type..."
                        />
                        {errors.transportType && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase">{errors.transportType.message}</p>}
                    </div>
                </div>

                {/* Description Section */}
                <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Description détaillée</h3>
                    </div>
                    <div className="border border-border rounded-2xl overflow-hidden min-h-[200px]">
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <RichTextEditor content={field.value} onChange={field.onChange} editable={true} />
                            )}
                        />
                    </div>
                    {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase">{errors.description.message}</p>}
                </div>

            </div>

            {/* Actions */}
            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3 z-10">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider flex-1 h-12">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest flex-[2] h-12">
                    {isSubmitting ? (
                        <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                            {isEditMode ? 'Mettre à jour le service' : 'Créer le service'}
                        </>
                    )}
                </button>
            </div>

        </form>
    );
}
