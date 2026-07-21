'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { register } from '@/api/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { InputPhone } from '@/components/ui/InputPhone';
import { storage } from '@/lib/storage';
import { REGISTER_ROLE_OPTIONS, PENDING_ROLE_STORAGE_KEY, type RegisterRole } from '@/lib/registerRoleOptions';
import { RoleStatusBadge } from '@/components/auth/RoleStatusBadge';


import { useTranslation } from '@/utils/langue/hooks';

export default function RegisterPage() {
    const { t, tRich } = useTranslation();

    const registerSchema = z.object({
        email: z.string().email(),
        indicatif: z.string().optional(),
        phone: z.string().min(8),
        role: z.enum(['CLIENT', 'PRESTATAIRE', 'LOGISTICIAN', 'LIVREUR', 'GAZIER', 'GARAGISTE_VENTE_PIECE_AUTO']),
        password: z.string().min(5),
        fullName: z.string().optional(),
        company: z.string().optional(),
        acceptedTerms: z.boolean().refine(val => val === true, {
            message: t("auth.register.errors.accepted_terms")
        }),
    });
    const router = useRouter();

    // Source unique de vérité (src/lib/registerRoleOptions.ts) : passer `active` à true
    // là-bas suffit à dégriser le rôle ici comme dans RoleSelectionModal.
    const isRoleActive = (r: RegisterRole) => REGISTER_ROLE_OPTIONS.find((opt) => opt.value === r)?.active ?? true;

    const [role, setRole] = useState<RegisterRole>('CLIENT');
    const [email, setEmail] = useState('');
    const [indicatif, setIndicatif] = useState('+225');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(Array(4).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [fullname, setFullname] = useState('');
    const [company, setCompany] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(true);

    const inputsRef = useRef<HTMLInputElement[]>([]);

    // Présélection du type de compte choisi depuis la modale de /login (voir RoleSelectionModal).
    // Le sélecteur reste entièrement modifiable — ceci ne fait que changer la valeur initiale.
    useEffect(() => {
        const pending = storage.get<RegisterRole>(PENDING_ROLE_STORAGE_KEY);
        if (pending && REGISTER_ROLE_OPTIONS.some((opt) => opt.value === pending && opt.active)) {
            setRole(pending);
        }
        storage.remove(PENDING_ROLE_STORAGE_KEY);
    }, []);

    const password = '@' + otp.join(''); // OTP envoyé avec @

    /* ================= OTP LOGIC ================= */
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

    /* ================= SUBMIT ================= */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                email: email || undefined,
                indicatif,
                phone: phone || undefined,
                password,
                role,
                fullName: fullname || undefined,
                company: (role === 'PRESTATAIRE' || role === 'LOGISTICIAN' || role === 'LIVREUR' || role === 'GAZIER' || role === 'GARAGISTE_VENTE_PIECE_AUTO') && company ? company : undefined,
                acceptedTerms,
            };

            const validation = registerSchema.safeParse(payload);
            if (!validation.success) {
                setError(validation.error.issues[0].message);
                setLoading(false);
                return;
            }

            const res = await register(payload);
            if (res.statusCode === 200 || res.statusCode === 201) {
                setToken(res.data.accessToken);
                router.push('/');
            } else {
                setError(res.message || t("auth.register.errors.generic_error"));
            }
        } catch {
            setError(t("auth.register.errors.registration_error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center py-4 px-4 overflow-y-auto">
            <div className="w-full max-w-sm flex-1 bg-white dark:bg-gray-900 p-6 sm:p-8 flex flex-col">

                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white mx-auto">
                        <Icon icon="solar:shield-check-bold-duotone" width={18} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t("auth.register.title")}</h1>
                    <p className="text-xs sm:text-sm text-gray-500">{t("auth.register.subtitle")}</p>
                </div>

                {/* Role Selector */}
                <div className="mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">
                        Choisissez votre type de compte
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">

                    <div onClick={() => setRole('CLIENT')} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${role === 'CLIENT' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} >
                        <div className="absolute top-2 right-2"><RoleStatusBadge active /></div>
                        <Icon icon="solar:user-bold-duotone" className={`mt-3 ${role === 'CLIENT' ? 'text-primary' : 'text-gray-400'}`} width={24} />
                        <span className={`text-xs font-bold uppercase ${role === 'CLIENT' ? 'text-primary' : 'text-gray-500'}`}>{t("auth.register.role_particular")}</span>
                    </div>

                    <div onClick={() => setRole('PRESTATAIRE')} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${role === 'PRESTATAIRE' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} >
                        <div className="absolute top-2 right-2"><RoleStatusBadge active /></div>
                        <Icon icon="solar:case-minimalistic-bold-duotone" className={`mt-3 ${role === 'PRESTATAIRE' ? 'text-primary' : 'text-gray-400'}`} width={24} />
                        <span className={`text-xs font-bold uppercase ${role === 'PRESTATAIRE' ? 'text-primary' : 'text-gray-500'}`}>{t("auth.register.role_professional")}</span>
                    </div>

                    <div onClick={() => isRoleActive('LOGISTICIAN') && setRole('LOGISTICIAN')}
                        className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${isRoleActive('LOGISTICIAN') ? `cursor-pointer ${role === 'LOGISTICIAN' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}` : 'border-gray-200 bg-gray-50 opacity-60 grayscale cursor-not-allowed'}`}
                        title={isRoleActive('LOGISTICIAN') ? undefined : 'Bientôt disponible'} >
                        <div className="absolute top-2 right-2"><RoleStatusBadge active={isRoleActive('LOGISTICIAN')} /></div>
                        <Icon icon="solar:case-minimalistic-bold-duotone" className={`mt-3 ${role === 'LOGISTICIAN' && isRoleActive('LOGISTICIAN') ? 'text-primary' : 'text-gray-400'}`} width={24} />
                        <span className={`text-xs font-bold uppercase ${role === 'LOGISTICIAN' && isRoleActive('LOGISTICIAN') ? 'text-primary' : 'text-gray-500'}`}>{t("auth.register.role_logistician")}</span>
                    </div>

                    <div onClick={() => isRoleActive('LIVREUR') && setRole('LIVREUR')}
                        className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${isRoleActive('LIVREUR') ? `cursor-pointer ${role === 'LIVREUR' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}` : 'border-gray-200 bg-gray-50 opacity-60 grayscale cursor-not-allowed'}`}
                        title={isRoleActive('LIVREUR') ? undefined : 'Bientôt disponible'} >
                        <div className="absolute top-2 right-2"><RoleStatusBadge active={isRoleActive('LIVREUR')} /></div>
                        <Icon icon="solar:case-minimalistic-bold-duotone" className={`mt-3 ${role === 'LIVREUR' && isRoleActive('LIVREUR') ? 'text-primary' : 'text-gray-400'}`} width={24} />
                        <span className={`text-xs font-bold uppercase ${role === 'LIVREUR' && isRoleActive('LIVREUR') ? 'text-primary' : 'text-gray-500'}`}>{t("auth.register.role_deliverer")}</span>
                    </div>

                    <div onClick={() => setRole('GAZIER')} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${role === 'GAZIER' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} >
                        <div className="absolute top-2 right-2"><RoleStatusBadge active /></div>
                        <Icon icon="solar:fire-bold-duotone" className={`mt-3 ${role === 'GAZIER' ? 'text-primary' : 'text-gray-400'}`} width={24} />
                        <span className={`text-xs font-bold uppercase ${role === 'GAZIER' ? 'text-primary' : 'text-gray-500'}`}>{t("auth.register.role_gas_provider")}</span>
                    </div>

                    <div onClick={() => setRole('GARAGISTE_VENTE_PIECE_AUTO')} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${role === 'GARAGISTE_VENTE_PIECE_AUTO' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} >
                        <div className="absolute top-2 right-2"><RoleStatusBadge active /></div>
                        <Icon icon="solar:garage-bold-duotone" className={`mt-3 ${role === 'GARAGISTE_VENTE_PIECE_AUTO' ? 'text-primary' : 'text-gray-400'}`} width={24} />
                        <span className={`text-xs font-bold uppercase ${role === 'GARAGISTE_VENTE_PIECE_AUTO' ? 'text-primary' : 'text-gray-500'}`}>{t("auth.register.role_garagiste")}</span>
                    </div>

                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {error && (
                        <div className="p-2 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* info */}
                    <div className="p-2 text-sm bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                        {t("auth.register.info_box")}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-black text-gray-600">{t("auth.register.email_label")}</label>
                        <div className="relative">
                            <Icon icon="solar:letter-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="email" value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t("auth.register.email_placeholder")}
                                required
                                className="w-full h-9 sm:h-11 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-primary text-xs sm:text-sm transition-all"
                                inputMode="email"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-black text-gray-600">{t("auth.register.phone_label")}</label>
                        <InputPhone
                            indicatif={indicatif}
                            phone={phone}
                            onPhoneChange={(val) => {
                                setIndicatif(val.indicatif);
                                setPhone(val.phone);
                            }}
                        />
                    </div>

                    {/* Optional Fullname */}
                    <div className="space-y-2">
                        <label className="text-[11px] sm:text-xs font-black text-gray-600">{t("auth.register.fullname_label")}</label>
                        <div className="relative">
                            <Icon icon="solar:user-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                placeholder={t("auth.register.fullname_placeholder")}
                                className="w-full h-9 sm:h-11 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-primary text-xs sm:text-sm transition-all"
                                inputMode="text"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Optional Company if PRESTATAIRE */}
                    {(role === 'PRESTATAIRE' || role === 'LOGISTICIAN' || role === 'GAZIER' || role === 'GARAGISTE_VENTE_PIECE_AUTO') && (
                        <div className="space-y-2">
                            <label className="text-[11px] sm:text-xs font-black text-gray-600">{t("auth.register.company_label")}</label>
                            <div className="relative">
                                <Icon icon="solar:case-minimalistic-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder={t("auth.register.company_placeholder")}
                                    className="w-full h-9 sm:h-11 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-primary text-xs sm:text-sm transition-all"
                                    inputMode="text"
                                    style={{ fontSize: '16px' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* PASSWORD OTP 4 CHIFFRES */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] sm:text-xs font-black text-gray-600">{t("auth.register.password_label")}</label>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary font-semibold flex items-center gap-1" >
                                {showPassword ? <Icon icon="solar:eye-closed-bold-duotone" width={14} /> : <Icon icon="solar:eye-bold-duotone" width={14} />}
                                {showPassword ? t("auth.login.hide_password") : t("auth.login.show_password")}
                            </button>
                        </div>

                        <div className="flex justify-center gap-1 sm:gap-2">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { if (el) inputsRef.current[i] = el }}
                                    type={showPassword ? 'text' : 'password'}
                                    value={digit}
                                    maxLength={1}
                                    onChange={(e) => handleOtpChange(e.target.value, i)}
                                    onKeyDown={(e) => handleKeyDown(e, i)}
                                    className="w-10 sm:w-12 h-10 sm:h-12 text-center text-sm font-bold rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:border-primary outline-none transition-all"
                                    inputMode="numeric"
                                    style={{ fontSize: '16px' }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Terms Acceptance */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="flex-1">
                            <p className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
                                {tRich("auth.register.terms_acceptance", {
                                    terms: <Link href="/terms-of-use" className="text-primary hover:underline">{t("auth.login.terms_link")}</Link>,
                                    privacy: <Link href="/privacy-policy" className="text-primary hover:underline">{t("auth.login.privacy_link")}</Link>
                                })}
                            </p>
                        </div>
                        <Switch
                            checked={acceptedTerms}
                            onCheckedChange={setAcceptedTerms}
                            className="data-[state=checked]:bg-primary scale-90 sm:scale-100"
                        />
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading} className="w-full h-10 sm:h-12 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95" >
                        {loading ? <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" /> : <>{t("auth.register.submit_button")} <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} /></>}
                    </button>

                </form>

                {/* Footer */}
                <p className="text-center text-[16px] sm:text-sm text-gray-500 mt-6">
                    {t("auth.register.already_registered")} <Link href="/login" className="text-primary font-bold">{t("auth.register.login_link")}</Link>
                </p>



                {/* Footer petit */}
                <div className="text-center text-[9px] sm:text-[10px] text-gray-500 space-y-1 pt-2">
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                        <span className="text-gray-300">|</span>
                        <Link href="/terms-of-use" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                            {t("auth.login.terms_link")}
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link href="/privacy-policy" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                            {t("auth.login.privacy_link")}
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
