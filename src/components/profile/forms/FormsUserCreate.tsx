"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Role } from "@/types/interface";
import { Select2 } from "@/components/ui/Select2";
import { InputPhone } from "@/components/ui/InputPhone";

// Mêmes règles que registerSchema (src/app/register/page.tsx), qui correspondent au RegisterDto
// backend (email valide, téléphone >= 8, mot de passe >= 5) — réutilisées à l'identique pour que
// la création admin respecte les mêmes règles métier que l'inscription publique. Le mot de passe
// est ici un champ classique (pas l'OTP à 4 chiffres du formulaire public), plus adapté à une
// création directe par un administrateur déjà authentifié.
const createUserSchema = z.object({
    email: z.string().email("Email invalide"),
    indicatif: z.string().optional(),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    role: z.nativeEnum(Role),
    password: z.string().min(5, "Le mot de passe doit contenir au moins 5 caractères"),
    fullName: z.string().optional(),
    company: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

interface FormsUserCreateProps {
    onSubmit: (data: CreateUserFormData) => Promise<void>;
    isSubmitting: boolean;
    onClose: () => void;
}

const ROLE_OPTIONS = [
    { id: Role.CLIENT, label: "Client" },
    { id: Role.PRESTATAIRE, label: "Prestataire" },
    { id: Role.ENTREPRISE, label: "Entreprise" },
    { id: Role.CHAUFFEUR, label: "Chauffeur" },
    { id: Role.LIVREUR, label: "Livreur" },
    { id: Role.ADMIN, label: "Admin" },
];

export default function FormsUserCreate({ onSubmit, isSubmitting, onClose }: FormsUserCreateProps) {
    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { indicatif: "+225", role: Role.CLIENT },
    });

    const role = watch("role");
    const showCompany = role === Role.PRESTATAIRE || role === Role.ENTREPRISE;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-1 space-y-6 pb-20 scrollbar-hide">
                <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:user-plus-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Nouvel utilisateur</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Email</label>
                            <input type="email" {...register("email")} placeholder="nom@exemple.com" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Téléphone</label>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <InputPhone
                                        indicatif={watch("indicatif") || "+225"}
                                        phone={field.value || ""}
                                        onPhoneChange={(val) => {
                                            setValue("indicatif", val.indicatif);
                                            field.onChange(val.phone);
                                        }}
                                    />
                                )}
                            />
                            {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom &amp; Prénom</label>
                            <input {...register("fullName")} placeholder="Jean Dupont" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Mot de passe</label>
                            <input type="password" {...register("password")} placeholder="••••••••" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Rôle</label>
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select2 options={ROLE_OPTIONS} labelExtractor={(o) => o.label} valueExtractor={(o) => o.id} placeholder="Sélectionner un rôle" mode="single" selectedItem={field.value} onSelectionChange={field.onChange} />
                                )}
                            />
                        </div>

                        {showCompany && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Entreprise / Boutique</label>
                                <input {...register("company")} placeholder="Ex: MonEntreprise SARL" className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3 z-10">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider h-12 flex-1">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all shadow-xl shadow-primary/20 h-12 flex-[2] flex items-center justify-center gap-2 uppercase tracking-widest">
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="animate-spin" /> : <><Icon icon="solar:check-circle-bold" /> Créer l'utilisateur</>}
                </button>
            </div>
        </form>
    );
}
