"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminSubscriptionPlanDto, SubscriptionPlan } from "@/types/interface";

const planSchema = z.object({
    name: z.string().min(2, "Le nom est trop court"),
    price: z.number().min(0, "Le prix ne peut pas être négatif"),
    durationDays: z.number().int().min(1, "La durée doit être d'au moins 1 jour"),
    isActive: z.boolean(),
    defaultFeatures: z.array(z.string().min(1, "L'avantage ne peut pas être vide")).min(1, "Ajoutez au moins un avantage"),
});

type PlanFormData = z.infer<typeof planSchema>;

interface FormsSubscriptionPlanProps {
    initialData?: SubscriptionPlan;
    onSubmit: (data: AdminSubscriptionPlanDto) => Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function FormsSubscriptionPlan({ initialData, onSubmit, isSubmitting, isEditing = false, onClose }: FormsSubscriptionPlanProps) {
    const { register, handleSubmit, control, formState: { errors } } = useForm<PlanFormData>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            name: initialData?.name || "",
            price: initialData?.price || 0,
            durationDays: initialData?.durationDays || 30,
            isActive: initialData?.isActive ?? true,
            defaultFeatures: initialData?.defaultFeatures?.map((f: any) => f.label) || [""],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "defaultFeatures" as never, // cast to never because it's a string array, react-hook-form types can be tricky
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom du pack</label>
                        <input
                            {...register("name")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            placeholder="ex: Pack Premium"
                        />
                        {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Montant crédité au Wallet (CFA)</label>
                            <input
                                type="number"
                                {...register("price", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            />
                            {errors.price && <p className="text-[10px] text-red-500">{errors.price.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold">Fréquence de rechargement (jours)</label>
                            <input
                                type="number"
                                {...register("durationDays", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            />
                            {errors.durationDays && <p className="text-[10px] text-red-500">{errors.durationDays.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            {...register("isActive")}
                            id="isActivePlan"
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="isActivePlan" className="text-xs font-medium">Pack actif</label>
                    </div>

                    {/* Features Editor */}
                    <div className="space-y-3 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold">Avantages du pack</label>
                            <button
                                type="button"
                                onClick={() => append("")}
                                className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-all"
                            >
                                <Icon icon="solar:add-circle-bold" className="w-3 h-3" />
                                Ajouter
                            </button>
                        </div>

                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-2 group animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            {...register(`defaultFeatures.${index}` as const)}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                                            placeholder="ex: Rechargement automatique chaque mois"
                                        />
                                        {errors?.defaultFeatures?.[index] && (
                                            <p className="text-[10px] text-red-500">
                                                {errors.defaultFeatures[index]?.message}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="mt-1 p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                                        title="Supprimer"
                                    >
                                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {errors.defaultFeatures && typeof errors.defaultFeatures.message === 'string' && (
                                <p className="text-[10px] text-red-500">{errors.defaultFeatures.message}</p>
                            )}
                        </div>
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
                    {isEditing ? 'Mettre à jour' : 'Créer le pack'}
                </button>
            </div>
        </form>
    );
}
