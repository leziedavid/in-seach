'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { register } from '@/api/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    phone: z.string().min(8),
    role: z.enum(['CLIENT', 'PRESTATAIRE', 'LOGISTICIAN']),
    otp: z.string().length(5), // @ + 4 chiffres
    fullname: z.string().optional(),
    company: z.string().optional(),
});

export default function RegisterPage() {
    const router = useRouter();

    const [role, setRole] = useState<'CLIENT' | 'PRESTATAIRE' | 'LOGISTICIAN'>('CLIENT');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(Array(4).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [fullname, setFullname] = useState('');
    const [company, setCompany] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const inputsRef = useRef<HTMLInputElement[]>([]);

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
                phone: phone || undefined,
                otp: password,
                role,
                fullname: fullname || undefined,
                company: role === 'PRESTATAIRE' || role === 'LOGISTICIAN' && company ? company : undefined,
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
                setError(res.message || 'Une erreur est survenue');
            }
        } catch {
            setError('Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-4 px-4 overflow-y-auto">
            <div className="w-full max-w-sm flex-1 bg-white dark:bg-gray-900 p-6 sm:p-8 flex flex-col">

                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white mx-auto">
                        <Icon icon="solar:shield-check-bold-duotone" width={18} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Créer votre compte</h1>
                    <p className="text-xs sm:text-sm text-gray-500">Rejoignez la communauté et commencez dès maintenant.</p>
                </div>

                {/* Role Selector */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div onClick={() => setRole('CLIENT')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${role === 'CLIENT' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} >
                        <Icon icon="solar:user-bold-duotone" className={role === 'CLIENT' ? 'text-primary' : 'text-gray-400'} width={24} />
                        <span className={`text-xs font-bold ${role === 'CLIENT' ? 'text-primary' : 'text-gray-500'}`}>Particulier</span>
                    </div>
                    <div onClick={() => setRole('PRESTATAIRE')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${role === 'PRESTATAIRE' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} >
                        <Icon icon="solar:case-minimalistic-bold-duotone" className={role === 'PRESTATAIRE' ? 'text-primary' : 'text-gray-400'} width={24} />
                        <span className={`text-xs font-bold ${role === 'PRESTATAIRE' ? 'text-primary' : 'text-gray-500'}`}>Professionnel</span>
                    </div>
                    <div onClick={() => setRole('LOGISTICIAN')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${role === 'LOGISTICIAN' ? 'border-primary bg-primary/20' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`} >
                        <Icon icon="solar:case-minimalistic-bold-duotone" className={role === 'LOGISTICIAN' ? 'text-primary' : 'text-gray-400'} width={24} />
                        <span className={`text-xs font-bold ${role === 'LOGISTICIAN' ? 'text-primary' : 'text-gray-500'}`}>Logisticien</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {error && (
                        <div className="p-2 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-black text-gray-600">Email</label>
                        <div className="relative">
                            <Icon icon="solar:letter-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="email" value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nom@exemple.com"
                                required
                                className="w-full h-9 sm:h-11 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-primary text-xs sm:text-sm transition-all"
                                inputMode="email"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-black text-gray-600">Numéro de téléphone</label>
                        <div className="relative">
                            <Icon icon="solar:phone-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+225 01 23 45 67"
                                required
                                className="w-full h-9 sm:h-11 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-primary text-xs sm:text-sm transition-all"
                                inputMode="tel"
                                style={{ fontSize: '16px' }} />
                        </div>
                    </div>

                    {/* Optional Fullname */}
                    <div className="space-y-2">
                        <label className="text-[11px] sm:text-xs font-black text-gray-600">Nom & Prénom (optionnel)</label>
                        <div className="relative">
                            <Icon icon="solar:user-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                placeholder="Ex: Jean Dupont"
                                className="w-full h-9 sm:h-11 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:border-primary text-xs sm:text-sm transition-all"
                                inputMode="text"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Optional Company if PRESTATAIRE */}
                    {(role === 'PRESTATAIRE' || role === 'LOGISTICIAN') && (
                        <div className="space-y-2">
                            <label className="text-[11px] sm:text-xs font-black text-gray-600">Nom de votre entreprise (optionnel)</label>
                            <div className="relative">
                                <Icon icon="solar:case-minimalistic-bold-duotone" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="Ex: MonEntreprise SARL"
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
                            <label className="text-[11px] sm:text-xs font-black text-gray-600">Mot de passe</label>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary font-semibold flex items-center gap-1" >
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
                                    className="w-10 sm:w-12 h-10 sm:h-12 text-center text-sm font-bold rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:border-primary outline-none transition-all"
                                    inputMode="numeric"
                                    style={{ fontSize: '16px' }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading} className="w-full h-10 sm:h-12 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95" >
                        {loading ? <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" /> : <>Créer mon compte <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} /></>}
                    </button>

                </form>

                {/* Footer */}
                <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-6">
                    Déjà inscrit ? <Link href="/login" className="text-primary font-bold">Connectez-vous</Link>
                </p>



                {/* Footer petit */}
                <div className="text-center text-[9px] sm:text-[10px] text-gray-500 space-y-1 pt-2">
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                        <span className="text-gray-300">|</span>
                        <Link href="/terms-of-use" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                            Conditions Générales d'Utilisation
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link href="/privacy-policy" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                            Politique de confidentialité
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
