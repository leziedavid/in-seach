"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const techSchema = z.object({
    key: z.string().min(1, "La clé est obligatoire").max(50),
    category: z.string().optional(),
});

type TechFormData = z.infer<typeof techSchema>;

interface TechnicalSheetConfigFormProps {
    initialData?: { key: string; category?: string };
    onSubmit: (data: TechFormData) => Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function TechnicalSheetConfigForm({ initialData, onSubmit, isSubmitting, isEditing = false, onClose }: TechnicalSheetConfigFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<TechFormData>({
        resolver: zodResolver(techSchema),
        defaultValues: {
            key: initialData?.key || "",
            category: initialData?.category || "vehicle",
        },
    });

    const handleFormSubmit: SubmitHandler<TechFormData> = async (data) => {
        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom du champ (Clé)</label>
                        <input
                            {...register("key")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: Kilométrage, Surface, Marque..."
                        />
                        {errors.key && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.key.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Catégorie d'annonce</label>
                        <select
                            {...register("category")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium appearance-none"
                        >
                            <option value="vehicle">Véhicules</option>
                            <option value="real_estate">Immobilier</option>
                            <option value="other">Autre</option>
                        </select>
                        {errors.category && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.category.message}</p>}
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border flex items-center justify-end gap-3 rounded-b-xl">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2" >
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" /> : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                    {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}
