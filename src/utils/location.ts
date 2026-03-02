import { reverseGeocode as apiReverseGeocode } from "@/api/api";
import { UserLocation, ReverseGeocodeData } from "@/types/interface";

export const getUserLocation = async (): Promise<UserLocation | null> => {
    if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas disponible sur ce navigateur.");
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
                        city: data.data?.address.city || null,
                        district: data.data?.address.suburb || null,
                        street: data.data?.address.road || null,
                    };

                    resolve(location);

                } catch (err) {
                    console.error("Impossible de récupérer l'adresse :", err);
                    alert("Impossible de récupérer votre adresse. Veuillez réessayer.");
                    resolve(null);
                }
            },
            (error) => {
                console.error("Erreur géolocalisation :", error);
                alert("Impossible d'obtenir votre position. Veuillez autoriser la géolocalisation.");
                resolve(null);
            }
        );
    });
};
