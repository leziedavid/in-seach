"use client";

import { useEffect, useState } from 'react';
import { getRoles } from '@/api/api';

export interface SystemRoleOption {
    id: string; // code du rôle — valeur historiquement stockée dans User.role
    label: string;
}

// Rôles "système" (issus de la migration de l'ancien enum Prisma `Role`,
// isSystem=true côté RBAC) — seuls ceux-ci peuvent être écrits dans la
// colonne legacy `User.role`. Les rôles personnalisés créés depuis
// /admin/rbac/roles ne sont assignables qu'en dynamique (UserRole, page
// "Affectations"), pas depuis ces formulaires d'édition utilisateur.
//
// Remplace les anciennes listes ROLE_OPTIONS codées en dur — source unique :
// GET /roles (RBAC backend, déjà trié par `order`).
export function useSystemRoles() {
    const [roles, setRoles] = useState<SystemRoleOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getRoles({ limit: 100 })
            .then((res) => {
                if (!mounted) return;
                const data = res?.data?.data ?? [];
                setRoles(
                    data
                        .filter((r: any) => r.isSystem)
                        .map((r: any) => ({ id: r.code, label: r.name })),
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
