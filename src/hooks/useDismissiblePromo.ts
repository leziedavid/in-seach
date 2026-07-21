"use client";

import { useEffect, useState } from "react";

export type PromoDismissMode = "session" | "ttl";

// Change ici pour basculer tous les messages promo vers l'Option 1 ("masqué le temps
// de la session en cours") — sinon Option 2 par défaut : réapparition après 24h.
const DEFAULT_PROMO_DISMISS_MODE: PromoDismissMode = "ttl";
const DEFAULT_PROMO_DISMISS_TTL_HOURS = 24;

interface UseDismissiblePromoOptions {
    mode?: PromoDismissMode;
    ttlHours?: number;
}

/**
 * Persistance de fermeture d'un message promo, indépendante par `id` — fermer un
 * message n'affecte jamais les autres (chacun a sa propre clé de stockage).
 * mode "session" → sessionStorage (masqué jusqu'à la fermeture complète de l'app).
 * mode "ttl"     → localStorage avec expiration (masqué pendant `ttlHours`, puis réaffiché).
 */
export function useDismissiblePromo(id: string, options?: UseDismissiblePromoOptions) {
    const mode = options?.mode ?? DEFAULT_PROMO_DISMISS_MODE;
    const ttlHours = options?.ttlHours ?? DEFAULT_PROMO_DISMISS_TTL_HOURS;
    const storageKey = `promo-dismissed:${id}`;

    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (mode === "session") {
            setDismissed(sessionStorage.getItem(storageKey) === "true");
            return;
        }
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            const expiresAt = Number(raw);
            if (Number.isFinite(expiresAt) && Date.now() < expiresAt) {
                setDismissed(true);
            } else {
                localStorage.removeItem(storageKey);
            }
        }
    }, [storageKey, mode]);

    const dismiss = () => {
        setDismissed(true);
        if (mode === "session") {
            sessionStorage.setItem(storageKey, "true");
        } else {
            localStorage.setItem(storageKey, String(Date.now() + ttlHours * 3600_000));
        }
    };

    return { dismissed, dismiss };
}
