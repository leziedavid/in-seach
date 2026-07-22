"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMyRoles, getMyAuthorizations } from '@/api/api';
import { AuthorizationNode } from '@/types/interface';

interface AuthState {
    roles: string[];
    policies: string[];
    authorizations: AuthorizationNode[];
    hydrated: boolean;
    hydrating: boolean;
    hydrate: (force?: boolean) => Promise<void>;
    clear: () => void;
    can: (policyCode: string) => boolean;
    hasAuthorization: (authorizationCode: string) => boolean;
}

function findNode(nodes: AuthorizationNode[], code: string): boolean {
    return nodes.some((n) => n.code === code || findNode(n.children, code));
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            roles: [],
            policies: [],
            authorizations: [],
            hydrated: false,
            hydrating: false,

            // Récupère les rôles/policies/autorisations dynamiques de l'utilisateur connecté
            // (RBAC). Appelé au montage des composants qui pilotent le menu (Sidebar, admin
            // layout) — idempotent, ne re-fetch pas si déjà hydraté avec succès sauf `force`.
            // Important : ne marque `hydrated: true` que sur une réponse HTTP 200 — un échec
            // (401 après déconnexion, coupure réseau...) laisse `hydrated: false` pour permettre
            // un nouvel essai au prochain montage, plutôt que de figer un état vide.
            hydrate: async (force = false) => {
                if (get().hydrating) return;
                if (get().hydrated && !force) return;

                set({ hydrating: true });
                try {
                    const [rolesRes, authsRes] = await Promise.all([
                        getMyRoles(),
                        getMyAuthorizations(),
                    ]);
                    if (rolesRes?.statusCode === 200 && authsRes?.statusCode === 200) {
                        set({
                            roles: rolesRes.data?.roles ?? [],
                            policies: rolesRes.data?.policies ?? [],
                            authorizations: authsRes.data ?? [],
                            hydrated: true,
                        });
                    }
                } catch (error) {
                    console.error('Erreur hydratation RBAC:', error);
                } finally {
                    set({ hydrating: false });
                }
            },

            clear: () => set({ roles: [], policies: [], authorizations: [], hydrated: false }),

            can: (policyCode: string) => get().policies.includes(policyCode),

            hasAuthorization: (authorizationCode: string) => findNode(get().authorizations, authorizationCode),
        }),
        {
            name: 'djamko-rbac-store',
            // Ne jamais persister `hydrated`/`hydrating` : un échec (401, coupure réseau) ne
            // doit jamais se figer en localStorage comme un état "réussi" qui bloquerait tout
            // nouvel essai après un simple rechargement de page.
            partialize: (state) => ({
                roles: state.roles,
                policies: state.policies,
                authorizations: state.authorizations,
            }),
        },
    ),
);

if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', () => useAuthStore.getState().clear());
}
