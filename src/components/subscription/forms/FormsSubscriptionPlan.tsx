"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminSubscriptionPlanDto, SubscriptionPlan, PlanEntity } from "@/types/interface";
import { adminGetPlanEntities } from "@/api/api";

const planSchema = z.object({
    name: z.string().min(2, "Le nom est trop court"),
    price: z.number().min(0, "Le prix ne peut pas être négatif"),
    serviceLimit: z.number().int().min(1, "La limite doit être d'au moins 1"),
    durationDays: z.number().int().min(1, "La durée doit être d'au moins 1 jour"),
    isActive: z.boolean(),
    entityIds: z.array(z.string()),
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
    const [entities, setEntities] = React.useState<PlanEntity[]>([]);

    React.useEffect(() => {
        adminGetPlanEntities().then(res => {
            if (res.statusCode === 200 && res.data) setEntities(res.data);
        });
    }, []);

    const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<PlanFormData>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            name: initialData?.name || "",
            price: initialData?.price || 0,
            serviceLimit: initialData?.serviceLimit || 10,
            durationDays: initialData?.durationDays || 30,
            isActive: initialData?.isActive ?? true,
            entityIds: initialData?.entities?.map(e => e.id) || [],
        },
    });

    const selectedEntityIds = watch("entityIds");

    const toggleEntity = (id: string) => {
        const current = [...selectedEntityIds];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setValue("entityIds", current);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-4 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Nom du plan</label>
                        <input
                            {...register("name")}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            placeholder="ex: Plan Premium"
                        />
                        {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold">Prix (CFA)</label>
                            <input
                                type="number"
                                {...register("price", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            />
                            {errors.price && <p className="text-[10px] text-red-500">{errors.price.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold">Limite de services</label>
                            <input
                                type="number"
                                {...register("serviceLimit", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                            />
                            {errors.serviceLimit && <p className="text-[10px] text-red-500">{errors.serviceLimit.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Durée (jours)</label>
                        <input
                            type="number"
                            {...register("durationDays", { valueAsNumber: true })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                        />
                        {errors.durationDays && <p className="text-[10px] text-red-500">{errors.durationDays.message}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            {...register("isActive")}
                            id="isActivePlan"
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="isActivePlan" className="text-xs font-medium">Plan actif</label>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border">
                        <label className="text-xs font-bold block mb-2">Entités contrôlées</label>
                        <div className="grid grid-cols-2 gap-2">
                            {entities.map((entity) => {
                                const isSelected = selectedEntityIds.includes(entity.id);
                                return (
                                    <button
                                        key={entity.id}
                                        type="button"
                                        onClick={() => toggleEntity(entity.id)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${isSelected
                                            ? 'bg-primary/10 border-primary text-primary font-bold'
                                            : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                                            }`}
                                    >
                                        {entity.entityName}
                                        {isSelected && <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                        {entities.length === 0 && (
                            <p className="text-[10px] text-muted-foreground italic">Aucune entité disponible. Créez-en d'abord dans l'onglet Entités.</p>
                        )}
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
                    {isEditing ? 'Mettre à jour' : 'Créer le plan'}
                </button>
            </div>
        </form>
    );
}
