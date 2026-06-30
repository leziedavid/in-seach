'use client';

import { useState, useEffect, useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import {
    webAuthnGenerateRegistrationOptions,
    webAuthnVerifyRegistration,
    webAuthnGenerateLoginOptions,
    webAuthnVerifyLogin,
} from '@/api/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Role } from '@/types/interface';
import { usePWA } from '@/hooks/usePWA';

const LS_HAS_BIOMETRICS = 'hasBiometrics';
const LS_LAST_PHONE = 'lastPhoneNumber';
const MAX_FAILURES = 2;

export function useBiometrics() {
    const router = useRouter();
    const { isInstalled } = usePWA();
    const [isSupported, setIsSupported] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [failCount, setFailCount] = useState(0);

    useEffect(() => {
        const supported =
            typeof window !== 'undefined' &&
            !!window.PublicKeyCredential &&
            typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

        if (supported) {
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(setIsSupported)
                .catch(() => setIsSupported(false));
        }

        setIsEnabled(localStorage.getItem(LS_HAS_BIOMETRICS) === 'true');
    }, []);

    const register = useCallback(async (deviceName?: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const optionsResponse = await webAuthnGenerateRegistrationOptions();
            if (optionsResponse.statusCode && optionsResponse.statusCode !== 200) {
                throw new Error(optionsResponse.message || 'Failed to generate options');
            }

            const options = optionsResponse.data ?? optionsResponse;
            const attResp = await startRegistration({ optionsJSON: options });

            const verifyResponse = await webAuthnVerifyRegistration({
                response: JSON.stringify(attResp),
                deviceName,
            });

            if (verifyResponse.data?.verified) {
                localStorage.setItem(LS_HAS_BIOMETRICS, 'true');
                setIsEnabled(true);
                return true;
            }
            throw new Error('Registration verification failed');
        } catch (err: any) {
            setError(err?.message || 'Biometric registration failed');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const authenticate = useCallback(async (identifier: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const optionsResponse = await webAuthnGenerateLoginOptions(identifier);
            if (optionsResponse.statusCode && optionsResponse.statusCode !== 200) {
                throw new Error(optionsResponse.message || 'No biometric credentials found');
            }

            const options = optionsResponse.data ?? optionsResponse;
            const authResp = await startAuthentication({ optionsJSON: options });

            const verifyResponse = await webAuthnVerifyLogin({
                identifier,
                response: JSON.stringify(authResp),
            });

            if (verifyResponse.data?.accessToken) {
                setToken(verifyResponse.data.accessToken);
                localStorage.setItem(LS_LAST_PHONE, identifier);
                setFailCount(0);

                const role = verifyResponse.data.role;
                if (role === Role.ADMIN) router.push('/admin');
                else if ([Role.PRESTATAIRE, Role.ENTREPRISE, Role.CHAUFFEUR].includes(role as Role)) router.push('/akwaba');
                else router.push('/');
                return true;
            }
            throw new Error('Authentication failed');
        } catch (err: any) {
            const newCount = failCount + 1;
            setFailCount(newCount);
            setError(err?.message || 'Biometric authentication failed');
            return false;
        } finally {
            setLoading(false);
        }
    }, [failCount, router]);

    const disable = useCallback(async (): Promise<void> => {
        // Remove local flag — credentials stay in DB unless explicitly deleted
        localStorage.removeItem(LS_HAS_BIOMETRICS);
        setIsEnabled(false);
    }, []);

    const hasExceededFailures = failCount >= MAX_FAILURES;

    // La biométrie n'est disponible que si l'app est installée en PWA
    const isAvailable = isSupported && isInstalled;

    return {
        isSupported,
        isInstalled,
        isAvailable,
        isEnabled,
        loading,
        error,
        hasExceededFailures,
        register,
        authenticate,
        disable,
    };
}
