"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateServiceFeeConfigDto, FeeType, ServiceFeeConfig, UpdateServiceFeeConfigDto } from "@/types/interface";

const feeSchema = z.object({
    serviceName: z.string().min(2, "Identifiant trop court").regex(/^[a-z0-9_]+$/, "Uniquement minuscules, chiffres et underscores (ex: create_product)"),
    displayName: z.string().min(2, "Le libellé est trop court"),
    feeType: z.enum(["PERCENTAGE", "FIXED", "FREE"]),
    feeValue: z.number().min(0, "La valeur ne peut pas être négative"),
    minimumFee: z.number().min(0).optional().nullable(),
    maximumFee: z.number().min(0).optional().nullable(),
    currency: z.string().min(1),
    isActive: z.boolean(),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface FormsServiceFeeConfigProps {
    initialData?: ServiceFeeConfig;
    onSubmit: (data: CreateServiceFeeConfigDto | UpdateServiceFeeConfigDto) => Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function FormsServiceFeeConfig({ initialData, onSubmit, isSubmitting, isEditing = false, onClose }: FormsServiceFeeConfigProps) {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<FeeFormData>({
        resolver: zodResolver(feeSchema),
        defaultValues: {
            serviceName: initialData?.serviceName || "",
            displayName: initialData?.displayName || "",
            feeType: initialData?.feeType || "FIXED",
            feeValue: initialData?.feeValue ?? 0,
            minimumFee: initialData?.minimumFee ?? undefined,
            maximumFee: initialData?.maximumFee ?? undefined,
            currency: initialData?.currency || "XOF",
            isActive: initialData?.isActive ?? true,
        },
    });

    const feeType = watch("feeType") as FeeType;

    const submit = handleSubmit(async (data) => {
        const { serviceName, ...rest } = data;
        await onSubmit({
            // En édition, serviceName est immuable et absent de UpdateServiceFeeConfigDto côté
            // backend (whitelist strict) : l'envoyer ferait rejeter toute la requête.
            ...(isEditing ? rest : data),
            minimumFee: data.minimumFee || undefined,
            maximumFee: data.maximumFee || undefined,
        });
    });

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="px-4 space-y-4">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold">Identifiant technique (service_name)</label>
                        <input
                            {...register("serviceName")}
                            disabled={isEditing}
                            placeholder="ex: create_product"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all disabled:opacity-60 font-mono"
                        />
                        {errors.serviceName && <p className="text-[10px] text-red-500">{errors.serviceName.message}</p>}
                        {isEditing && <p className="text-[10px] text-muted-foreground">Non modifiable — c'est la clé référencée par le code des routes facturables.</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Libellé affiché</label>
                        <input
                            {...register("displayName")}
                            placeholder="ex: Création de produit"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                        />
                        {errors.displayName && <p className="text-[10px] text-red-500">{errors.displayName.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold">Type de frais</label>
                        <select {...register("feeType")} className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all">
                            <option value="FIXED">Montant fixe</option>
                            <option value="PERCENTAGE">Pourcentage</option>
                            <option value="FREE">Gratuit</option>
                        </select>
                    </div>

                    {feeType !== "FREE" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold">{feeType === "PERCENTAGE" ? "Pourcentage (%)" : "Montant (FCFA)"}</label>
                                <input
                                    type="number" step="0.01"
                                    {...register("feeValue", { valueAsNumber: true })}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                                />
                                {errors.feeValue && <p className="text-[10px] text-red-500">{errors.feeValue.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold">Devise</label>
                                <input
                                    {...register("currency")}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {feeType === "PERCENTAGE" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold">Frais minimum (optionnel)</label>
                                <input
                                    type="number" step="0.01"
                                    {...register("minimumFee", { valueAsNumber: true })}
                                    placeholder="—"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold">Frais maximum (optionnel)</label>
                                <input
                                    type="number" step="0.01"
                                    {...register("maximumFee", { valueAsNumber: true })}
                                    placeholder="—"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            {...register("isActive")}
                            id="isActiveServiceFee"
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="isActiveServiceFee" className="text-xs font-medium">Service actif (facturé immédiatement si activé)</label>
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
                    {isEditing ? "Mettre à jour" : "Créer le service"}
                </button>
            </div>
        </form>
    );
}
