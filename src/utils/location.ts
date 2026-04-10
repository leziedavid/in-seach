import { reverseGeocode as apiReverseGeocode } from "@/api/api";
import { UserLocation } from "@/types/interface";
import { useNotification } from "@/components/toast/NotificationProvider";

export const useUserLocation = () => {
    const { showNotification } = useNotification();

    const getUserLocation = async (): Promise<UserLocation | null> => {
        if (typeof window === 'undefined') return null;

        if (!navigator.geolocation) {
            showNotification("La géolocalisation n'est pas disponible sur ce navigateur.", "error");
            return null;
        }

        return new Promise<UserLocation | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

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

                        resolve(location);

                    } catch (err) {
                        console.error("Impossible de récupérer l'adresse :", err);
                        showNotification("Impossible de récupérer votre adresse. Veuillez réessayer.", "error");
                        resolve(null);
                    }
                },
                (error) => {
                    console.error("Erreur géolocalisation :", error);
                    showNotification("Impossible d'obtenir votre position. Veuillez autoriser la géolocalisation.", "warning");
                    resolve(null);
                }
            );
        });
    };

    return { getUserLocation };
};

