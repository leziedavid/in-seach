'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { login } from '@/api/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const [useEmail, setUseEmail] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState(Array(4).fill('')); // OTP 4 chiffres
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                router.push('/');
            } else {
                setError(res.message || 'Identifiants invalides');
            }
        } catch {
            setError('Une erreur est survenue lors de la connexion');
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */
    return (
        <div className="min-h-screen flex flex-col items-center py-4 px-4 overflow-y-auto bg-transparent">
            <div className="w-full max-w-sm flex-1 bg-card p-6 sm:p-8 flex flex-col">

                {/* Header */}
                <div className="text-center space-y-2 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white mx-auto">
                        <Icon icon="solar:shield-check-bold-duotone" width={18} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground">
                        Connexion
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Accédez à votre espace
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 flex-1" suppressHydrationWarning>

                    {error && (
                        <div className="p-2 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* IDENTIFIER */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[11px] sm:text-xs font-black text-muted-foreground">
                                {useEmail ? 'Email' : 'Numéro de téléphone'}
                            </label>
                            <button type="button" className="text-xs font-semibold text-primary"
                                onClick={() => { setUseEmail(!useEmail); setIdentifier(''); }}>
                                {useEmail ? 'Se connecter par téléphone' : 'Se connecter par email'}
                            </button>
                        </div>

                        <div className="relative">
                            {useEmail ? (
                                <Icon icon="solar:letter-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            ) : (
                                <Icon icon="solar:phone-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            )}
                            <input
                                type={useEmail ? 'email' : 'tel'}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder={useEmail ? 'nom@exemple.com' : '+225 01 23 45 67'}
                                required
                                autoComplete={useEmail ? 'email' : 'tel'}
                                className="w-full h-10 sm:h-11 pl-9 pr-3 rounded-lg border border-border bg-muted/30 dark:bg-muted/10 outline-none focus:border-primary text-xs sm:text-sm transition-all text-foreground"
                                pattern={useEmail ? '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' : '^[0-9]{10}$'}
                                title={useEmail ? 'Veuillez entrer un email valide' : 'Veuillez entrer un numéro de téléphone valide'}
                                inputMode={useEmail ? 'email' : 'numeric'}
                                style={{ fontSize: '16px' }}
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    {/* OTP */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] sm:text-xs font-black text-muted-foreground">
                                Mot de passe
                            </label>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary font-semibold flex items-center gap-1">
                                {showPassword ? <Icon icon="solar:eye-closed-bold-duotone" width={14} /> : <Icon icon="solar:eye-bold-duotone" width={14} />}
                                {showPassword ? 'Masquer' : 'Voir'}
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
                        {loading ? <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" /> : <>Se connecter <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} /></>}
                    </button>


                    {/* FOOTER */}
                    <div className="text-center">
                        <p className="text-[11px] sm:text-xs text-muted-foreground mb-2">
                            <Link href="/" className="text-primary font-bold hover:underline">Retour à l'accueil</Link>
                        </p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                            Pas de compte ? <Link href="/register" className="text-primary font-bold hover:underline">Inscrivez-vous</Link>
                        </p>
                    </div>

                </form>



            </div>
        </div>

    );
}
