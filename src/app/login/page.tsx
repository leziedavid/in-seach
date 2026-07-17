'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { login } from '@/api/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Role } from '@/types/interface';
import { useUserLocation } from '@/utils/location';
import { upsertLocationLog } from '@/api/api';
import { useTranslation } from '@/utils/langue/hooks';
import { AccountRecoveryModal } from '@/components/auth/AccountRecoveryModal';
import { RoleSelectionModal } from '@/components/auth/RoleSelectionModal';
import { InputPhone } from '@/components/ui/InputPhone';
import { useBiometrics } from '@/hooks/useBiometrics';

export default function LoginPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { getUserLocation } = useUserLocation();

    const { isAvailable, isEnabled, isConditionalUIAvailable, loading: bioLoading, error: bioError, hasExceededFailures, authenticate } = useBiometrics();
    const [lastPhone, setLastPhone] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('lastPhoneNumber');
        if (saved) setLastPhone(saved);

        // Pré-remplir le champ téléphone avec le numéro mémorisé (sans indicatif, comme login())
        if (saved) setIdentifier(saved);
    }, []);

    // Conditional UI : propose Face ID/Touch ID automatiquement via la suggestion
    // d'autofill du navigateur (Safari/Chrome), sans bouton, dès que les conditions sont réunies.
    useEffect(() => {
        if (!isAvailable || !isEnabled || !isConditionalUIAvailable || !lastPhone || hasExceededFailures) return;
        authenticate(lastPhone, true).catch(() => { });
    }, [isAvailable, isEnabled, isConditionalUIAvailable, lastPhone, hasExceededFailures]);

    const handleBiometricLogin = async () => {
        // Le backend cherche par { phone: identifier } sans indicatif (cohérent avec login())
        const id = lastPhone || identifier;
        if (!id) return;
        await authenticate(id);
    };

    const [useEmail, setUseEmail] = useState(false);
    const [indicatif, setIndicatif] = useState('+225');
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState(Array(4).fill('')); // OTP 4 chiffres
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    const inputsRef = useRef<HTMLInputElement[]>([]);

    const password = '@' + otp.join(''); // Ajout automatique du @

    /* ================= OTP LOGIC ================= */
    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return; // uniquement chiffres

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
            const res = await login(identifier, password); // OTP envoyé avec @
            if (res.statusCode === 200 || res.statusCode === 201) {
                setToken(res.data.accessToken);

                // Track location on login (background / non-blocking)
                getUserLocation().then(location => {
                    if (location && location.lat && location.lng) {
                        upsertLocationLog({
                            lat: location.lat,
                            lng: location.lng,
                            context: 'login'
                        }).catch(e => console.error("Background location logging failed:", e));
                    }
                }).catch(e => console.error("Background geolocation failed:", e));

                if (res.data.role === Role.ADMIN) {
                    router.push('/admin');
                } else if (res.data.role === Role.PRESTATAIRE) {
                    router.push('/akwaba');
                } else if (res.data.role === Role.ENTREPRISE) {
                    router.push('/akwaba');
                } else if (res.data.role === Role.CHAUFFEUR) {
                    router.push('/akwaba');
                } else if (res.data.role === Role.GAZIER) {
                    router.push('/akwaba');
                } else if (res.data.role === Role.MARKETING) {
                    router.push('/suivi_marketing');
                } else {
                    router.push('/');
                }
            } else {
                setError(res.message || t("auth.login.errors.invalid_credentials"));
            }
        } catch {


            setError(t("auth.login.errors.connection_error"));

        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= NEXT_PUBLIC_WEBAUTHN_RP_ID */
    return (
        <div className="flex flex-col items-center py-4 px-4 overflow-y-auto bg-transparent">
            <div className="w-full max-w-sm flex-1 bg-card p-6 sm:p-8 flex flex-col">

                {/* Header */}
                <div className="text-center space-y-2 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white mx-auto">
                        <Icon icon="solar:shield-check-bold-duotone" width={18} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">
                        {t("auth.login.title")}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("auth.login.subtitle")}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 flex-1" suppressHydrationWarning>

                    {error && (
                        <div className="p-2 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* info */}
                    <div className="p-2 text-sm bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                        {t("auth.login.info_box")}
                    </div>

                    {/* IDENTIFIER */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[11px] sm:text-xs font-black text-muted-foreground">
                                {useEmail ? t("auth.login.identifier_label_email") : t("auth.login.identifier_label_phone")}
                            </label>
                            <button type="button" className="text-xs font-semibold text-primary"
                                onClick={() => { setUseEmail(!useEmail); setIdentifier(''); }}>
                                {useEmail ? t("auth.login.switch_to_phone") : t("auth.login.switch_to_email")}
                            </button>
                        </div>

                        <div className="relative">
                            {useEmail ? (
                                <>
                                    <Icon icon="solar:letter-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder={t("auth.login.identifier_placeholder_email")}
                                        required
                                        autoComplete="username webauthn"
                                        className="w-full h-10 sm:h-11 pl-9 pr-3 rounded-lg border border-border bg-muted/30 dark:bg-muted/10 outline-none focus:border-primary text-xs sm:text-sm transition-all text-foreground"
                                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                        title={t("auth.login.errors.email_pattern")}
                                        inputMode="email"
                                        style={{ fontSize: '16px' }}
                                        suppressHydrationWarning
                                    />
                                </>
                            ) : (
                                <InputPhone indicatif={indicatif} phone={identifier} onPhoneChange={(val) => {
                                    setIndicatif(val.indicatif);
                                    setIdentifier(val.phone);
                                }} required className="bg-muted/30 dark:bg-muted/10 h-10 sm:h-11 border-border" />
                            )}
                        </div>
                    </div>

                    {/* OTP */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] sm:text-xs font-black text-muted-foreground">
                                {t("auth.login.password_label")}
                            </label>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary font-semibold flex items-center gap-1">
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
                                    className="w-10 sm:w-12 h-10 sm:h-12 text-center text-sm font-bold rounded-lg border border-border bg-muted/30 dark:bg-muted/10 focus:border-primary outline-none transition-all text-foreground"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    style={{ fontSize: '16px' }}
                                    suppressHydrationWarning
                                />
                            ))}
                        </div>
                    </div>

                    {/* BUTTON */}
                    <button type="submit" disabled={loading} className="w-full h-10 sm:h-12 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95">
                        {loading ? <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" /> : <>{t("auth.login.submit_button")} <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} /></>}
                    </button>

                    {/* BIOMETRIC LOGIN — visible si PWA + biométrie activée + identifiant disponible */}
                    {isAvailable && isEnabled && !hasExceededFailures && (lastPhone || identifier) && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-[10px] text-muted-foreground">ou</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                            {bioError && (<p className="text-xs text-red-500 text-center">{bioError}</p>)}
                            <button type="button" onClick={handleBiometricLogin} disabled={bioLoading} className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center transition-all active:scale-90 disabled:opacity-50" aria-label="Connexion biométrique">
                                {bioLoading ? <Icon icon="solar:refresh-bold-duotone" width={60} className="animate-spin text-blue-500" /> : <Icon icon="arcticons:face-id" width={60} className="text-blue-500" />}
                            </button>
                            <span className="text-[10px] text-muted-foreground">Face ID / Touch ID</span>
                            <p className="text-[9px] text-muted-foreground/70 text-center leading-tight max-w-[220px]">
                                Saisissez votre n° puis appuyez — Face ID s'activera seul au prochain lancement.
                            </p>
                        </div>
                    )}


                    {/* FOOTER */}
                    <div className="text-center flex flex-col items-center gap-1">
                        <Link href="/" className="text-primary font-bold hover:underline text-sm inline-flex items-center justify-center min-h-[35px] px-2">
                            {t("auth.login.back_to_home")}
                        </Link>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 flex-wrap min-h-[35px] px-2">
                            {t("auth.login.no_account")}
                            <button type="button" onClick={() => setIsRoleModalOpen(true)} className="text-primary font-bold hover:underline">
                                {t("auth.login.register_link")}
                            </button>
                        </p>
                        <Link href="/forgot-password" className="text-primary font-bold hover:underline inline-flex items-center gap-1.5 min-h-[35px] px-2 text-sm">
                            <Icon icon="solar:lock-keyhole-bold-duotone" width={14} />
                            Mot de passe oublié ?
                        </Link>
                    </div>


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

                    <div className="text-center pt-2">
                        <button type="button" onClick={() => setIsRecoveryModalOpen(true)} className="text-[11px] sm:text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 mx-auto opacity-70 hover:opacity-100">
                            <Icon icon="solar:question-circle-bold-duotone" width={14} />
                            {t("auth.login.recovery_link")}
                        </button>
                    </div>

                </form>

                <AccountRecoveryModal isOpen={isRecoveryModalOpen} onClose={() => setIsRecoveryModalOpen(false)} />
                <RoleSelectionModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />

            </div>
        </div>

    );
}
