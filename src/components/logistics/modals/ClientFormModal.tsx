"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogisticsClient, Role } from "@/types/interface";
import { createCompanyClient, updateCompanyClient } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { Select2 } from "@/components/ui/Select2";

const clientSchema = z.object({
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().min(8, "Le numéro de téléphone doit faire au moins 8 chiffres"),
    fullName: z.string().min(3, "Le nom complet est requis"),
    role: z.nativeEnum(Role),
    companyName: z.string().optional(),
    password: z.string().min(4, "Le mot de passe doit faire au moins 4 chiffres").optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
    client?: LogisticsClient | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ROLE_OPTIONS = [
    { value: Role.CLIENT, label: 'CLIENT' },
    { value: Role.ENTREPRISE, label: 'ENTREPRISE' },
    { value: Role.CHAUFFEUR, label: 'CHAUFFEUR' },
];

export default function ClientFormModal({ client, isOpen, onClose, onSuccess }: ClientFormModalProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            role: Role.CLIENT,
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [otp, setOtp] = useState(Array(4).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const inputsRef = useRef<HTMLInputElement[]>([]);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (client) {
            setValue("email", client.email || "");
            setValue("phone", client.phone || "");
            setValue("fullName", client.fullName || "");
            setValue("role", client.role);
            setValue("companyName", client.companyName || "");
        } else {
            setValue("email", "");
            setValue("phone", "");
            setValue("fullName", "");
            setValue("role", Role.CLIENT);
            setValue("companyName", "");
            setOtp(Array(4).fill(''));
        }
    }, [client, setValue, isOpen]);

    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 3) inputsRef.current[index + 1]?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const onSubmit = async (data: ClientFormData) => {
        setIsSubmitting(true);
        try {
            const password = otp.join('') ? '@' + otp.join('') : undefined;
            const payload = { ...data, password };
            
            let res;
            if (client) {
                res = await updateCompanyClient(client.id, payload);
            } else {
                if (!password && !client) {
                    addNotification("Le mot de passe est requis pour un nouveau client", "error");
                    setIsSubmitting(false);
                    return;
                }
                res = await createCompanyClient(payload);
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(client ? "Client mis à jour" : "Client créé avec succès", "success");
                onSuccess();
                onClose();
            } else {
                addNotification(res.message || "Une erreur est survenue", "error");
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-visible animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Icon icon={client ? "solar:user-edit-bold-duotone" : "solar:user-plus-bold-duotone"} className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                                    {client ? "Modifier le client" : "Ajouter un client"}
                                </h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Informations du compte</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                            <Icon icon="solar:close-circle-bold" className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto max-h-[70vh] px-1 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom Complet</label>
                                <input {...register("fullName")} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="Ex: Jean Kouassi" />
                                {errors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.fullName.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Téléphone</label>
                                <input {...register("phone")} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="+225 00000000" />
                                {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Email (Optionnel)</label>
                            <input {...register("email")} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="client@exemple.com" />
                            {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Type de compte</label>
                            <Select2
                                options={ROLE_OPTIONS}
                                labelExtractor={(o) => o.label}
                                valueExtractor={(o) => o.value}
                                selectedItem={watch("role")}
                                onSelectionChange={(val) => setValue("role", val as Role)}
                                placeholder="Choisir le rôle..."
                            />
                        </div>

                        {watch("role") === Role.ENTREPRISE && (
                            <div className="space-y-1 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom de l'entreprise</label>
                                <input {...register("companyName")} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="Ex: Ivoire Logistique" />
                            </div>
                        )}

                        {!client && (
                            <div className="space-y-2 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-primary uppercase">Définir un Mot de passe (4 chiffres)</label>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] font-black text-primary hover:underline uppercase">
                                        {showPassword ? "Masquer" : "Afficher"}
                                    </button>
                                </div>
                                <div className="flex justify-center gap-3">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { if (el) inputsRef.current[i] = el }}
                                            type={showPassword ? "text" : "password"}
                                            value={digit}
                                            maxLength={1}
                                            onChange={(e) => handleOtpChange(e.target.value, i)}
                                            onKeyDown={(e) => handleKeyDown(e, i)}
                                            className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-primary/20 bg-background focus:border-primary outline-none transition-all shadow-sm"
                                            inputMode="numeric"
                                        />
                                    ))}
                                </div>
                                <p className="text-[9px] text-center text-muted-foreground font-bold mt-3 uppercase tracking-tighter italic">
                                    Note: Le mot de passe sera automatiquement précédé de "@" (ex: @1234)
                                </p>
                            </div>
                        )}

                        <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider flex-1 h-12">
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest flex-[2] h-12"
                            >
                                {isSubmitting ? (
                                    <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5" />
                                        {client ? "Mettre à jour" : "Créer le compte"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
