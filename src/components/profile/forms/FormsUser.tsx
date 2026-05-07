"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Role, User, AdminUserUpdateDto } from "@/types/interface";
import { Select2 } from "@/components/ui/Select2";

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
        { id: Role.CLIENT, label: "👤 CLIENT" },
        { id: Role.PRESTATAIRE, label: "🛠️ PRESTATAIRE" },
        { id: Role.ADMIN, label: "🛡️ ADMINISTRATEUR" },
        { id: Role.ENTREPRISE, label: "🏢 ENTREPRISE" },
        { id: Role.CHAUFFEUR, label: "🚚 CHAUFFEUR" },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-20 scrollbar-hide">
                <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:user-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Profil Utilisateur</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom complet</label>
                            <input {...register("fullName")} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="Nom complet" />
                            {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Téléphone</label>
                            <input {...register("phone")} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="Téléphone" />
                            {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Rôle</label>
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select2 options={ROLE_OPTIONS} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} placeholder="Choisir un rôle" mode="single" selectedItem={field.value} onSelectionChange={field.onChange} />
                                )}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Crédits (Points)</label>
                            <input type="number" {...register("credits", { valueAsNumber: true })} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            {errors.credits && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.credits.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" {...register("isPremium")} id="isPremium" className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary" />
                        <label htmlFor="isPremium" className="text-[10px] font-black text-muted-foreground uppercase cursor-pointer">Compte Premium / Vérifié</label>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3 z-10">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider h-12 flex-1">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all shadow-xl shadow-primary/20 h-12 flex-[2] flex items-center justify-center gap-2 uppercase tracking-widest">
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="animate-spin" /> : <><Icon icon="solar:check-circle-bold" /> Mettre à jour le profil</>}
                </button>
            </div>
        </form>
    );
}
