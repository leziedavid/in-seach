'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { forgotPassword, verifyResetCode, resetPassword } from '@/api/api';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/utils/langue/hooks';
import { InputPhone } from '@/components/ui/InputPhone';
import { useNotification } from '@/components/notifications/NotificationProvider';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { addNotification } = useNotification();

    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1
    const [indicatif, setIndicatif] = useState('+225');
    const [phone, setPhone] = useState('');

    // Step 2
    const [otp, setOtp] = useState(Array(6).fill('')); // OTP 6 chiffres
    const inputsRef = useRef<HTMLInputElement[]>([]);

    // Step 3
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* ================= OTP LOGIC ================= */
    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) inputsRef.current[index + 1]?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    /* ================= SUBMIT ================= */
    const handleStep1 = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await forgotPassword(phone);
            if (res.statusCode === 200) {
                addNotification("Code envoyé via WhatsApp", "success");
                setStep(2);
            } else {
                setError(res.message || "Erreur lors de l'envoi du code");
            }
        } catch {
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const handleStep2 = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) {
            setError("Veuillez entrer les 6 chiffres du code");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await verifyResetCode(phone, code);
            if (res.statusCode === 200) {
                setStep(3);
            } else {
                setError(res.message || "Code invalide ou expiré");
            }
        } catch {
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const handleStep3 = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }
        if (newPwd.length < 4) {
            setError("Le mot de passe est trop court");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const code = otp.join('');
            const res = await resetPassword(phone, code, newPwd);
            if (res.statusCode === 200) {
                addNotification("Mot de passe mis à jour !", "success");
                router.push('/login');
            } else {
                setError(res.message || "Erreur lors de la réinitialisation");
            }
        } catch {
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */
    return (
        <div className="flex flex-col items-center justify-center py-4 px-4 overflow-y-auto bg-transparent">
            <div className="w-full max-w-sm bg-card p-6 sm:p-8 flex flex-col ">

                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto">
                        <Icon icon="solar:lock-keyhole-bold-duotone" width={24} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">
                        Mot de passe oublié
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {step === 1 && "Entrez votre numéro WhatsApp pour recevoir un code de réinitialisation."}
                        {step === 2 && "Entrez le code à 6 chiffres reçu sur WhatsApp."}
                        {step === 3 && "Créez votre nouveau mot de passe."}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 text-center font-medium">
                        {error}
                    </div>
                )}

                {/* STEP 1: PHONE */}
                {step === 1 && (
                    <form onSubmit={handleStep1} className="space-y-6" suppressHydrationWarning>
                        <div className="space-y-1">
                            <label className="text-[11px] sm:text-xs font-black text-muted-foreground">
                                Numéro WhatsApp
                            </label>
                            <InputPhone
                                indicatif={indicatif}
                                phone={phone}
                                onPhoneChange={(val) => {
                                    setIndicatif(val.indicatif);
                                    setPhone(val.phone);
                                }}
                                required
                                className="bg-muted/30 dark:bg-muted/10 h-11 border-border"
                            />
                        </div>

                        <button type="submit" disabled={loading || !phone} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                            {loading ? <Icon icon="solar:refresh-bold-duotone" width={18} className="animate-spin" /> : "Recevoir un code"}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP */}
                {step === 2 && (
                    <form onSubmit={handleStep2} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] sm:text-xs font-black text-muted-foreground block text-center">
                                Code reçu
                            </label>
                            <div className="flex justify-center gap-1 sm:gap-2">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { if (el) inputsRef.current[i] = el }}
                                        type="text"
                                        value={digit}
                                        maxLength={1}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => handleKeyDown(e, i)}
                                        className="w-10 sm:w-11 h-12 text-center text-lg font-black rounded-lg border border-border bg-muted/30 dark:bg-muted/10 focus:border-primary outline-none transition-all text-foreground"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                    />
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all">
                            {loading ? <Icon icon="solar:refresh-bold-duotone" width={18} className="animate-spin" /> : "Vérifier"}
                        </button>

                        <div className="text-center">
                            <button type="button" onClick={() => setStep(1)} className="text-xs text-muted-foreground font-semibold hover:text-primary">
                                Modifier le numéro
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: NEW PASSWORD */}
                {step === 3 && (
                    <form onSubmit={handleStep3} className="space-y-5">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[11px] sm:text-xs font-black text-muted-foreground">
                                    Nouveau mot de passe
                                </label>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] text-primary font-semibold flex items-center gap-1">
                                    {showPassword ? <Icon icon="solar:eye-closed-bold-duotone" width={12} /> : <Icon icon="solar:eye-bold-duotone" width={12} />}
                                    {showPassword ? "Masquer" : "Afficher"}
                                </button>
                            </div>
                            <div className="relative">
                                <Icon icon="solar:lock-password-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    placeholder="Nouveau mot de passe"
                                    required
                                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-muted/30 dark:bg-muted/10 outline-none focus:border-primary text-sm transition-all text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] sm:text-xs font-black text-muted-foreground">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Icon icon="solar:lock-password-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPwd}
                                    onChange={(e) => setConfirmPwd(e.target.value)}
                                    placeholder="Confirmer"
                                    required
                                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-muted/30 dark:bg-muted/10 outline-none focus:border-primary text-sm transition-all text-foreground"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || !newPwd || !confirmPwd} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all mt-4">
                            {loading ? <Icon icon="solar:refresh-bold-duotone" width={18} className="animate-spin" /> : "Mettre à jour le mot de passe"}
                        </button>
                    </form>
                )}

                {/* FOOTER */}
                <div className="text-center mt-8 pt-6 border-t border-border/50">
                    <Link href="/login" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                        <Icon icon="solar:arrow-left-bold-duotone" width={14} />
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
}
