"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Role, User, AdminUserUpdateDto } from "@/types/interface";
import { Select2 } from "./Select2";

const userSchema = z.object({
    fullName: z.string().min(2, "Le nom est trop court").optional(),
    phone: z.string().optional(),
    role: z.nativeEnum(Role),
    isPremium: z.boolean(),
    credits: z.number().int().min(0, "Les crédits ne peuvent pas être négatifs"),
});

type UserFormData = z.infer<typeof userSchema>;

interface FormsUserProps {
    initialData: User;
    onSubmit: (data: AdminUserUpdateDto) => Promise<void>;
    isSubmitting: boolean;
    onClose: () => void;
}

export default function FormsUser({ initialData, onSubmit, isSubmitting, onClose }: FormsUserProps) {
    const { register, handleSubmit, control, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            fullName: initialData.fullName || "",
            phone: initialData.phone || "",
            role: initialData.role,
            isPremium: initialData.isPremium,
            credits: initialData.credits,
        },
    });

    const ROLE_OPTIONS = [
        { id: Role.CLIENT, label: "👤 Client" },
        { id: Role.PRESTATAIRE, label: "🛠️ Prestataire" },
        { id: Role.ADMIN, label: "🛡️ Administrateur" },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom complet</label>
                        <input
                            {...register("fullName")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            placeholder="Nom complet"
                        />
                        {errors.fullName && <p className="text-[10px] text-red-500">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Téléphone</label>
                        <input
                            {...register("phone")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            placeholder="Téléphone"
                        />
                        {errors.phone && <p className="text-[10px] text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Rôle</label>
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select2
                                        options={ROLE_OPTIONS}
                                        labelExtractor={(o) => o.label}
                                        valueExtractor={(o) => o.id}
                                        placeholder="Sélectionner un rôle"
                                        mode="single"
                                        selectedItem={field.value}
                                        onSelectionChange={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold">Crédits</label>
                            <input
                                type="number"
                                {...register("credits", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            />
                            {errors.credits && <p className="text-[10px] text-red-500">{errors.credits.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            {...register("isPremium")}
                            id="isPremium"
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="isPremium" className="text-xs font-medium">Statut Premium</label>
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
                    Mettre à jour
                </button>
            </div>
        </form>
    );
}
