"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TypeAnnonce } from "@/types/interface";

const typeSchema = z.object({
    label: z.string().min(2, "Le nom est trop court (min 2 caractères)").max(50, "Le nom est trop long"),
    slug: z.string().min(2, "Le slug est trop court").toLowerCase(),
});

type TypeFormData = z.infer<typeof typeSchema>;

interface TypeAnnonceFormProps {
    initialData?: TypeAnnonce;
    onSubmit: (data: TypeFormData) => Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function TypeAnnonceForm({ initialData, onSubmit, isSubmitting, isEditing = false, onClose }: TypeAnnonceFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<TypeFormData>({
        resolver: zodResolver(typeSchema),
        defaultValues: {
            label: initialData?.label || "",
            slug: initialData?.slug || "",
        },
    });

    const handleFormSubmit: SubmitHandler<TypeFormData> = async (data) => {
        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom du type</label>
                        <input
                            {...register("label")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: Offre, Demande, Location..."
                        />
                        {errors.label && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.label.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Slug (URL)</label>
                        <input
                            {...register("slug")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: offre-vente"
                        />
                        {errors.slug && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.slug.message}</p>}
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border flex items-center justify-end gap-3 rounded-b-xl">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all">
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" /> : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                    {isEditing ? 'Mettre à jour' : 'Créer le type'}
                </button>
            </div>
        </form>
    );
}
