"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { CategorieAnnonce } from "@/types/interface";

const categorySchema = z.object({
    label: z.string().min(2, "Le nom est trop court (min 2 caractères)").max(50, "Le nom est trop long"),
    slug: z.string().min(2, "Le slug est trop court").toLowerCase(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryAnnonceFormProps {
    initialData?: CategorieAnnonce;
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function CategoryAnnonceForm({ initialData, onSubmit, isSubmitting, isEditing = false, onClose }: CategoryAnnonceFormProps) {
    const [icon, setIcon] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(initialData?.iconName || null);

    const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            label: initialData?.label || "",
            slug: initialData?.slug || "",
        },
    });

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIcon(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setIconPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit: SubmitHandler<CategoryFormData> = async (data) => {
        const formData = new FormData();
        formData.append("label", data.label);
        formData.append("slug", data.slug);
        if (icon) {
            formData.append("icon", icon);
        }
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                {/* Icon Section */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                            Icône de la catégorie
                        </h3>
                    </div>

                    <div className="flex justify-center">
                        <label className={`relative w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${iconPreview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary bg-muted'}`}>
                            {iconPreview ? (
                                <Image src={iconPreview} alt="Icon Preview" fill className="object-cover rounded-xl p-2" unoptimized />
                            ) : (
                                <>
                                    <Icon icon="solar:upload-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-[10px] mt-1 text-muted-foreground font-black">AJOUTER</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
                        </label>
                    </div>
                    {iconPreview && (
                        <p className="text-[10px] text-center mt-2 text-muted-foreground italic font-medium">Cliquez sur l'image pour la modifier</p>
                    )}
                </div>

                {/* Info Section */}
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom de la catégorie</label>
                        <input
                            {...register("label")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: Immobilier, Véhicules..."
                        />
                        {errors.label && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.label.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Slug (URL)</label>
                        <input
                            {...register("slug")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: immobilier-ventes"
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
                    {isEditing ? 'Mettre à jour' : 'Créer la catégorie'}
                </button>
            </div>
        </form>
    );
}
