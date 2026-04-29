import { useCallback } from "react";
import { reverseGeocode as apiReverseGeocode } from "@/api/api";
import { UserLocation } from "@/types/interface";
import { useNotification } from "@/components/toast/NotificationProvider";

// ─── Cache module-level (partagé entre toutes les instances du hook) ──────────
// Durée de validité : 5 minutes. Evite N appels Nominatim pour un même rendu.
const CACHE_TTL_MS = 5 * 60 * 1000;
// Distance minimale (degrés ~0.001° ≈ 111 m) avant d'invalider le cache.
const CACHE_DISTANCE_THRESHOLD = 0.001;

let cachedLocation: UserLocation | null = null;
let cachedLat: number | null = null;
let cachedLng: number | null = null;
let cacheTimestamp = 0;

function isCacheValid(lat: number, lng: number): boolean {
    if (!cachedLocation || cachedLat === null || cachedLng === null) return false;
    if (Date.now() - cacheTimestamp > CACHE_TTL_MS) return false;
    const dLat = Math.abs(lat - cachedLat);
    const dLng = Math.abs(lng - cachedLng);
    return dLat < CACHE_DISTANCE_THRESHOLD && dLng < CACHE_DISTANCE_THRESHOLD;
}

// ─── Dédoublonnage : une seule requête en vol à la fois ──────────────────────
let inflightPromise: Promise<UserLocation | null> | null = null;

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useUserLocation = () => {
    const { showNotification } = useNotification();

    const getUserLocation = useCallback(async (): Promise<UserLocation | null> => {
        if (typeof window === "undefined") return null;

        if (!navigator.geolocation) {
            showNotification("La geolocalisation n'est pas disponible sur ce navigateur.", "error");
            return null;
        }

        // Si un appel est deja en cours, on attend sa resolution plutot que d'en lancer un second.
        if (inflightPromise) return inflightPromise;

        inflightPromise = new Promise<UserLocation | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    // Retourner le cache si la position n'a pas significativement change.
                    if (isCacheValid(latitude, longitude)) {
                        resolve(cachedLocation);
                        return;
                    }

                    try {
                        const data = await apiReverseGeocode(latitude, longitude);

                        const location: UserLocation = {
                            lat: latitude,
                            lng: longitude,
                            country: data.data?.address.country || null,
                            countryCode: data.data?.address.country_code || null,
                            city: data.data?.address.city || null,
                            district: data.data?.address.suburb || null,
                            street: data.data?.address.road || null,
                        };

                        // Mettre en cache
                        cachedLocation = location;
                        cachedLat = latitude;
                        cachedLng = longitude;
                        cacheTimestamp = Date.now();

                        resolve(location);
                    } catch (err) {
                        console.error("Impossible de recuperer l'adresse :", err);
                        showNotification("Impossible de recuperer votre adresse. Veuillez reessayer.", "error");
                        resolve(null);
                    }
                },
                (error) => {
                    console.error("Erreur geolocalisation :", error);
                    showNotification("Impossible d'obtenir votre position. Veuillez autoriser la geolocalisation.", "warning");
                    resolve(null);
                },
            );
        }).finally(() => {
            inflightPromise = null;
        });

        return inflightPromise;
    }, [showNotification]);

    return { getUserLocation };
};
