"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const simpleSchema = z.object({
    name: z.string().min(2, "Le nom est trop court (min 2 caractères)").max(50, "Le nom est trop long"),
});

type SimpleFormData = z.infer<typeof simpleSchema>;

interface SimpleEntityFormProps {
    initialData?: { name: string };
    onSubmit: (data: SimpleFormData) => Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
    label?: string;
    placeholder?: string;
}

export default function SimpleEntityForm({ 
    initialData, 
    onSubmit, 
    isSubmitting, 
    isEditing = false, 
    onClose,
    label = "Nom",
    placeholder = "Entrez le nom..."
}: SimpleEntityFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<SimpleFormData>({
        resolver: zodResolver(simpleSchema),
        defaultValues: {
            name: initialData?.name || "",
        },
    });

    const handleFormSubmit: SubmitHandler<SimpleFormData> = async (data) => {
        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">{label}</label>
                        <input
                            {...register("name")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder={placeholder}
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name.message}</p>}
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
                    {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}
