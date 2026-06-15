/**
 * localStorage avec TTL (Time-To-Live).
 * Remplace les accès directs à localStorage pour éviter les données périmées.
 *
 * Usage :
 *   storage.set('user_prefs', data, 60 * 60 * 24)  // expire dans 24h
 *   storage.get<UserPrefs>('user_prefs')             // null si expiré
 *   storage.remove('user_prefs')
 */

interface StorageEntry<T> {
    value: T;
    expiresAt: number | null; // timestamp ms, null = pas d'expiration
}

export const storage = {
    /**
     * @param key     Clé de stockage
     * @param value   Valeur à stocker (sera sérialisée en JSON)
     * @param ttlSec  Durée de vie en secondes (omis = pas d'expiration)
     */
    set<T>(key: string, value: T, ttlSec?: number): void {
        try {
            const entry: StorageEntry<T> = {
                value,
                expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : null,
            };
            localStorage.setItem(key, JSON.stringify(entry));
        } catch {
            // Silently ignore quota errors
        }
    },

    get<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;

            const entry = JSON.parse(raw) as StorageEntry<T>;

            // Donnée expirée : nettoyage automatique
            if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
                localStorage.removeItem(key);
                return null;
            }

            return entry.value;
        } catch {
            return null;
        }
    },

    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {
            // Silently ignore
        }
    },

    /**
     * Supprime toutes les entrées expirées — à appeler au démarrage de l'app
     * pour éviter l'accumulation de données obsolètes.
     */
    purgeExpired(): void {
        try {
            const toRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                try {
                    const raw = localStorage.getItem(key);
                    if (!raw) continue;
                    const entry = JSON.parse(raw) as StorageEntry<unknown>;
                    if (entry?.expiresAt !== undefined && entry.expiresAt !== null && Date.now() > entry.expiresAt) {
                        toRemove.push(key);
                    }
                } catch {
                    // Non-TTL entry, skip
                }
            }
            toRemove.forEach(k => localStorage.removeItem(k));
        } catch {
            // Silently ignore
        }
    },
} as const;
