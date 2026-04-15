"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CategoryProd } from "@/types/interface";

const categorySchema = z.object({
    name: z.string().min(2, "Le nom est trop court (min 2 caractères)").max(50, "Le nom est trop long"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryProductFormProps {
    initialData?: CategoryProd;
    onSubmit: (data: { name: string }) => Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function CategoryProductForm({ initialData, onSubmit, isSubmitting, isEditing = false, onClose }: CategoryProductFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: initialData?.name || "",
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom de la catégorie</label>
                        <input
                            {...register("name")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            placeholder="ex: Électronique, Vêtements..."
                        />
                        {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
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
                    {isEditing ? 'Mettre à jour' : 'Créer la catégorie'}
                </button>
            </div>
        </form>
    );
}
