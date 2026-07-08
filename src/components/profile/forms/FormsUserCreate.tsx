"use client";

import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Role } from "@/types/interface";
import { Select2 } from "@/components/ui/Select2";
import { InputPhone } from "@/components/ui/InputPhone";

// Mêmes règles que registerSchema (src/app/register/page.tsx), qui correspondent au RegisterDto
// backend (email valide, téléphone >= 8, mot de passe >= 5) — réutilisées à l'identique, y compris
// le mot de passe en OTP à 4 chiffres préfixé de "@" (voir handleOtpChange plus bas), pour que la
// création admin respecte exactement les mêmes règles/format que l'inscription publique.
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
        defaultValues: { indicatif: "+225", role: Role.CLIENT, password: "" },
    });

    const role = watch("role");
    const showCompany = role === Role.PRESTATAIRE || role === Role.ENTREPRISE;

    // Mot de passe en OTP à 4 chiffres, préfixé de "@" — identique à register/page.tsx
    // (const password = '@' + otp.join('')), pour produire exactement le même format de mot
    // de passe que l'inscription publique.
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [showPassword, setShowPassword] = useState(false);
    const otpInputsRef = useRef<HTMLInputElement[]>([]);

    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setValue("password", "@" + newOtp.join(""), { shouldValidate: true });
        if (value && index < 3) otpInputsRef.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputsRef.current[index - 1]?.focus();
        }
    };

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
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Mot de passe (OTP)</label>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] text-primary font-bold flex items-center gap-1">
                                    <Icon icon={showPassword ? "solar:eye-closed-bold-duotone" : "solar:eye-bold-duotone"} width={12} />
                                    {showPassword ? "Masquer" : "Voir"}
                                </button>
                            </div>
                            <div className="flex justify-center gap-1.5">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { if (el) otpInputsRef.current[i] = el; }}
                                        type={showPassword ? "text" : "password"}
                                        value={digit}
                                        maxLength={1}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                        className="w-10 h-10 text-center text-sm font-bold rounded-lg border border-border bg-muted/30 focus:border-primary outline-none transition-all"
                                        inputMode="numeric"
                                        style={{ fontSize: "16px" }}
                                    />
                                ))}
                            </div>
                            {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase text-center">{errors.password.message}</p>}
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
