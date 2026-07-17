/**
 * Types de compte proposés à l'inscription publique (hors ADMIN/MARKETING,
 * créés uniquement depuis le backoffice admin).
 *
 * Reflète exactement les valeurs acceptées par le sélecteur de rôle de
 * src/app/register/page.tsx — source unique pour la modale de présélection
 * de rôle affichée depuis /login.
 */

import type { TKey } from '@/utils/langue';

export type RegisterRole = 'CLIENT' | 'PRESTATAIRE' | 'LOGISTICIAN' | 'LIVREUR' | 'GAZIER';

export interface RegisterRoleOption {
    value: RegisterRole;
    icon: string;
    labelKey: TKey;
    descKey: TKey;
}

export const REGISTER_ROLE_OPTIONS: RegisterRoleOption[] = [
    { value: 'CLIENT', icon: 'solar:user-bold-duotone', labelKey: 'auth.register.role_particular', descKey: 'auth.register.role_modal.desc_particular' },
    { value: 'PRESTATAIRE', icon: 'solar:case-minimalistic-bold-duotone', labelKey: 'auth.register.role_professional', descKey: 'auth.register.role_modal.desc_professional' },
    { value: 'LOGISTICIAN', icon: 'solar:case-minimalistic-bold-duotone', labelKey: 'auth.register.role_logistician', descKey: 'auth.register.role_modal.desc_logistician' },
    { value: 'LIVREUR', icon: 'solar:case-minimalistic-bold-duotone', labelKey: 'auth.register.role_deliverer', descKey: 'auth.register.role_modal.desc_deliverer' },
    { value: 'GAZIER', icon: 'solar:fire-bold-duotone', labelKey: 'auth.register.role_gas_provider', descKey: 'auth.register.role_modal.desc_gas_provider' },
];

/** Clé localStorage (via le wrapper `storage` à TTL) pour la présélection temporaire. */
export const PENDING_ROLE_STORAGE_KEY = 'pendingRegisterRole';

/** Durée de vie de la présélection — largement suffisant pour le temps de naviguer vers /register. */
export const PENDING_ROLE_TTL_SEC = 15 * 60;
