"use client";

import { useEffect, useState } from 'react';
import { getPublicRegisterRoles } from '@/api/api';
import { ROLE_I18N_KEYS } from '@/lib/registerRoleOptions';
import type { TKey } from '@/utils/langue';

export interface RegisterRoleOption {
    value: string;
    icon: string;
    active: boolean;
    labelKey?: TKey;
    descKey?: TKey;
    /** Nom/description bruts renvoyés par le backend — repli si aucune clé i18n locale n'existe pour ce code. */
    fallbackLabel: string;
    fallbackDesc: string;
}

// Source unique de vérité pour le sélecteur de rôle à l'inscription (RBAC
// backend, voir GET /auth/register-roles) — plus aucune liste codée en dur
// côté frontend.
export function useRegisterRoles() {
    const [roles, setRoles] = useState<RegisterRoleOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getPublicRegisterRoles()
            .then((res) => {
                if (!mounted) return;
                const data = res?.data ?? [];
                setRoles(
                    data.map((r) => ({
                        value: r.code,
                        icon: r.icon || 'solar:user-bold-duotone',
                        active: r.isPublicActive,
                        labelKey: ROLE_I18N_KEYS[r.code]?.labelKey,
                        descKey: ROLE_I18N_KEYS[r.code]?.descKey,
                        fallbackLabel: r.name,
                        fallbackDesc: r.description || '',
                    })),
                );
            })
            .catch(() => {
                if (mounted) setRoles([]);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    return { roles, loading };
}

export function roleLabel(opt: RegisterRoleOption, t: (key: TKey) => string): string {
    return opt.labelKey ? t(opt.labelKey) : opt.fallbackLabel;
}

export function roleDesc(opt: RegisterRoleOption, t: (key: TKey) => string): string {
    return opt.descKey ? t(opt.descKey) : opt.fallbackDesc;
}
