/**
 * Constantes de présentation pour le sélecteur de rôle proposé à l'inscription
 * publique (/register et RoleSelectionModal depuis /login).
 *
 * La LISTE des rôles proposés, leur ordre et leur disponibilité (actif vs
 * "bientôt disponible") viennent exclusivement du backend RBAC — voir
 * `getPublicRegisterRoles()` dans `src/api/api.ts` (GET /auth/register-roles)
 * et le hook `useRegisterRoles()`. Ce fichier ne contient plus qu'un lookup
 * i18n par code de rôle (le backend ne stocke le nom/la description qu'en
 * français — voir Authorization.name pour le même compromis déjà fait sur les
 * menus dynamiques) : si un rôle public existe côté backend sans entrée ici,
 * son name/description backend sert de repli, sans casser l'affichage.
 */

import type { TKey } from '@/utils/langue';

export interface RoleI18nKeys {
    labelKey: TKey;
    descKey: TKey;
}

export const ROLE_I18N_KEYS: Record<string, RoleI18nKeys> = {
    CLIENT: { labelKey: 'auth.register.role_particular', descKey: 'auth.register.role_modal.desc_particular' },
    PRESTATAIRE: { labelKey: 'auth.register.role_professional', descKey: 'auth.register.role_modal.desc_professional' },
    ENTREPRISE: { labelKey: 'auth.register.role_logistician', descKey: 'auth.register.role_modal.desc_logistician' },
    GAZIER: { labelKey: 'auth.register.role_gas_provider', descKey: 'auth.register.role_modal.desc_gas_provider' },
    GARAGISTE_VENTE_PIECE_AUTO: { labelKey: 'auth.register.role_garagiste', descKey: 'auth.register.role_modal.desc_garagiste' },
};

/** Rôles dont le champ "société" (company) doit être proposé lors de l'inscription. */
export const ROLES_WITH_COMPANY_FIELD = new Set(['PRESTATAIRE', 'ENTREPRISE', 'GAZIER', 'GARAGISTE_VENTE_PIECE_AUTO']);

/** Clé localStorage (via le wrapper `storage` à TTL) pour la présélection temporaire. */
export const PENDING_ROLE_STORAGE_KEY = 'pendingRegisterRole';

/** Durée de vie de la présélection — largement suffisant pour le temps de naviguer vers /register. */
export const PENDING_ROLE_TTL_SEC = 15 * 60;
