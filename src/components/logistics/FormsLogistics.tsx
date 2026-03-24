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
    { id: TransportType.MARITIME, label: "🚢 Maritime" },
    { id: TransportType.AERIEN, label: "✈️ Aérien" },
    { id: TransportType.HORS_GABARIT, label: "🚛 Hors Gabarit" },
    { id: TransportType.SANTE, label: "🚑 Santé" },
    { id: TransportType.LOGISTIQUE_STOCKAGE, label: "🏬 Stockage" },
    { id: TransportType.DOUANE, label: "👮 Douane" },
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

        // If we want to track deleted images, we could add that here
        // but for now let's keep it simple

        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 flex flex-col h-full">

            <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-20">

                {/* Images Section */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                        Images du service
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <label className="h-24 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors flex flex-col items-center justify-center bg-muted/50 group">
                            <Icon icon="solar:camera-add-bold-duotone" className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Ajouter</span>
                            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} multiple className="hidden" />
                        </label>

                        {existingImages.map((img, i) => (
                            <div key={`exist-${i}`} className="relative h-24 rounded-lg overflow-hidden group">
                                <Image src={img.url} alt="Service" fill className="object-cover" unoptimized />
                                <button type="button" onClick={() => removeImage(i, true)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon="solar:trash-bin-trash-bold" className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {imagePreviews.map((preview, i) => (
                            <div key={`new-${i}`} className="relative h-24 rounded-lg overflow-hidden group border border-primary/20">
                                <Image src={preview} alt="New" fill className="object-cover" unoptimized />
                                <button type="button" onClick={() => removeImage(i, false)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon="solar:trash-bin-trash-bold" className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5 font-bold uppercase">Nouveau</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <Icon icon="solar:info-square-bold-duotone" className="w-5 h-5 text-primary" />
                        Détails du service
                    </h3>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Libellé du service</label>
                        <input {...register("label")} placeholder="Ex: Livraison Express Maritime" className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium" />
                        {errors.label && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase">{errors.label.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type de transport</label>
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
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-primary" />
                        Description
                    </h3>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor content={field.value} onChange={field.onChange} editable={true} />
                        )}
                    />
                    {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase">{errors.description.message}</p>}
                </div>


            </div>

            {/* Actions */}
            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-all active:scale-95">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center gap-2">
                    {isSubmitting ? (
                        <>
                            <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" />
                            Enregistrement...
                        </>
                    ) : (
                        <>
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                            {isEditMode ? 'Mettre à jour' : 'Créer le service'}
                        </>
                    )}
                </button>
            </div>

        </form>
    );
}
